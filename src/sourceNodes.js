const path = require(`path`)

const Url = require(`url`)
const { execute } = require('apollo-link')
const { makePromise } = require('apollo-link')
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)
const { createHttpLink } = require('apollo-link-http')
const fetch = require('node-fetch')
const gql = require('graphql-tag')
const fs = require(`fs-extra`)
const mime = require(`mime`)
const prettyBytes = require(`pretty-bytes`)
const md5File = require(`bluebird`).promisify(require(`md5-file`))
const getPluginValues = require(`./plugin-values`)

const { slash } = require(`gatsby-core-utils`)

const headers = {}

let firstImage = true
const extsToProcess = { pdf: true, mp3: true, jpg: true, jpeg: true, png: true }

function createFilePath(directory, filename, ext) {
  return path.join(directory, `${filename}${ext}`)
}

function getParsedPath(url) {
  return path.parse(Url.parse(url).pathname)
}

function getRemoteFileName(url) {
  return getParsedPath(url).name
}

function getRemoteFileExtension(url) {
  return getParsedPath(url).ext
}

function findSmallerUrl(mediaDetails, rewritten) {
  // probably the image is too large, try and get a smaller version
  if (mediaDetails && mediaDetails.sizes && mediaDetails.sizes.length > 0) {
    let sizeToDownload = mediaDetails.sizes.find((size) => size.name === 'large')
    if (!sizeToDownload) {
      // otherwise choose the last one which is usually the biggest
      sizeToDownload = mediaDetails.sizes[mediaDetails.sizes.length - 1]
    }
    const smallerUrl = encodeURI(sizeToDownload.sourceUrl)
    return { sizeToDownload, smallerUrl }
  } else {
    return { sizeToDownload: null, smallerUrl: null }
  }
}

function buildGraphQlUrl(wordPressUrl) {
  const endsWithSlash = wordPressUrl.endsWith('/')
  const uri = wordPressUrl.endsWith('/graphql') ? wordPressUrl : endsWithSlash ? `${wordPressUrl}graphql` : `${wordPressUrl}/graphql`
  return uri
}

module.exports = async ({ actions, createNodeId, getCache, store, reporter, createContentDigest }, pluginOptions) => {
  const { createNode } = actions
  const { pathPrefix } = pluginOptions
  const pluginValues = getPluginValues(pathPrefix)
  const {
    wordPressUrl,
    supportedExtensions = extsToProcess,
    shouldDownloadMediaItem = pluginValues.shouldDownloadMediaItem,
  } = pluginOptions
  const uri = buildGraphQlUrl(wordPressUrl)
  const link = createHttpLink({
    uri,
    fetch,
    headers,
  })
  const query = gql`
    query FetchImages($after: String, $pageSize: Int!) {
      mediaItems(first: $pageSize, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          databaseId
          sourceUrl
          mediaItemUrl
          mediaDetails {
            sizes {
              name
              sourceUrl
            }
          }
        }
      }
    }
  `

  const createFileNode = async (pathToFile, createNodeId, pluginOptions = {}) => {
    const slashed = slash(pathToFile)
    const parsedSlashed = path.parse(slashed)
    const slashedFile = {
      ...parsedSlashed,
      absolutePath: slashed,
      // Useful for limiting graphql query with certain parent directory
      relativeDirectory: slash(path.relative(pluginOptions.path || process.cwd(), parsedSlashed.dir)),
    }
    const stats = await fs.stat(slashedFile.absolutePath)
    let internal

    if (stats.isDirectory()) {
      const contentDigest = createContentDigest({
        stats: stats,
        absolutePath: slashedFile.absolutePath,
      })
      internal = {
        contentDigest,
        type: `Directory`,
        description: `Directory "${path.relative(process.cwd(), slashed)}"`,
      }
    } else {
      const contentDigest = await md5File(slashedFile.absolutePath)
      const mediaType = mime.getType(slashedFile.ext)
      internal = {
        contentDigest,
        type: `File`,
        mediaType: mediaType ? mediaType : `application/octet-stream`,
        description: `File "${path.relative(process.cwd(), slashed)}"`,
      }
    } // Stringify date objects.

    return JSON.parse(
      JSON.stringify({
        // Don't actually make the File id the absolute path as otherwise
        // people will use the id for that and ids shouldn't be treated as
        // useful information.
        id: createNodeId(pathToFile),
        children: [],
        parent: null,
        internal,
        sourceInstanceName: pluginOptions.name || `__PROGRAMMATIC__`,
        absolutePath: slashedFile.absolutePath,
        relativePath: slash(path.relative(pluginOptions.path || process.cwd(), slashedFile.absolutePath)),
        extension: slashedFile.ext.slice(1).toLowerCase(),
        size: stats.size,
        prettySize: prettyBytes(stats.size),
        modifiedTime: stats.mtime,
        accessTime: stats.atime,
        changeTime: stats.ctime,
        birthTime: stats.birthtime,
        ...slashedFile,
        ...stats,
      })
    )
  }

  let hasNextPage
  let after
  let fileCount = 0
  const pageSize = 200
  const cache = getCache(`gatsby-source-filesystem`)
  const cache404 = getCache('gatsby-source-wpgraphql-images-404')
  const cacheTimeout = getCache('gatsby-source-wpgraphql-images-timeout')
  const pluginCacheDir = cache.directory // See if there's response headers for this url

  try {
    do {
      reporter.verbose(`fetching files from ${uri}, ${after}`)

      const { data } = await makePromise(execute(link, { query, variables: { after, pageSize } }))

      const numFiles = data.mediaItems.nodes.length
      fileCount += numFiles
      reporter.info(`done fetching ${numFiles} files from ${uri} count, ${fileCount}`)
      await Promise.all(
        data.mediaItems.nodes.map(async (node) => {
          let { sourceUrl, mediaItemUrl, mediaDetails, databaseId } = node
          sourceUrl = mediaItemUrl || sourceUrl
          if (!sourceUrl || sourceUrl === 'false') {
            return undefined
          }
          const rewritten = encodeURI(sourceUrl)
          const ext = getRemoteFileExtension(rewritten)
          const extWithoutDot = ext.startsWith('.') ? ext.substring(1) : ext

          if (!supportedExtensions[extWithoutDot]) {
            reporter.info(`not downloading because we dont process this ext ${rewritten}`)
            return undefined
          }
          if (!shouldDownloadMediaItem(sourceUrl)) {
            return undefined
          }

          const myData = { id: databaseId, mediaItemId: databaseId, sourceUrl: rewritten }
          const nodeContent = JSON.stringify(myData)
          const nodeMeta = {
            id: createNodeId(`wp-media-${databaseId}`),
            parent: null,
            children: [],
            internal: {
              type: `WordPressMediaItemLookup`,
              content: nodeContent,
              contentDigest: createContentDigest(myData),
            },
          }
          const newNode = Object.assign({}, myData, nodeMeta)
          createNode(newNode)

          // first check if we know that this is going to lead to a 404
          const is404 = await cache404.get(rewritten)
          if (is404) {
            reporter.info(`not downloading because we know its 404 ${rewritten}`)
            return undefined
          }
          const timeoutRec = await cacheTimeout.get(rewritten)
          if (timeoutRec) {
            // TODO check a reasonable retry count, since it currently takes freaking forever we will only try 1x
            if (timeoutRec.failCount > 0) {
              reporter.info(`not downloading because we know its timeout ${rewritten}`)
              return undefined
            }
          }

          const digest = createContentDigest(rewritten)
          const name = getRemoteFileName(rewritten)

          const filename = createFilePath(path.join(pluginCacheDir, digest), name, ext)
          const relativeFilename = filename.replace(process.cwd(), '.')

          const { sizeToDownload, smallerUrl } = findSmallerUrl(mediaDetails, rewritten)

          let smallerFilename = null
          let smallerRelativeFilename = null
          if (smallerUrl) {
            const smallerName = getRemoteFileName(smallerUrl)
            const smallerExt = getRemoteFileExtension(rewritten)
            const smallerDigest = createContentDigest(smallerUrl)
            smallerFilename = createFilePath(path.join(pluginCacheDir, smallerDigest), smallerName, smallerExt)
            smallerRelativeFilename = smallerFilename.replace(process.cwd(), '.')
          }

          if (fs.existsSync(filename)) {
            // the original image was already downloaded
            reporter.verbose(`file exists ${rewritten}, file ${relativeFilename}`)
            const fileNode = await createFileNode(filename, () => rewritten, {})
            fileNode.internal.description = `File "${rewritten}"`
            fileNode.url = rewritten
            fileNode.parent = null
            await createNode(fileNode, {
              name: `gatsby-source-filesystem`,
            })
            return fileNode
          } else if (smallerFilename && fs.existsSync(smallerFilename)) {
            // a smaller version of the image was already downloaded
            reporter.verbose(`smaller file exists: ${rewritten} file ${smallerRelativeFilename}`)
            const fileNode = await createFileNode(smallerFilename, () => rewritten, {})
            fileNode.internal.description = `File "${rewritten}" (smaller version)`
            fileNode.url = rewritten
            fileNode.parent = null
            await createNode(fileNode, {
              name: `gatsby-source-filesystem`,
            })
            return fileNode
          } else {
            if (firstImage) {
              firstImage = false
              reporter.warn('it seems your cache does not exist, if you have a backup, run `./restore-image-cache.sh` now')
            }
            // there is nothing cached yet for this image
            reporter.verbose(`no cache for ${rewritten} file ${relativeFilename}, downloading...`)

            try {
              const fileSystemNode = await createRemoteFileNode({
                url: rewritten,
                parentNodeId: null,
                store,
                getCache,
                createNode,
                createNodeId: () => rewritten,
                httpHeaders: headers,
                reporter,
              })
              return fileSystemNode
            } catch (e) {
              const errMsg = e.toString()
              if (errMsg.includes('TimeoutError:')) {
                if (smallerUrl) {
                  try {
                    reporter.warn(`timeout for ${rewritten} trying smaller version ${JSON.stringify(sizeToDownload)}`)
                    const smallerImageNode = await createRemoteFileNode({
                      url: smallerUrl,
                      parentNodeId: null,
                      store,
                      getCache,
                      createNode,
                      createNodeId: () => rewritten,
                      httpHeaders: headers,
                      reporter,
                    })
                    reporter.info(`successfully downloaded smaller image for url ${rewritten}, smaller url ${smallerUrl}`)
                    return smallerImageNode
                  } catch (e2) {
                    reporter.error(
                      `error creating remote node for smaller image ${rewritten}, ${e2.toString()}: ${JSON.stringify(sizeToDownload)}`,
                      e2
                    )
                  }
                } else {
                  let timeoutRecord = await cacheTimeout.get(rewritten)
                  if (timeoutRecord) {
                    timeoutRecord.failCount = timeoutRecord.failCount + 1
                  } else {
                    timeoutRecord = { failCount: 1 }
                  }
                  const msg = `timeout ${timeoutRecord.failCount} creating remote node for ${rewritten}, err: ${e.toString()}:`
                  reporter.error(msg, new Error(e))

                  await cacheTimeout.set(rewritten, timeoutRecord)
                }
              } else {
                const msg = `error creating remote node for ${rewritten}, err: ${e.toString()}:`
                reporter.error(msg, new Error(e))
                if (errMsg.includes('HTTPError:') && errMsg.includes(' 404 ')) {
                  reporter.warn(`remember404 ${rewritten}`)
                  await cache404.set(rewritten, true)
                }
              }
              return undefined
            }
          }
        })
      )
      hasNextPage = data.mediaItems.pageInfo.hasNextPage
      after = data.mediaItems.pageInfo.endCursor
    } while (hasNextPage)
  } catch (outerErr) {
    reporter.panic(`error fetching from server ${uri}`, outerErr)
  }
}

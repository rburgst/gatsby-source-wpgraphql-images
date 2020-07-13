const { downloadMediaFile, convertFileNodeToFluid, copyToStatic } = require(`./utils`)
const cheerio = require('cheerio')
const URIParser = require('urijs')
const getPluginValues = require(`./plugin-values`)

function checkWordpressUrl(url, wordpressUrl, uploadsUrl) {
  if (!url) {
    return url
  }
  // removes protocol to handle mixed content in a page
  let urlNoProtocol = url.replace(/^https?:/i, '')
  let uploadsUrlNoProtocol = uploadsUrl.replace(/^https?:/i, '')
  // gets relative uploads url
  let uploadsUrlRelative = new URIParser(uploadsUrl).path()
  // handling relative url
  const urlParsed = new URIParser(url)
  const isUrlRelative = urlParsed.is('relative')

  // if not relative root url or not matches uploads dir
  if (!(isUrlRelative && url.startsWith(uploadsUrlRelative)) && !urlNoProtocol.startsWith(uploadsUrlNoProtocol)) {
    return undefined
  }

  if (isUrlRelative) {
    url = urlParsed.absoluteTo(wordpressUrl).href()
  }
  return url
}

function checkWordpressUrls(origUrl, wordPressUrls, uploadsUrls) {
  for (let i = 0; i < wordPressUrls.length; i++) {
    const wordpressUrl = wordPressUrls[i]
    const uploadsUrl = uploadsUrls[i]
    const url = checkWordpressUrl(origUrl, wordpressUrl, uploadsUrl)
    if (url) {
      return url
    }
  }
  return undefined
}

function normalizeUrl(url, uploadsUrls, normalizedUrlPrefix) {
  let strippedUrl = url
  const queryPos = url.indexOf('?')
  if (queryPos > 0) {
    strippedUrl = url.substr(0, queryPos)
  }
  for (let i = 0; i < uploadsUrls.length; i++) {
    const uploadUrl = uploadsUrls[i]
    if (strippedUrl.startsWith(uploadUrl)) {
      return strippedUrl.replace(uploadUrl, normalizedUrlPrefix)
    }
  }
  return strippedUrl
}

/**
 * Parses sourced HTML looking for <img> and <a> tags
 * that come from the WordPress uploads folder
 * Copies over files to Gatsby static folder
 * Also does additional processing to "fix" WordPress content
 * - unwraps <p> that contain <img>
 * @param  {string} content               original sourced content
 * @param  {string} uploadsUrl            WordPress uploads url
 * @param  {string} wordPressUrl          WordPress site url
 * @param  {string} pathPrefix            Gatsby pathPrefix
 * @param  {bool}   generateWebp          is WebP required?
 * @param  {object} httpHeaders           custom httpHeaders
 * @param  {bool}   debugOutput           enables extra logging
 * @param  {object} params                Gatsby API object
 *
 * @return {string}                       processed HTML
 *
 * sourceParser(source, pluginOptions, params)
 */
module.exports = async function sourceParser(
  { content },
  { uploadsUrls, wordPressUrls, uploadsUrl, wordPressUrl, pathPrefix = '', generateWebp = true, httpHeaders = {}, debugOutput = false },
  params,
  context,
  download,
) {
  const { actions, store, cache, reporter, createNodeId, getNodeAndSavePathDependency } = params
  const { createNode } = actions

  const { imageOptions, supportedExtensions } = getPluginValues(pathPrefix)

  if (!content) {
    return ''
  }

  if (!uploadsUrls && uploadsUrl) {
    uploadsUrls = [uploadsUrl]
  }
  if (!wordPressUrls && wordPressUrl) {
    wordPressUrls = [wordPressUrl]
  }
  const $ = cheerio.load(content, { xmlMode: true, decodeEntities: false })

  let localRefs = []
  let pRefs = []
  let swapSrc = new Map()
  let foundRefs = []
  let didWork = false

  // noscript causes html parser errors, see https://github.com/remarkablemark/html-dom-parser/issues/25
  $('noscript').each((i, item) => {
    $(item).remove()
  })

  $('a, img, video, audio, source').each((i, item) => {
    let url = item.attribs.href || item.attribs.src || item.attribs.poster
    let urlKey = url

    if (!url) {
      return
    }
    url = checkWordpressUrls(url, wordPressUrls, uploadsUrls)
    if (!url) {
      return
    }

    if (localRefs.some(({ url: storedUrl }) => storedUrl === url)) {
      // console.log('found image (again):' , url);
      return
    }

    // console.log('found image:' , url);

    localRefs.push({
      url,
      urlKey,
      name: item.name,
      elem: $(item),
    })

    // wordpress wpautop wraps <img> with <p>
    // this causes react console message when replacing <img> with <Img> component
    // code below unwraps <img> and removes parent <p>
    if (item.name === 'img') {
      $(item)
        .parents('p')
        .each(function(index, element) {
          pRefs.push($(element))
          $(element).contents().insertAfter($(element))
        })
    }
    if (item.name === 'source') {
      $(item).parents('video').attr('data-gts-processed', 'true')
      $(item).parents('audio').attr('data-gts-processed', 'true')
    }
  })

  // deletes <p> elements
  pRefs.forEach((elem) => elem.remove())

  await Promise.all(
    localRefs.map(async (item) => {
      const sourceUrl = normalizeUrl(item.url, uploadsUrls, uploadsUrl)
      const sourceUri = encodeURI(sourceUrl)

      // first check if we have processed this url already

      let fileNode = foundRefs.find((fNode) => fNode.id === sourceUri || fNode.id === sourceUrl)
      let alreadyProcessedNode = !!fileNode
      if (!fileNode) {
        fileNode = context.nodeModel.getNodeById({ id: sourceUri, type: 'File' })
      }
      if (!fileNode) {
        fileNode = context.nodeModel.getNodeById({ id: sourceUrl, type: 'File' })
      }
      if (fileNode) {
        if (!alreadyProcessedNode) {
          foundRefs.push(fileNode)
        }

        swapSrc.set(item.urlKey, {
          src: sourceUri,
          id: fileNode.id,
          index: foundRefs.indexOf(fileNode),
        })
        return
        // if (supportedExtensions[imageNode.extension]) {
        //   try {
        //     const result = await context.nodeModel.runQuery({
        //         query: { filter: { parent: {id: { eq: sourceUri } } } },
        //         type: 'ImageSharp', firstOnly: false})
        //     const fluidResult = await convertFileNodeToFluid({
        //       generateWebp,
        //       fileNode: imageNode,
        //       imageOptions,
        //       reporter,
        //       cache,
        //     })
        //
        //     swapSrc.set(item.urlKey, {
        //       src: fluidResult.originalImg,
        //       id: fileNode.id,
        //       encoded: JSON.stringify(fluidResult),
        //     })
        //     return
        //
        //   } catch (err) {
        //     reporter.warn("error replacing with pre-downloaded image", err)
        //   }
        //
        // }
      }
      reporter.warn(`did not find ${sourceUri} in nodemodel`)

      if (download) {
        const fileNode = await downloadMediaFile({
          url: item.url,
          cache,
          store,
          createNode,
          createNodeId,
          httpHeaders,
        })

        didWork = true
        // non-image files are copied to the `/static` folder
        if (!supportedExtensions[fileNode.extension]) {
          let staticFile = copyToStatic({
            file: fileNode,
            getNodeAndSavePathDependency,
            context,
            pathPrefix,
          })

          swapSrc.set(item.urlKey, {
            src: staticFile,
            id: fileNode.id,
          })

          console.log(`Downloaded file: ${item.url}`)
          return
        }

        try {
          const fluidResult = await convertFileNodeToFluid({
            generateWebp,
            fileNode,
            imageOptions,
            reporter,
            cache,
          })

          swapSrc.set(item.urlKey, {
            src: fluidResult.originalImg,
            id: fileNode.id,
            encoded: JSON.stringify(fluidResult),
          })
        } catch (e) {
          console.log('Exception fluid', e)
        }

        console.log(`Downloaded file:`, item.url)
      }
    }),
  )

  $('img').each((i, item) => {
    let url = item.attribs.src
    let swapVal = swapSrc.get(url)
    if (!swapVal) {
      return
    }

    // console.log('swapping src',$(item).attr('src'), '=>', swapVal.src)
    $(item).attr('src', swapVal.src)
    if (swapVal.index !== undefined) {
      $(item).attr('data-gts-encfluid', swapVal.index)
    }
    $(item).removeAttr('srcset')
    $(item).removeAttr('sizes')
  })
  // ensure that cheerio does not produce empty divs which are invalid html
  // https://github.com/cheeriojs/cheerio/issues/1235
  $('div').filter((i, e) => !e.children.length).text('')
  $('p').filter((i, e) => !e.children.length).text('')

  $('video').each((i, item) => {
    let url = item.attribs.poster
    let swapVal = swapSrc.get(url)
    if (!swapVal) {
      return
    }

    // console.log('swapping src',$(item).attr('src'), '=>', swapVal.src)
    $(item).attr('poster', swapVal.src)
    if (swapVal.index !== undefined) {
      $(item).attr('data-gts-poster-encfluid', swapVal.index)
    }
  })
  $('audio').each((i, item) => {
    let url = item.attribs.poster
    let swapVal = swapSrc.get(url)
    if (!swapVal) {
      return
    }

    // console.log('swapping src',$(item).attr('src'), '=>', swapVal.src)
    $(item).attr('poster', swapVal.src)
    if (swapVal.index !== undefined) {
      $(item).attr('data-gts-poster-encfluid', swapVal.index)
    }
  })

  $('a').each((i, item) => {
    let url = item.attribs.href
    let swapVal = swapSrc.get(url)
    if (!swapVal) {
      return
    }

    // console.log('swapping href',$(item).attr('src'), '=>', swapVal.src)
    $(item).attr('href', swapVal.src)
    // prevents converting to <Link> in contentParser
    $(item).attr('data-gts-swapped-href', swapVal.index)
  })

  $('source').each((i, item) => {
    let url = item.attribs.src
    let swapVal = swapSrc.get(url)
    if (!swapVal) {
      return
    }

    // console.log('swapping href',$(item).attr('src'), '=>', swapVal.src)
    $(item).attr('src', swapVal.src)
    // prevents converting to <Link> in contentParser
    $(item).attr('data-gts-swapped-src', swapVal.index)
  })

  const result = $.html()
  return { parsed: result, didWork, foundRefs, parseTimestamp: Date.now() }
}

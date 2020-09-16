const { createContentDigest } = require('gatsby-core-utils')
const sourceParser = require('./sourceParser')
const debugLog = require('./utils').debugLog

const findExistingNode = (uri, allNodes, fieldName) => allNodes.find((node) => node.sourceUri === uri)

const postsBeingParsed = new Map()

function calculateCacheKey(uri, fieldName, info, content) {
  if (uri === 'nouri') {
    return 'nocache'
  }
  const resolverTypeName = info.parentType.name
  const digest = createContentDigest(content)
  return uri + '|' + fieldName + '|' + resolverTypeName + '|' + digest
}

async function getCachedValue(cacheTimeInSeconds, uri, logger, fieldName, cacheKey) {
  logger('checking cached value for', uri)
  let resultPromise = await postsBeingParsed.get(cacheKey)
  let useCacheValue = true

  if (resultPromise.parseTimestamp) {
    const age = Date.now() - resultPromise.parseTimestamp
    if (cacheTimeInSeconds > 0 && age > cacheTimeInSeconds * 1000) {
      postsBeingParsed.delete(cacheKey)
      useCacheValue = false
    }
  }
  return useCacheValue ? resultPromise : undefined
}

module.exports = async function createResolvers(params, pluginOptions) {
  const contentNodeType = 'ParsedWordPressContent'
  const { createResolvers, getNodesByType, reporter, getCache } = params
  const {
    processPostTypes = [],
    customTypeRegistrations = [],
    debugOutput = false,
    keyExtractor = (source, context, info) => source.uri,
    cacheTimeInSeconds = -1,
  } = pluginOptions

  const logger = (...args) => {
    args.unshift('>>>')
    debugLog(debugOutput, ...args)
  }

  // `content` field Resolver
  // - passes content to sourceParser
  // - saves (caches) the result to a `ParsedWordPressContent` node
  // - repeat request for the same content (determined by uri) returns cached result
  const contentResolverFiles = async (source, args, context, info) => {
    // const { uri, path } = source;
    let uri = keyExtractor(source, context, info) || 'nouri'
    logger('Entered contentResolverFiles @', uri || 'URI not defined, skipping')
    let fieldName = info.fieldName
    if (info.fieldName.endsWith('Files')) {
      fieldName = fieldName.substring(0, fieldName.length - 5)
    }
    let content = source[fieldName]

    // uri works as a key for caching/processing functions
    // bails if no uri
    if (!uri) {
      return undefined
    }
    if (!content) {
      return content
    }

    const cacheKey = calculateCacheKey(uri, fieldName, info, content)

    // if a node with a given URI exists
    const cached = findExistingNode(uri, getNodesByType(contentNodeType), fieldName)
    // returns content from that node
    if (cached) {
      logger('node already created:', uri)
      return cached.foundRefs
    }

    // returns promise
    if (postsBeingParsed.has(cacheKey)) {
      logger('node is already being parsed:', uri)
      const cachedResult = await getCachedValue(cacheTimeInSeconds, uri, logger, fieldName, cacheKey)

      if (cachedResult) {
        return cachedResult.foundRefs
      }
    }

    const parsing = (async () => {
      try {
        logger('will start parsing:', uri)
        const parseResult = await sourceParser({ content }, pluginOptions, params, context, false)
        return parseResult
      } catch (e) {
        console.log(`Failed sourceParser at ${uri}`, e)
        return { parsed: content, foundRefs: [] }
      }
    })()

    if (cacheKey !== 'nocache') {
      postsBeingParsed.set(cacheKey, parsing)
    }

    let finalRes = await parsing
    return finalRes.foundRefs
  }

  // `content` field Resolver
  // - passes content to sourceParser
  // - saves (caches) the result to a `ParsedWordPressContent` node
  // - repeat request for the same content (determined by uri) returns cached result
  const contentResolverParsed = async (source, args, context, info) => {
    // const { uri, path } = source;
    let uri = keyExtractor(source, context, info) || 'nouri'
    logger('Entered contentResolver @', uri || 'URI not defined, skipping')
    let fieldName = info.fieldName
    if (info.fieldName.endsWith('Parsed')) {
      fieldName = fieldName.substring(0, fieldName.length - 6)
    }
    let content = source[fieldName]

    // uri works as a key for caching/processing functions
    // bails if no uri
    if (!uri) {
      return undefined
    }

    if (!content) {
      return content
    }

    const cacheKey = calculateCacheKey(uri, fieldName, info, content)
    // if a node with a given URI exists
    const cached = findExistingNode(uri, getNodesByType(contentNodeType), fieldName)
    // returns content from that node
    if (cached) {
      logger('node already created:', uri)
      return cached.parsedContent
    }

    // returns promise
    if (postsBeingParsed.has(cacheKey)) {
      logger('node is already being parsed:', uri)
      const cachedResult = await getCachedValue(cacheTimeInSeconds, uri, logger, fieldName, cacheKey)

      if (cachedResult) {
        return cachedResult.parsed
      }
    }
    const parsing = (async () => {
      try {
        logger('will start parsing:', uri)
        const parseResult = await sourceParser({ content }, pluginOptions, params, context, false)
        return parseResult
      } catch (e) {
        console.log(`Failed sourceParser at ${uri}`, e)
        return { parsed: content }
      }
    })()

    if (cacheKey !== 'nocache') {
      postsBeingParsed.set(cacheKey, parsing)
    }

    let finalRes = await parsing
    return finalRes.parsed
  }

  processPostTypes.forEach((element) => {
    let params = {}
    const resolverTypeName = `${pluginOptions.graphqlTypeName}_${element}`
    const resolverFieldName = 'content'
    params[resolverTypeName] = {
      contentFiles: {
        type: ['File'],
        resolve: contentResolverFiles,
      },
      contentParsed: {
        type: 'String',
        resolve: contentResolverParsed,
      },
    }
    logger('Registering ', resolverTypeName)

    createResolvers(params)
  })
  customTypeRegistrations.forEach((registration) => {
    let params = {}
    const resolverTypeName = registration.graphqlTypeName
    const resolverFieldName = registration.fieldName
    params[resolverTypeName] = {
      [`${resolverFieldName}Files`]: {
        type: ['File'],
        resolve: contentResolverFiles,
      },
      [`${resolverFieldName}Parsed`]: {
        type: 'String',
        resolve: contentResolverParsed,
      },
    }
    logger('Registering custom resolver ', resolverTypeName + '.' + resolverFieldName)

    createResolvers(params)

    createResolvers({
      WPAPI_MediaItem: {
        mediaItemUrlSharp: {
          type: 'File',
          resolve: async (source, args, context) => {
            const sourceUrl = source.sourceUrl || source.mediaItemUrl
            if (!sourceUrl) {
              return undefined
            }
            const sourceUri = encodeURI(sourceUrl)
            const imageNode = context.nodeModel.getNodeById({
              id: sourceUri,
              type: 'File',
            })
            if (!imageNode) {
              const lcaseUrl = sourceUrl.toLowerCase()
              if (lcaseUrl.endsWith('.jpg') || lcaseUrl.endsWith('.jpeg') || lcaseUrl.endsWith('.png')) {
                reporter.warn(`cannot find image node for id ${sourceUri}, source: ${JSON.stringify(source)}`)
              } else {
                // this is not an image, so dont log anything
              }
              const cache = getCache('gatsby-source-wpgraphql-images-notfound')
              await cache.set(sourceUri, { url: sourceUrl, uri: sourceUri })
            }
            return imageNode
          },
        },
      },
    })
  })
}

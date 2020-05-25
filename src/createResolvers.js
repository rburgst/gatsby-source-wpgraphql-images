const sourceParser = require('./sourceParser')
const debugLog = require('./utils').debugLog

const findExistingNode = (uri, allNodes) => allNodes.find((node) => node.sourceUri === uri)

const postsBeingParsed = new Map()

module.exports = async function createResolvers(params, pluginOptions) {
  const contentNodeType = 'ParsedWordPressContent'
  const { createResolvers, getNodesByType, reporter, getCache } = params
  const {
    processPostTypes = [],
    customTypeRegistrations = [],
    debugOutput = false,
    keyExtractor = (source, context, info) => source.uri,
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
    let uri = keyExtractor(source, context, info)
    // FIXME dont check this in
    if (!uri) {
      uri = 'sepp ' + Math.random()
    }
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

    // if a node with a given URI exists
    const cached = findExistingNode(uri, getNodesByType(contentNodeType))
    // returns content from that node
    if (cached) {
      logger('node already created:', uri)
      return cached.foundRefs
    }

    // returns promise
    if (postsBeingParsed.has(uri)) {
      logger('node is already being parsed:', uri)
      let resultPromise = await postsBeingParsed.get(uri)
      return resultPromise.foundRefs
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

    postsBeingParsed.set(uri, parsing)

    let finalRes = await parsing
    return finalRes.foundRefs
  }

  // `content` field Resolver
  // - passes content to sourceParser
  // - saves (caches) the result to a `ParsedWordPressContent` node
  // - repeat request for the same content (determined by uri) returns cached result
  const contentResolverParsed = async (source, args, context, info) => {
    // const { uri, path } = source;
    let uri = keyExtractor(source, context, info)
    // FIXME dont check this in
    if (!uri) {
      uri = 'sepp ' + Math.random()
    }
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

    // if a node with a given URI exists
    const cached = findExistingNode(uri, getNodesByType(contentNodeType))
    // returns content from that node
    if (cached) {
      logger('node already created:', uri)
      return cached.parsedContent
    }

    // returns promise
    if (postsBeingParsed.has(uri)) {
      logger('node is already being parsed:', uri)
      let resultVal = await postsBeingParsed.get(uri)
      return resultVal.parsed
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

    postsBeingParsed.set(uri, parsing)

    let finalRes = await parsing
    return finalRes.parsed
  }

  processPostTypes.forEach((element) => {
    let params = {}
    params[`${pluginOptions.graphqlTypeName}_${element}`] = {
      contentFiles: {
        type: ['File'],
        resolve: contentResolverFiles,
      },
      contentParsed: {
        type: 'String',
        resolve: contentResolverParsed,
      },
    }
    logger('Registering ', `${pluginOptions.graphqlTypeName}_${element}`)

    createResolvers(params)
  })
  customTypeRegistrations.forEach((registration) => {
    let params = {}
    params[registration.graphqlTypeName] = {
      [`${registration.fieldName}Files`]: {
        type: ['File'],
        resolve: contentResolverFiles,
      },
      [`${registration.fieldName}Parsed`]: {
        type: 'String',
        resolve: contentResolverParsed,
      },
    }
    logger('Registering custom resolver ', registration.graphqlTypeName)

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

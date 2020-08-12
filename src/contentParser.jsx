/** @jsx jsx */
import { jsx } from "theme-ui"

import { Link } from 'gatsby'
import Img from 'gatsby-image'
import parser, { domToReact } from 'html-react-parser'
import getByPath from 'lodash/get'
import URIParser from 'urijs'
import React from 'react'

/**
 * swaps external URLs in <a> and <img> elements if they were downloaded and are available locally
 * returns React elements
 * @param  {string} content             post content
 * @param  {string} wordPressUrl        wordpress uploads url
 * @param  {string} uploadsUrl          wordpress site url
 * @return {React}                      React elements
 *
 * contentParser(content, pluginOptions)
 */
export default function contentParser({ content, files }, { wordPressUrl, uploadsUrl }) {
  if (typeof content === 'undefined') {
    console.log('ERROR: contentParser requires content parameter to be string but got undefined.')
  }

  if (typeof content !== 'string') {
    return content
  }

  const subdirectoryCorrection = (path, wordPressUrl) => {
    const wordPressUrlParsed = new URIParser(wordPressUrl)
    // detect if WordPress is installed in subdirectory
    const subdir = wordPressUrlParsed.path()
    return path.replace(subdir, '/')
  }

  const parserOptions = {
    htmlparser2: {
      decodeEntities: true,
      xmlMode: true
    },
    replace: (domNode) => {
      let elementUrl = (domNode.name === 'a' && domNode.attribs.href)
        || (domNode.name === 'img' && domNode.attribs.src)
        || (domNode.name === 'video' && domNode.attribs.poster)
        || (domNode.name === 'source' && domNode.attribs.src)
        || null

      if (!elementUrl) {
        return
      }

      let urlParsed = new URIParser(elementUrl)

      // TODO test if this hash handling is sufficient
      if (elementUrl === urlParsed.hash()) {
        return
      }

      // handling relative url
      const isUrlRelative = urlParsed.is('relative')

      if (isUrlRelative) {
        urlParsed = urlParsed.absoluteTo(wordPressUrl)
        elementUrl = urlParsed.href()
      }

      // removes protocol to handle mixed content in a page
      let elementUrlNoProtocol = elementUrl.replace(/^https?:/i, '')
      let uploadsUrlNoProtocol = uploadsUrl.replace(/^https?:/i, '')
      let wordPressUrlNoProtocol = wordPressUrl.replace(/^https?:/i, '')

      let className = getByPath(domNode, 'attribs.class', '')
      let imageClassName = className + ' inline-parsed-img'
      // links to local files have this attribute set in sourceParser
      let linkHrefIndex = getByPath(domNode, 'attribs[data-gts-swapped-href]', null)


      // replaces local links with <Link> element
      if (
        domNode.name === 'a' &&
        linkHrefIndex === null
        &&
        elementUrlNoProtocol.includes(wordPressUrlNoProtocol) &&
        !elementUrlNoProtocol.includes(uploadsUrlNoProtocol)
      ) {
        let url = urlParsed.path()
        url = subdirectoryCorrection(url, wordPressUrl)
        let queryParams = urlParsed.query()
        if (queryParams) {
          url = url + "?" + queryParams
        }
        const hash = urlParsed.hash()
        if (hash) {
          url = url + hash
        }
        const htmlOptions = {}
        if (className !== '') {
          htmlOptions.className = className
        }
        return (
          <Link to={url} {...htmlOptions}>
            {domToReact(domNode.children, parserOptions)}
          </Link>
        )
      }

      // replaces local links to files with <Link> element
      if (
        domNode.name === 'a' &&
        files &&
        linkHrefIndex !== null
      ) {
        const parsedIndex = parseInt(linkHrefIndex, 10)
        if (files.length <= parsedIndex) {
          throw new Error(`did not find image with index ${parsedIndex}, have files: ${JSON.stringify(files)}`)
        }
        let url = files[parsedIndex].publicURL
        // url = subdirectoryCorrection(url, wordPressUrl)
        return (
          <a href={url} className={imageClassName}>
            {domToReact(domNode.children, parserOptions)}
          </a>
        )
      }

      // cleans up internal processing attribute
      if (linkHrefIndex) {
        delete domNode.attribs['data-gts-swapped-href']
      }

      let videoPosterIndex = getByPath(domNode, 'attribs[data-gts-poster-encfluid]', null)
      const videoProcessed = getByPath(domNode, 'attribs[data-gts-processed]', null)
      if (domNode.name === 'video' && files && videoPosterIndex !== null) {
        const parsedIndex = parseInt(videoPosterIndex, 10)
        if (files.length <= parsedIndex) {
          throw new Error(`did not find image with index ${parsedIndex}, have files: ${JSON.stringify(files)}`)
        }
        let posterFile = files[parsedIndex]
        let url = posterFile?.childImageSharp?.fluid?.srcWebp ?? posterFile?.childImageSharp?.fluid?.src ?? posterFile?.childImageSharp?.resize?.src ?? posterFile.publicURL

        const domAttribs = { ...domNode.attribs, poster: url }
        if (!domAttribs.preload) {
          domAttribs.preload = 'metadata'
        }
        // rewrite the class => classname
        const className = domAttribs.class
        if (className) {
          delete domAttribs.class
          domAttribs.className = className
        }
        delete domAttribs['data-gts-poster-encfluid']
        delete domAttribs['data-gts-processed']
        // url = subdirectoryCorrection(url, wordPressUrl)
        return (
          <video {...domAttribs}>
            {domToReact(domNode.children, parserOptions)}
          </video>
        )
      }

      if (videoPosterIndex) {
        delete domNode.attribs['data-gts-poster-encfluid']
      }
      if (domNode.name === 'audio' && files && getByPath(domNode, 'attribs[data-gts-processed]', null)) {
        const domAttribs = { ...domNode.attribs }
        delete domAttribs['data-gts-processed']
        return (
          <audio {...domAttribs}>
            {domToReact(domNode.children, parserOptions)}
          </audio>
        )
      }

      let sourceSrcIndex = getByPath(domNode, 'attribs[data-gts-swapped-src]', null)

      if (domNode.name === 'source' && files && sourceSrcIndex !== null) {
        const parsedIndex = parseInt(sourceSrcIndex, 10)
        if (files.length <= parsedIndex) {
          throw new Error(`did not find source with index ${parsedIndex}, have files: ${JSON.stringify(files)}`)
        }
        let url = files[parsedIndex].publicURL

        const domAttribs = { ...domNode.attribs, src: url }
        delete domAttribs['data-gts-swapped-src']

        // url = subdirectoryCorrection(url, wordPressUrl)
        return (
          <source {...domAttribs}/>
        )
      }

      if (sourceSrcIndex) {
        delete domNode.attribs['data-gts-swapped-src']
      }
      // data passed from sourceParser
      const fluidData = domNode.name === 'img' && getByPath(domNode, 'attribs[data-gts-encfluid]', null)

      if (domNode.name === 'img' && fluidData && files) {
        const fluidIndex = parseInt(fluidData, 10)
        const fluidDataParsed = files[fluidIndex].childImageSharp.fluid

        let altText = getByPath(domNode, 'attribs.alt', '')
        let imageTitle = getByPath(domNode, 'attribs.title', null)

        if (imageTitle && !altText) {
          altText = imageTitle
        }

        // respects original "width" attribute
        // sets width accordingly
        let extraSx = {}
        if (domNode.attribs.width && !Number.isNaN(Number.parseInt(domNode.attribs.width, 10))) {
          extraSx.width = `${domNode.attribs.width}px`
        }

        return (
          <Img
            style={extraSx}
            fluid={fluidDataParsed}
            className={imageClassName}
            alt={altText}
            title={imageTitle}
          />
        )
      }
    },
  }

  let parseResult = parser(content, parserOptions)
  return parseResult
}

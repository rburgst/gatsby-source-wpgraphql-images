import { Link } from 'gatsby'
import Img from 'gatsby-image'
import parser, { domToReact } from 'html-react-parser'
import getByPath from 'lodash/get'
/** @jsx jsx */
import { jsx } from 'theme-ui'
import { Styled } from 'theme-ui'
import URIParser from 'urijs'
import React from 'react';

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
    replace: (domNode) => {
      let elementUrl = (domNode.name === 'a' && domNode.attribs.href) || (domNode.name === 'img' && domNode.attribs.src) || null

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

      let className = getByPath(domNode, 'attribs.class', '') + ' inline-parsed-img'
      // links to local files have this attribute set in sourceParser
      let wasLinkProcessed = getByPath(domNode, 'attribs[data-gts-swapped-href]', null)

      // replaces local links with <Link> element
      if (
        domNode.name === 'a' &&
        files &&
        wasLinkProcessed !== undefined
      ) {
        const parsedIndex = parseInt(wasLinkProcessed, 10)
        if (files.length <= parsedIndex) {
          throw new Error(`did not find image with index ${parsedIndex}, have files: ${JSON.stringify(files)}`)
        }
        let url = files[parsedIndex].publicURL;
        // url = subdirectoryCorrection(url, wordPressUrl)
        return (
          <Styled.a as={Link} to={url} className={className}>
            {domToReact(domNode.children, parserOptions)}
          </Styled.a>
        )
      }

      // cleans up internal processing attribute
      if (wasLinkProcessed) {
        delete domNode.attribs['data-gts-swapped-href']
      }

      // data passed from sourceParser
      const fluidData = domNode.name === 'img' && getByPath(domNode, 'attribs[data-gts-encfluid]', null)

      if (fluidData && files) {
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
            sx={{
              variant: 'styles.SourcedImage',
              ...extraSx,
            }}
            fluid={fluidDataParsed}
            className={className}
            alt={altText}
            title={imageTitle}
          />
        )
      }
    },
  }

  return parser(content, parserOptions)
}

# gatsby-source-wpgraphql-images

## Important

This is a still early version of the plugin, your mileage may vary!

## Description

This plugin is a variant of [`gatsby-plugin-graphql-image`](https://github.com/Rocketmakers/gatsby-plugin-graphql-image) and [`gatsby-wpgraphql-inline-images`](https://github.com/progital/gatsby-wpgraphql-inline-images).
It is a source plugin that will download all media items from wordpress (warning this can take a _long_ time) and attempts to aggressively cache these for future rebuilds.

The problem with the above mentioned plugins is that they will cause frequent rebuilds of
the whole page tree which (depending on your wordpress instance) can take a significant amount of time.
For more information about this problem, see 

* https://github.com/gatsbyjs/gatsby/issues/15906
* https://github.com/gatsbyjs/gatsby/issues/20083

In addition these plugins dont aggressively cache the wordpress media files and on every rebuild
it will cause a HTTP HEAD request for every media item therefore, additionally increasing
the build times.

- Downloads images and other files to Gatsby `static` folder
- Replaces `<a>` linking to site's pages with `<Link>` component
- Replaces `<img>` with Gatsby `<Img>` component leveraging all of the [gatsby-image](https://www.gatsbyjs.org/docs/using-gatsby-image/) rich functionality

### Dependencies

This plugin processes WordPress content sourced with GraphQL. Therefore you must use `gatsby-source-graphql` and your source WordPress site must use [WPGraphQL](https://github.com/wp-graphql/wp-graphql).

_Attention:_ does not work with `gatsby-source-wordpress`.

## How to install

```bash
yarn add gatsby-source-wpgraphql-images
```

```javascript
{
  resolve: 'gatsby-source-wpgraphql-images',
  options: {
    wordPressUrl: 'https://mydomain.com/',
    uploadsUrl: 'https://mydomain.com/wp-content/uploads/',
    processPostTypes: ['Page', 'Post', 'CustomPost'],
    graphqlTypeName: 'WPGraphQL',
    httpHeaders: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }
  },
},
```

## Available options

`wordPressUrl` and `uploadsUrl` contain URLs of the source WordPress site and it's `uploads` folder respectively.

`processPostTypes` determines which post types to process. You can include [custom post types](https://docs.wpgraphql.com/getting-started/custom-post-types) as defined in WPGraphQL.

`customTypeRegistrations` allows additional registration of parsed html content for arbitrary graphql types. For more information, see examples below.

`keyExtractor` a function that extracts the cache key for a specific node, typically this is the `uri` of a post.

`graphqlTypeName` should contain the same `typeName` used in `gatsby-source-graphql` parameters.

`generateWebp` _(boolean)_ adds [WebP images](https://www.gatsbyjs.org/docs/gatsby-image/#about-withwebp).

`httpHeaders` Adds extra http headers to download request if passed in.

`debugOutput` _(boolean)_ Outputs extra debug messages.

`shouldDownloadMediaItem` a function that takes an URL of a media file and decides whether it should
be downloaded or not. Allows more complex configuration.

`supportedExtensions` a map in the form of

```javascript
{ pdf: true, mp3: true, jpg: true, jpeg: true, png: true }
```

that determines which types of media files should be downloaded. Note that this check is done before `shouldDownloadMediaItem` is called

## How to use this plugin

Downloading and optimizing images is done automatically via resolvers. You need to include `uri` in all queries that will be processed by the plugin otherwise they will be ignored.
In addition this plugin will also add custom resolvers for the specified graphql types with the format

For instance, lets assume we have `content` on the type `WPGraphQL`, then you need to additionally query
`contentParsed` and `contentFiles`.
The resolver will parse the `content`, prepare inline `img` and `a` tags and look for previously downloaded media files for this url.

```graphql
query GET_PAGES {
  wpgraphql {
    pages {
      nodes {
        uri
        content
        contentFiles
        contentParsed
      }
    }
  }
}
```

There is an additional step of processing content that must be added manually to a page template. This additional processing replaces remote urls with links to downloaded files in Gatsby's static folder.

```javascript
import contentParser from 'gatsby-source-wpgraphql-images'
```

replace `<div dangerouslySetInnerHTML={{ __html: content }} />` with this

```javascript
<div>{contentParser({ content: contentParsed, files: contentFiles }, { wordPressUrl, uploadsUrl })}</div>
```

Where `content` is the original HTML content and URLs should use the same values as in the options above. `contenParser` returns React object.

### Featured image

The recommended handling of `featuredImage` and WordPress media in general is described by [henrikwirth](https://github.com/henrikwirth) in [this article](https://dev.to/nevernull/gatsby-with-wpgraphql-acf-and-gatbsy-image-72m) and [this gist](https://gist.github.com/henrikwirth/4ba900b7f89b9e28ec81497466b12710).

### WordPress galleries

WordPress galleries may need some additional styling applied and this was intentionally left out of the scope of this plugin. Emotion [Global Styles](https://emotion.sh/docs/globals) may be used or just import sass/css file.

```css
.gallery {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.gallery-item {
  margin-right: 10px;
}
```

## Gatsby themes support

Inserted `<Img>` components have `variant: 'styles.SourcedImage'` applied to them.

## Examples of usage

I'm going to use [gatsby-wpgraphql-blog-example](https://github.com/wp-graphql/gatsby-wpgraphql-blog-example) as a starter and it will source data from a demo site at [yourdomain.dev](https://yourdomain.dev/).

Add this plugin to the `gatsby-config.js`

```javascript
{
  resolve: 'gatsby-source-wpgraphql-images',
  options: {
    wordPressUrl: `https://yourdomain.dev/`,
    uploadsUrl: `https://yourdomain.dev/wp-content/uploads/`,
    processPostTypes: ["Page", "Post"],
    graphqlTypeName: 'WPGraphQL',
  },
},
```

Change `url` in `gatsby-source-graphql` options to `https://yourdomain.dev/graphql`

Page templates are stored in `src/templates`. Let's modify `post.js` as an example.

Importing `contentParser`

```javascript
import contentParser from 'gatsby-source-wpgraphql-images'
```

For simplicty's sake I'm just going to add URLs directly in the template.

```javascript
const pluginOptions = {
  wordPressUrl: `https://yourdomain.dev/`,
  uploadsUrl: `https://yourdomain.dev/wp-content/uploads/`,
}
```

and replace `dangerouslySetInnerHTML` with this

```javascript
<div>{contentParser({ content, files }, pluginOptions)}</div>
```

The modified example starter is available at [github.com/progital/gatsby-wpgraphql-blog-example](https://github.com/progital/gatsby-wpgraphql-blog-example).

## Examples of advanced usage

Add this plugin to the `gatsby-config.js`

```javascript
{
  resolve: 'gatsby-source-wpgraphql-images',
  options: {
    wordPressUrl: `https://yourdomain.dev/`,
    uploadsUrl: `https://yourdomain.dev/wp-content/uploads/`,
    graphqlTypeName: 'WPGraphQL',
    customTypeRegistrations: [
      {
        graphqlTypeName: "WPGraphQL_Page_Acfdemofields",
        fieldName: "fieldInAcf",
      },
    ],
    keyExtractor: (source, context, info) => source.uri || source.key,
  },
},
```

This example assumes that there is a GraphQL type `WPGraphQL_Page_Acfdemofields` that has a field `fieldInAcf`, e.g.

```graphql
query MyQuery {
  wpgraphql {
    pages {
      nodes {
        acfDemoFields {
          fieldInAcf
          fieldInAcfParsed
          fieldInAcfFiles
        }
      }
    }
  }
}
```

## How to contribute

This is a WIP and any contribution, feedback and PRs are very welcome.

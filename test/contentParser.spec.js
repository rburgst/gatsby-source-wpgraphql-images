const contentParser = require('../src/contentParser')

import renderer from 'react-test-renderer'

describe('contentParser', () => {
  const options = {
    uploadsUrls: ['https://server.com/wp-content/uploads/'],
    uploadsUrl: 'https://server.com/wp-content/uploads/',
    wordPressUrls: ['https://server.com/'],
    wordPressUrl: 'https://server.com/',
  }

  it('should properly parse inline pdf a', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/MyPdf.pdf',
        childImageSharp: null,
      },
      {
        // https://server.com/wp-content/uploads/2019/01/poster.jpg
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/poster.jpg',
        childImageSharp: null,
      },
      {
        // https://server.com/wp-content/uploads/2020/01/video.mp4
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/video.mp4',
        childImageSharp: null,
      },
      {
        // https://server.com/wp-content/uploads/2020/01/video.mp4
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/video.mp4',
        childImageSharp: null,
      },
    ]
    const content = `<h1 class="en-mdl-prd-header__title en-format-h1 en-category-heading" style="text-align: center;">header</h1>
<div>
    <div class="en-space-t-lg" style="text-align: center;">
        <p><span class="en-format-semibold">lorem psum</span></p>
        <p class="en-space-t-sm" style="text-align: center;">someother text<br/>
            another</p>
    </div>
    <p style="text-align: center;"> 23.01.2020, 26.01.2020, 31.01.2020</p>
    <p style="text-align: center;">Location</p>
    <hr/>
    <p>&#8222;Lorem ipsum.</p>
    <p>Now prelude to a link: <a href="https://server.com/wp-content/uploads/2019/12/MyPdf.pdf" target="_blank"
                                 rel="noopener" data-gts-swapped-href="0">Lorem ipsum link text</a></p>
</div>
<div style="width: 1280px;" class="wp-video"><!--[if lt IE 9]>
    <script>document.createElement('video');</script><![endif]-->
    <video class="wp-video-shortcode" id="video-9064848-1" width="1280" height="720"
           poster="https://server.com/wp-content/uploads/2019/01/poster.jpg"
           loop="1" autoplay="1" preload="metadata" controls="controls" data-gts-poster-encfluid="1">
        <source type="video/mp4" src="https://server.com/wp-content/uploads/2020/01/video.mp4"
                data-gts-swapped-src="2"/>
        <a href="https://server.com/wp-content/uploads/2020/01/video.mp4" data-gts-swapped-href="3">https://server.com/wp-content/uploads/2020/01/video.mp4</a>
    </video>
</div>
<p>&nbsp;</p>
`
    const result = contentParser.default({ content, files }, options)
    const resultComponent = renderer.create(result)
    const json = resultComponent.toJSON()
    expect(json).toMatchSnapshot()
  })

  it('should not crash due to no ', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/MyPdf.pdf',
        childImageSharp: null,
      },
    ]
    const content = `<p>Now prelude to a link: <a href="https://server.com/wp-content/uploads/2019/12/MyPdf.pdf" target="_blank">Lorem ipsum link text</a></p>`
    const result = contentParser.default({ content, files }, options)
    const resultComponent = renderer.create(result)
    const json = resultComponent.toJSON()
    expect(json).toMatchSnapshot()
  })
})

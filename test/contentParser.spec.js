const contentParser = require('../src/contentParser')

import { renderToStaticMarkup } from 'react-dom/server'
import renderer from 'react-test-renderer'

describe('contentParser', () => {
  const options = {
    uploadsUrls: ['https://server.com/wp-content/uploads/'],
    uploadsUrl: 'https://server.com/wp-content/uploads/',
    wordPressUrls: ['https://server.com/'],
    wordPressUrl: 'https://server.com/',
  }

  beforeEach(() => {
    global.__BASE_PATH__ = ``
  })

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
           loop="1" autoplay="1" preload="metadata" controls="controls" data-gts-processed="true" data-gts-poster-encfluid="1">
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

  it('should add preload metadata to video if not already stated', () => {
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
    const content = `<div>Hello
    <video class="wp-video-shortcode" id="video-9064848-1" width="1280" height="720"
           poster="https://server.com/wp-content/uploads/2019/01/poster.jpg"
           loop="1" autoplay="1" controls="controls" data-gts-processed="true" data-gts-poster-encfluid="1">
        <source type="video/mp4" src="https://server.com/wp-content/uploads/2020/01/video.mp4"
                data-gts-swapped-src="2"/>
        <a href="https://server.com/wp-content/uploads/2020/01/video.mp4" data-gts-swapped-href="3">https://server.com/wp-content/uploads/2020/01/video.mp4</a>
    </video>
</div>
`
    const result = contentParser.default({ content, files }, options)
    const resultComponent = renderer.create(result)
    const json = resultComponent.toJSON()
    expect(json).toMatchSnapshot()
  })

  it('should not crash due to not found ref', () => {
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

  it('should properly parse audio tags', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part1.mp3',
        childImageSharp: null,
      },
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part2.mp3',
        childImageSharp: null,
      },
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part3.mp3',
        childImageSharp: null,
      },
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part4.mp3',
        childImageSharp: null,
      },
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part5.mp3',
        childImageSharp: null,
      },
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part6.mp3',
        childImageSharp: null,
      },
    ]

    const content = `<p>lorem</p>
<p>&nbsp;</p>
<p><strong>wp playlist</strong></p>
<!--[if lt IE 9]><script>document.createElement('audio');</script><![endif]-->
	<div class="wp-playlist wp-audio-playlist wp-playlist-light">
		<div class="wp-playlist-current-item"/>
		<audio controls="controls" preload="none" width="640" data-gts-processed="true"/>
	<div class="wp-playlist-next"/>
	<div class="wp-playlist-prev"/>
	<noscript>
	<ol>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part1.mp3" data-gts-swapped-href="0">part 1</a></li>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part2.mp3" data-gts-swapped-href="1">part 2</a></li>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part3.mp3" data-gts-swapped-href="2">part 3</a></li>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part4.mp3" data-gts-swapped-href="3">part 4</a></li>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part5.mp3" data-gts-swapped-href="4">part 5</a></li>
	<li><a href="https://server.com/wp-content/uploads/2019/04/part6.mp3" data-gts-swapped-href="5">part 6</a></li>	
	</ol>
	</noscript>
	<script type="application/json" class="wp-playlist-script">{"type":"audio","tracklist":true,"tracknumbers":true,"images":false,"artists":false,"tracks":[{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part1.mp3","type":"audio\\/mpeg","title":"part 1","caption":"","description":"\\"Part 1\\".","meta":{"length_formatted":"6:57"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part2.mp3","type":"audio\\/mpeg","title":"part 2","caption":"","description":"\\"part 2\\".","meta":{"length_formatted":"5:11"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part3.mp3","type":"audio\\/mpeg","title":"part 3","caption":"","description":"\\"part 3\\".","meta":{"length_formatted":"6:32"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part4.mp3","type":"audio\\/mpeg","title":"part 4","caption":"","description":"\\"part 4\\".","meta":{"length_formatted":"7:43"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part5.mp3","type":"audio\\/mpeg","title":"part 5","caption":"","description":"\\"part 5\\".","meta":{"length_formatted":"5:49"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part6.mp3","type":"audio\\/mpeg","title":"part 6","caption":"","description":"\\"part 6\\".","meta":{"length_formatted":"0:38"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}}]}</script>
</div>
	
<p><strong>html5 audio</strong></p>
<!--[if lt IE 9]><script>document.createElement('audio');</script><![endif]-->
<audio class="wp-audio-shortcode" id="audio-2538-1" preload="none" style="width: 100%;" controls="controls" data-gts-processed="true"><source type="audio/mpeg" src="https://server.com/wp-content/uploads/2019/04/part1.mp3" data-gts-swapped-src="0"/><a href="https://server.com/wp-content/uploads/2019/04/part1.mp3" data-gts-swapped-href="0">http://dockerhost:8000/wp-content/uploads/2019/04/part1.mp3</a></audio>
`
    const result = contentParser.default({ content, files }, options)
    const resultComponent = renderer.create(result)
    const json = resultComponent.toJSON()
    expect(json).toMatchSnapshot()
  })

  it('should properly parse simplified audio tags', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part1.mp3',
        childImageSharp: null,
      },
    ]

    const content = `<p>lorem</p>
<p> </p>
<p><strong>wp playlist</strong></p>
<!--[if lt IE 9]><script>document.createElement('audio');</script><![endif]-->
	<div class="wp-playlist wp-audio-playlist wp-playlist-light">
		<div class="wp-playlist-current-item"/>
		<audio controls="controls" preload="none" width="640"/>
	<div class="wp-playlist-next"/>
	<div class="wp-playlist-prev"/>
	
	<script type="application/json" class="wp-playlist-script">{"type":"audio","tracklist":true,"tracknumbers":true,"images":false,"artists":false,"tracks":[{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part1.mp3","type":"audio\\/mpeg","title":"part 1","caption":"","description":"\\"Part 1\\".","meta":{"length_formatted":"6:57"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part2.mp3","type":"audio\\/mpeg","title":"part 2","caption":"","description":"\\"part 2\\".","meta":{"length_formatted":"5:11"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part3.mp3","type":"audio\\/mpeg","title":"part 3","caption":"","description":"\\"part 3\\".","meta":{"length_formatted":"6:32"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part4.mp3","type":"audio\\/mpeg","title":"part 4","caption":"","description":"\\"part 4\\".","meta":{"length_formatted":"7:43"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part5.mp3","type":"audio\\/mpeg","title":"part 5","caption":"","description":"\\"part 5\\".","meta":{"length_formatted":"5:49"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}},{"src":"http:\\/\\/dockerhost:8000\\/wp-content\\/uploads\\/2019\\/04\\/part6.mp3","type":"audio\\/mpeg","title":"part 6","caption":"","description":"\\"part 6\\".","meta":{"length_formatted":"0:38"},"image":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64},"thumb":{"src":"http:\\/\\/dockerhost:8000\\/wp-includes\\/images\\/media\\/audio.png","width":48,"height":64}}]}</script>
</div>
	
<p><strong>html5 audio</strong></p>
<!--[if lt IE 9]><script>document.createElement('audio');</script><![endif]-->
<audio class="wp-audio-shortcode" id="audio-2538-1" preload="none" style="width: 100%;" controls="controls" data-gts-processed="true"><source type="audio/mpeg" src="https://server.com/wp-content/uploads/2019/04/part1.mp3" data-gts-swapped-src="0"/><a href="https://server.com/wp-content/uploads/2019/04/part1.mp3" data-gts-swapped-href="0">http://dockerhost:8000/wp-content/uploads/2019/04/part1.mp3</a></audio>
`
    const result = contentParser.default({ content, files }, options)
    const resultComponent = renderer.create(result)
    const json = resultComponent.toJSON()
    expect(json).toMatchSnapshot()
  })

  it('should properly rewrite a hrefs', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/part1.mp3',
        childImageSharp: null,
      },
    ]

    const content = `<p>Bla <strong>lorem ipsum</strong> bla bla <strong>strong bla</strong> some &#8211; entities at <a href="mailto:contact@server.com">contact@server.com</a> can be found!<br/>
<strong>Further info can be found <a href="https://server.com/link/target/">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`

    const result = contentParser.default({ content, files }, options)
    const output = renderToStaticMarkup(result)
    expect(output)
      .toEqual(`<p>Bla <strong>lorem ipsum</strong> bla bla <strong>strong bla</strong> some – entities at <a href="mailto:contact@server.com">contact@server.com</a> can be found!<br/>
<strong>Further info can be found <a href="/link/target/">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`)
  })

  it('should properly rewrite a hrefs with hashes', () => {
    const files = []

    const content = `<p>
<strong>Further info can be found <a href="https://server.com/link/target/#myhash">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`

    const result = contentParser.default({ content, files }, options)
    const output = renderToStaticMarkup(result)
    expect(output).toEqual(`<p>
<strong>Further info can be found <a href="/link/target/#myhash">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`)
  })

  it('should properly rewrite a hrefs with query params', () => {
    const files = []

    const content = `<p>
<strong>Further info can be found <a href="https://server.com/link/target/?query=value&query2=value2">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`

    const result = contentParser.default({ content, files }, options)
    const output = renderToStaticMarkup(result)
    expect(output).toEqual(`<p>
<strong>Further info can be found <a href="/link/target/?query=value&amp;query2=value2">here</a></strong>.</p>
<p><strong>And adios</strong></p>
`)
  })

  it('should pick webp image if available', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/img.png',
        childImageSharp: {
          fluid: {
            srcWebp: '/static/af2e8e490f207a56a56992795f0545c9/c6969/img.webp',
            presentationWidth: 720,
          },
        },
      },
      {
        // https://server.com/wp-content/uploads/2020/01/video.mp4
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/video.mp4',
        childImageSharp: null,
      },
    ]

    const content = `<div>bla<video class="wp-video-shortcode" id="video-9064848-1" width="1280" height="720"
           poster="https://server.com/wp-content/uploads/2019/01/poster.jpg"
           loop="1" preload="metadata" controls="controls" data-gts-processed="true" data-gts-poster-encfluid="0">
        <source type="video/mp4" src="https://server.com/wp-content/uploads/2020/01/video.mp4"
                data-gts-swapped-src="1"/>
        <a href="https://server.com/wp-content/uploads/2020/01/video.mp4" data-gts-swapped-href="1">https://server.com/wp-content/uploads/2020/01/video.mp4</a>
    </video></div>`

    const result = contentParser.default({ content, files }, options)
    const output = renderToStaticMarkup(result)
    expect(output)
      .toEqual(`<div>bla<video id="video-9064848-1" width="1280" height="720" poster="/static/af2e8e490f207a56a56992795f0545c9/c6969/img.webp" loop="" preload="metadata" controls="" class="wp-video-shortcode">
        <source type="video/mp4" src="/static/c1624b1ea899ec0e662be2d2c55356e2/video.mp4"/>
        <a href="/static/c1624b1ea899ec0e662be2d2c55356e2/video.mp4" class=" inline-parsed-img">https://server.com/wp-content/uploads/2020/01/video.mp4</a>
    </video></div>`)
  })

  it('should maintain img width if specified', () => {
    const files = [
      {
        publicURL: '/static/c1624b1ea899ec0e662be2d2c55356e2/img.png',
        childImageSharp: {
          fluid: {
            srcWebp: '/static/af2e8e490f207a56a56992795f0545c9/c6969/img.webp',
            presentationWidth: 720,
          },
        },
      },
    ]

    const content = `<p>
<img class="alignleft wp-image-8178" src="https://ism-wsp-wordpress.sbg.emundo.eu/wp-content/uploads/2018/05/Mirabell_Logo_RGB.jpg" alt="" width="153" height="64" data-gts-encfluid="0"/>
</p>`

    const result = contentParser.default({ content, files }, options)
    const output = renderToStaticMarkup(result)
    expect(output).toEqual(`<p>
<div class="alignleft wp-image-8178 inline-parsed-img gatsby-image-wrapper" style="position:relative;overflow:hidden;width:153px"><div aria-hidden="true" style="width:100%;padding-bottom:NaN%"></div><picture><img alt="" loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;transition:opacity 500ms"/></picture><noscript><picture><source srcset="undefined" /><img loading="lazy" src="" alt="" style="position:absolute;top:0;left:0;opacity:1;width:100%;height:100%;object-fit:cover;object-position:center"/></picture></noscript></div>
</p>`)
  })
})

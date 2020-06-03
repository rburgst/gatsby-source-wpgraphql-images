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

  // disabled until https://github.com/remarkablemark/html-dom-parser/issues/25 is fixed
  xit('should properly parse audio tags', () => {
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
})

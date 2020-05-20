const sourceParser = require('../src/sourceParser')
describe('sourceParser', () => {
  const options = {
    uploadsUrls: ['https://server.com/wp-content/uploads/'],
    uploadsUrl: 'https://server.com/wp-content/uploads/',
    wordPressUrls: ['https://server.com/'],
    wordPressUrl: 'https://server.com/',
  }
  const params = { actions: {} }
  const context = {
    nodeModel: {
      getNodeById: (args) => {
        switch (args.id) {
          case 'https://server.com/wp-content/uploads/2019/12/MyPdf.pdf':
            return { file: 'MyPdf.pdf' }
          case 'https://server.com/wp-content/uploads/2020/01/video.mp4':
            return { file: 'video.mp4' }
          case 'https://server.com/wp-content/uploads/2019/01/poster.jpg':
            return { file: 'poster.jpg' }
          default:
            throw new Error(`unknown node id ${args.id}`)
        }
      },
    },
  }

  it('should properly parse inline pdf a', async () => {
    const content =
      '<h1 class="en-mdl-prd-header__title en-format-h1 en-category-heading" style="text-align: center;">DER MESSIAS</h1>\n<div>\n<div class="en-space-t-lg" style="text-align: center;">\n<p><span class="en-format-semibold">lorem psum</span></p>\n<p class="en-space-t-sm" style="text-align: center;">someother text<br />\nanother</p>\n</div>\n<p style="text-align: center;">23.01.2020, 26.01.2020, 31.01.2020</p>\n<p style="text-align: center;">Location</p>\n<hr />\n<p>&#8222;Lorem ipsum.</p>\n<p>Now prelude to a link: <a href="https://server.com/wp-content/uploads/2019/12/MyPdf.pdf" target="_blank" rel="noopener">Lorem ipsum link text</a></p>\n</div>\n<div style="width: 1280px;" class="wp-video"><!--[if lt IE 9]><script>document.createElement(\'video\');</script><![endif]-->\n<video class="wp-video-shortcode" id="video-9064848-1" width="1280" height="720" poster="https://server.com/wp-content/uploads/2019/01/poster.jpg" loop="1" autoplay="1" preload="metadata" controls="controls"><source type="video/mp4" src="https://server.com/wp-content/uploads/2020/01/video.mp4?_=1" /><a href="https://server.com/wp-content/uploads/2020/01/video.mp4">https://server.com/wp-content/uploads/2020/01/video.mp4</a></video></div>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n'
    const result = await sourceParser({ content }, options, params, context)
    expect(result.parsed)
      .toEqual(`<h1 class="en-mdl-prd-header__title en-format-h1 en-category-heading" style="text-align: center;">DER MESSIAS</h1>
<div>
<div class="en-space-t-lg" style="text-align: center;">
<p><span class="en-format-semibold">lorem psum</span></p>
<p class="en-space-t-sm" style="text-align: center;">someother text<br/>
another</p>
</div>
<p style="text-align: center;">23.01.2020, 26.01.2020, 31.01.2020</p>
<p style="text-align: center;">Location</p>
<hr/>
<p>&#8222;Lorem ipsum.</p>
<p>Now prelude to a link: <a href="https://server.com/wp-content/uploads/2019/12/MyPdf.pdf" target="_blank" rel="noopener" data-gts-swapped-href="0">Lorem ipsum link text</a></p>
</div>
<div style="width: 1280px;" class="wp-video"><!--[if lt IE 9]><script>document.createElement('video');</script><![endif]-->
<video class="wp-video-shortcode" id="video-9064848-1" width="1280" height="720" poster="https://server.com/wp-content/uploads/2019/01/poster.jpg" loop="1" autoplay="1" preload="metadata" controls="controls" data-gts-poster-encfluid="1"><source type="video/mp4" src="https://server.com/wp-content/uploads/2020/01/video.mp4" data-gts-swapped-src="2"/><a href="https://server.com/wp-content/uploads/2020/01/video.mp4" data-gts-swapped-href="3">https://server.com/wp-content/uploads/2020/01/video.mp4</a></video></div>
<p>&nbsp;</p>
<p>&nbsp;</p>
`)
    expect(result.foundRefs).toEqual([
      {
        file: 'MyPdf.pdf',
      },
      {
        file: 'poster.jpg',
      },
      {
        file: 'video.mp4',
      },
      {
        file: 'video.mp4',
      },
    ])
  })
})

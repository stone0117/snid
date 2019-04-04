const puppeteer        = require('puppeteer')
const { TimeoutError } = require('puppeteer/Errors')
const devices          = require('puppeteer/DeviceDescriptors')
const iPhone           = devices['iPhone 6']
const fs               = require('fs')

async function ppRequest (link, headless = false, observer = {}, options) {

  let defaultViewport

  if (observer.hasOwnProperty('mobile') && observer.mobile === true) {
    // 移动端
  } else {
    if (observer.hasOwnProperty('defaultViewport')) {

      defaultViewport = observer.defaultViewport
    } else {
      defaultViewport = { // 为每个页面设置一个默认视口大小。默认是 800x600。如果为 null 的话就禁用视图口。
        width : 1680, //  页面宽度像素。
        height: 1050, //  页面高度像素。
        // deviceScaleFactor: 1,   //  设置设备的缩放（可以认为是 dpr）。默认是 1。
        // isMobile         : false,//  是否在页面中设置了 meta viewport 标签。默认是 false。
        // hasTouch         : false,//  指定viewport是否支持触摸事件。默认是 false。
        // isLandscape      : false,//  指定视口是否处于横向模式。默认是 false。
      }
    }
  }

  let browser = await puppeteer.launch({
    // executablePath   : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args             : ['--no-sandbox', '--disable-setuid-sandbox'],
    dumpio           : false,
    ignoreHTTPSErrors: true, // 是否在导航期间忽略 HTTPS 错误. 默认是 false。
    headless         : headless,  // 是否以 无头模式 运行浏览器。默认是 true，除非 devtools 选项是 true。
    // executablePath   : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',   // 可运行 Chromium 或 Chrome 可执行文件的路径，而不是绑定的 Chromium。
    // slowMo           : 250,   // 将 Puppeteer 操作减少指定的毫秒数。这样你就可以看清发生了什么，这很有用
    defaultViewport  : defaultViewport,
    // args             : [''],  // <Array<string>> 传递给浏览器实例的其他参数。 这些参数可以参考 这里。
    // ignoreDefaultArgs: false, // <(boolean|<Array<string>>)> 如果是 true，那就不要使用 puppeteer.defaultArgs()。如果给出了数组，则过滤掉给定的默认参数。这个选项请谨慎使用。默认为 false。
    // handleSIGINT     : true,  // <boolean> Ctrl-C 关闭浏览器进程。默认是 true。
    // handleSIGTERM    : true,  // <boolean> 关闭 SIGTERM 上的浏览器进程。默认是 true。
    // handleSIGHUP     : true,  // <boolean> 关闭 SIGHUP 上的浏览器进程。默认是 true.
    // timeout          : 30000, // <number> 等待浏览器实例启动的最长时间（以毫秒为单位）。默认是 30000 (30 秒). 通过 0 来禁用超时。
    // dumpio           : false, // <boolean> 是否将浏览器进程标准输出和标准错误输入到 process.stdout 和 process.stderr 中。默认是 false。
    // userDataDir      : '',    // <string> 用户数据目录 路径。
    // env              : process.env,// <Object> 指定浏览器可见的环境变量。默认是 process.env。
    // devtools         : false, // <boolean> 是否为每个选项卡自动打开DevTools面板。如果这个选项是 true，headless 选项将会设置成 false。
    // pipe             : false, // <boolean> 通过管道而不是WebSocket连接到浏览器。默认是 false。
    //
  })

  /*** 屏蔽烦人的广告的时候用的 ***************************************/
  /*
  let isFirst = false;

  browser.on('targetcreated', async target => {
    if (observer.hasOwnProperty('targetcreatedListener')) {
      observer['targetcreatedListener'](target);
    } else {
      if (isFirst) {
        console.log('监听到开启新的tab');
        let p = await target.page();
        await p.close();
      } else {
        isFirst = true;
      }
    }
  });
  */
  /******************************************/
  if (observer.hasOwnProperty('targetcreatedListener')) {
    browser.on('targetcreated', target => {
      observer['targetcreatedListener'](target)
    })
  }

  const page = await browser.newPage()

  await page.setJavaScriptEnabled(true)

  let styleFlag
  if (observer.hasOwnProperty('needStyle')) {
    if (observer.needStyle === true) {
      // 需要样式
      styleFlag = true
    } else {
      // 不需要样式
      styleFlag = false
    }
  } else {
    // 默认需要
    styleFlag = true
  }

  // let styleFlag = observer.hasOwnProperty('needStyle') && observer.needStyle === true;

  if (observer.hasOwnProperty('requestListener')) {
    if (styleFlag) {
      page.on('request', (req) => {observer['requestListener'](req)})
    } else {

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (
          req.url().endsWith('.png') ||
          req.url().endsWith('.jpg') ||
          req.url().endsWith('.jpg?') ||
          req.url().endsWith('.gif') ||
          req.url().endsWith('.webp') ||
          req.url().endsWith('.css') ||
          req.url().endsWith('.mp4')
        ) {
          req.abort()
        } else {
          req.continue()
        }
        observer['requestListener'](req)
      })
    }
  } else {
    if (styleFlag) {
      // page.on('request', (req) => {observer['requestListener'](req);});
    } else {
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (
          req.url().endsWith('.png') ||
          req.url().endsWith('.jpg') ||
          req.url().endsWith('.jpg?') ||
          req.url().endsWith('.gif') ||
          req.url().endsWith('.webp') ||
          req.url().endsWith('.css') ||
          req.url().endsWith('.mp4')
        ) {
          req.abort()
        } else {
          req.continue()
        }
      })
    }
  }

  if (observer.hasOwnProperty('responseListener')) {
    page.on('response', (res) => {observer['responseListener'](res)})
  }
  if (observer.hasOwnProperty('consoleListener')) {
    page.on('console', (msg) => {
      observer['consoleListener'](msg)
    })
  }

  await page.setJavaScriptEnabled(true)
  if (observer.hasOwnProperty('mobile') && observer.mobile === true) {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1')
    await page.emulate(iPhone)
  } else {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36')
  }

  // makesure goto
  while (true) {
    try {
      await page.goto(link, { waitUntil: 'networkidle2' })
      break
    } catch (err) {
      try {
        const [response] = await Promise.all([
          page.reload(),
          page.waitForNavigation(),
        ])
        break
      } catch (err) {
        console.log(`\x1b[101m有异常, 强制刷新!!!!!!\x1b[0m`)
      }
    }
  }

  options && options.beforeGetContent && await options.beforeGetContent(page)

  let body = await page.content()

  let bodyElement = await page.$('body')
  let boxModel    = await bodyElement.boxModel()
  let boundingBox = await bodyElement.boundingBox()

  return { browser, page, body }
}

function pWriteTextFile (filepath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, content, 'utf8', function (err) {
      if (err) {reject(err)} else {resolve()}
    })
  })
}

exports.ppRequest      = ppRequest
exports.pWriteTextFile = pWriteTextFile
const { dlog, Info }   = require('./dlog')
exports.dlog           = dlog
exports.Info           = Info

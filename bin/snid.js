#!/usr/bin/env node

const colors                        = require('colors/safe')
const { ppRequest, pWriteTextFile } = require('../lib')
const ora                           = require('ora')
const program                       = require('commander')

program
  .version('1.0.0')
  .option('-u --url [url]', 'url address | string | required')
  .option('-o --output [output]', 'output path | string | required | e.g "/Users/stone/Desktop/result.txt" or "C:\\Users\\stone\\Desktop\\result.txt"')
  .option('--mobile [mobile]', 'mobile mode | boolean | default false')
  .option('--browser [browser]', 'show browser | boolean | default false | true = show browser')
  .option('--selector [selector]', 'selector element | string | default ".loadMoreBtn b"')
  .option('--loopCount [loopCount]', 'for loop count | number | default 5')
  .option('--timeInterval [timeInterval]', 'time interval | number | default 2000')
  .option('--debug [debug]', 'debug | boolean | enabled debug | default false')

program.parse(process.argv)

let debug = false
if (program.debug) {
  debug = program.debug === 'true'
}

if (process.argv.slice(2).length <= 0) {
  program.outputHelp(make_red)
  process.exit(0)
}

function make_red (txt) {
  return colors.red(txt)
}

;(async function () {
  const spinner = ora(`start...`).start()
  try {

    await main()

    spinner.succeed('succeed')

  } catch (err) {
    if (debug) {
      console.log(`\x1b[31m${err}\x1b[0m`)
    }
    spinner.fail(err)
  }
})()

async function main () {

  // let url = 'https://jusp.tmall.com/act/o/zmwzt315?acm=ak-zebra-68661-197540.1003.4.2708254&scm=1003.4.ak-zebra-68661-197540.OTHER_1553263234528_2708254'
  let url

  // url = program.url ? program.url : url

  if (url) {
    url = program.url
  } else {
    program.outputHelp(make_red)
    process.exit(0)
  }

  let output
  if (program.output) {
    output = program.output
  } else {
    program.outputHelp(make_red)
    process.exit(0)

  }

  const loopCount    = parseInt(program.loopCount ? program.loopCount : '5')
  const timeInterval = parseInt(program.timeInterval ? program.timeInterval : '2000')
  const selector     = program.selector ? program.selector : '.loadMoreBtn b'

  let headless = true
  if (program.browser) {
    headless = program.browser !== 'true'
  }

  let mobile = false
  if (program.mobile) {
    mobile = program.mobile === 'true'
  }

  let { body, page, browser } = await ppRequest(url, headless, {

    mobile   : mobile,
    needStyle: true,

    // consoleListener (msg) {
    //   console.log(msg.text())
    // },
    // targetcreatedListener () {
    // },
    // requestListener (req) {
    //   // console.log('index.js:68 -: call requestListener');
    // },
    // async responseListener (res) {
    //
    // },
  }, {
    async beforeGetContent (page) {
      await page.waitForSelector(selector)
    },
  })

  for (let i = 0; i < loopCount; i++) {
    let $loadMoreBtnList = await page.$$(selector)
    // console.log($loadMoreBtnList.length)
    for (let j = 0; j < $loadMoreBtnList.length; ++j) {
      let $loadMoreBtnListElement = $loadMoreBtnList[j]
      try {

        await $loadMoreBtnListElement.click()

      } catch (err) {
        if (debug) {console.log(`\x1b[31m${err}\x1b[0m`)}
        continue
      }
      await page.waitFor(timeInterval)
    }
  }

  // for (let i = 0; i < loopCount; i++) {
  //
  //   let $loadMoreBtnList = await page.$$(selector)
  //
  //   console.log($loadMoreBtnList.length)
  //
  //   for (let j = 0; j < $loadMoreBtnList.length; ++j) {
  //
  //     let $loadMoreBtnListElement = $loadMoreBtnList[j]
  //
  //     // await $loadMoreBtnListElement.click()
  //
  //     await page.evaluate((element) => {
  //       // window.scrollTo(0, document.body.scrollHeight)
  //
  //       let y = element.scrollHeight
  //
  //       console.log(y)
  //
  //       window.scrollTo(0, y)
  //
  //       element.click()
  //
  //       // window.scrollTo(0, element.scrollHeight)
  //
  //     }, $loadMoreBtnListElement)
  //
  //     await page.waitFor(1200)
  //   }
  // }

  // for (let i = 0; i < loopCount; i++) {
  //   await page.evaluate(() => {
  //
  //     let nodeList = document.querySelectorAll('.loadMoreBtn b')
  //
  //     console.log(nodeList.length);
  //
  //     for (let j = 0; j < nodeList.length; ++j) {
  //       let nodeListElement = nodeList[j]
  //       nodeListElement.click()
  //     }
  //   })
  // }

  // const regex = /(?<=item_id=)\d+(?=\&)/gmi
  const regex = new RegExp('(?<=item_id=)\\d+(?=\\&)', 'img')

  const str = await page.content()

  let m

  let count = 0

  let resultList = []
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // console.log(`${count++} : ${match}`)
      resultList.push(match)
    })
  }
  await pWriteTextFile(output, resultList.join('\r\n'))

  await browser.close()
}

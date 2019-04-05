const execa = require('execa')
const ora   = require('ora')
const fs    = require('fs')
const path  = require('path')

let p = path.resolve(__dirname, './package.json')
fs.readFile(p, 'utf-8', function (err, data) {
  if (err) {console.log(err)} else {
    let packageJson = JSON.parse(data)

    let oVersion            = packageJson.version
    let split               = oVersion.split('.')
    let num                 = parseInt(split[split.length - 1])
    split[split.length - 1] = num + 1
    packageJson.version     = split.join('.')

    fs.writeFile(p, JSON.stringify(packageJson, null, 2), function (err) {
      if (err) {
        console.error(err)
      } else {
        console.log(`\x1b[32m${`${oVersion} => ${packageJson.version}`}\x1b[0m`)

        const spinner = ora('publish and global install ...').start()

        execa.shell('npm publish').then(({ stdout, code }) => {
          console.log(stdout)
          if (code === 0) {
            execa.shell('npm i -g snid').then(({ stdout, code }) => {
              console.log(stdout)
              spinner.succeed('succeed')
            })
          } else {
            spinner.fail(err)
          }
        }).catch((err) => {
          console.log(`\x1b[41m${err}\x1b[0m`)
          spinner.fail(err)
        })
      }
    })
  }
})

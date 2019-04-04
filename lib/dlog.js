const chalk = require('chalk')

const { blue, green, white, black, bold } = chalk

const colors = [1, 4, 7, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43, 44, 45, 46, 47, 91, 92, 93, 94, 95, 96, 97, 100, 101, 102, 103, 104, 105, 106, 107]

const Info = Error

function purePickColor (content, color) {
  return `\x1b[${colors[color]}m${content}\x1b[0m`
}

function pickColor (content, color, pretty) {

  if (typeof content === 'function') {return content}
  if (typeof content === 'symbol') {return content}
  if (Object.prototype.toString.call(content) === '[object Array]') {
    for (let i = 0; i < content.length; ++i) {
      let contentElement = content[i]
      if (typeof contentElement === 'symbol') {
        return content
      }
    }
  }

  if (Object.prototype.toString.call(content) === '[object Object]') {
    let propertyKeys = Reflect.ownKeys(content)
    for (let i = 0; i < propertyKeys.length; ++i) {
      let propertyKey = propertyKeys[i]
      if (typeof propertyKey === 'symbol') {
        return content
      }
    }
  }

  if (typeof content === 'string') {
    return `\x1b[${colors[color]}m${content}\x1b[0m`
  }

  return content

  // try {
  //   let _content;
  //   if (pretty) {
  //     _content = JSON.stringify(content, null, 2);
  //   } else {
  //     _content = JSON.stringify(content);
  //   }
  //   return `\x1b[${colors[color]}m${_content}\x1b[0m`;
  // } catch (err) {
  //   return content;
  // }
}

function dlog (obj, info, color, pretty = false) {

  let _info = info.stack.split('\n')[0]
  if ('Error' === _info) {_info = ' '}
  let fileInfo          = info.stack.split('\n')[1]
  let message           = fileInfo.substring(fileInfo.lastIndexOf('/') + 1)
  let matchArray        = message.match(/.*?:\d+/img)
  let matchArrayElement = matchArray[0].split(':')
  let strings           = _info.split('Error:')
  let _obj_name         = strings.map(item => item.trim()).filter(item => item)[0]
  let filename          = matchArrayElement[0]
  let line              = matchArrayElement[1]

  if (_obj_name) {
    let r = pickColor(obj, color, pretty)

    if (typeof r === 'string') {
      console.log(purePickColor(`${filename}:${line}`, 6) + purePickColor(' :- ', 0) + purePickColor(_obj_name, 4) + purePickColor(' = ↓\n', 0) + r)
    } else {
      console.log(purePickColor(`${filename}:${line}`, 6) + purePickColor(' :- ', 0) + purePickColor(_obj_name, 4) + purePickColor(' = ↓\n', 0), r)
    }
  } else {
    console.log(purePickColor(`${filename}:${line}`, 1) + purePickColor(' :-', 1), obj)
  }
}

exports.dlog          = dlog
exports.pickColor     = pickColor
exports.purePickColor = purePickColor
exports.Info          = Info

if (require.main === module) {

  const Mock   = require('mockjs')
  const Random = Mock.Random
  const mock   = Mock.mock

  // dlog(path, new Info('111111'), 2);
  dlog({ name: mock('@cname'), age: mock('@integer(20,35)') }, new Info(`obj info`), 2)

  // for (let i = 0; i < colors.length; ++i) {
  //   let color = colors[i];
  //   console.log(`${color} = \x1b[${color}m${path.resolve(__dirname, '.')}\x1b[0m`);
  // }

  // for (let i = 0; i < 1300; i++) {
  //   console.log(`${i} = \x1b[${i}m${path.resolve(__dirname, '.')}\x1b[0m`);
  // }
}

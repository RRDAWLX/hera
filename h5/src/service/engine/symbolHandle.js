/**
 * @module
 */

/**
 * 返回元素第一次在数组中出现位置的索引，如果数组中不存在该元素，则返回 -1。
 * @param {Array} arr
 * @param {*} element
 * @return {Number}
 **/
function indexOf (arr, element) {
  if (toString.call(arr) !== '[object Array]') {
    throw new TypeError('array must be an Array')
  }
  var index = void 0,
    arrLen = void 0,
    cur = void 0

  for (index = 0, arrLen = arr.length; index < arrLen; ++index) {
    cur = arr[index]

    // 这边的判断有误吧？？？cur !== cur && element !== element？？？
    if (cur === element || (cur !== cur && element !== element)) {
      return index
    }
  }

  return -1
}

var toString = Object.prototype.toString

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys Object.keys}
 * @function
 **/
var getKeys =
  typeof Object.keys === 'function'
    ? function (obj) {
      return Object.keys(obj)
    }
    : function (obj) {
      var type = typeof obj
      if (obj === null || (type !== 'function' && type !== 'object')) { throw new TypeError('obj must be an Object') }
      var res = [],
        key
      for (key in obj) {
        Object.prototype.hasOwnProperty.call(obj, key) && res.push(key)
      }
      return res
    }

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertySymbols Object.getOwnPropertySymbols}
 * @function
 **/
var getSymbols =
  typeof Symbol === 'function'
    ? function (e) {
      return Object.getOwnPropertySymbols(e)
    }
    : function () {
      return []
    }

export default {
  getKeys,
  getSymbols,
  indexOf
}

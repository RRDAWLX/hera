/**
 * 工具方法。
 * @module
 **/

import Enums from './Enums'

/**
 * 判断目标值是否为字符串。
 * @param {*} target 目标值
 * @return {Boolean}
 * @static
 **/
const isString = function (target) {
  return Object.prototype.toString.call(target) === '[object String]'
}

const isIphone = navigator.userAgent.match('iPhone')
const screenWidth = (window.screen && window.screen.width) || 375
const devicePixelRatio = window.devicePixelRatio || 2
// TODO: view/common.js EPS
const SMALL_NUM = 1e-4
// TODO：在 view/common.js 中有类似函数 transformByDPR
const rpxToPxNum = function (rpxNum) {
  rpxNum = rpxNum / Enums.BASE_DEVICE_WIDTH * screenWidth
  rpxNum = Math.floor(rpxNum + SMALL_NUM)
  return rpxNum === 0 ? (devicePixelRatio !== 1 && isIphone ? 0.5 : 1) : rpxNum
}
// TODO：在 view/common.js 中有类似函数 getNumber
const parseRpx = function (matches) {
  let num = 0
  let decimalRadix = 1
  let isHandlingDecimal = !1
  let isNeg = !1
  let idx = 0

  for (; idx < matches.length; ++idx) {
    let ch = matches[idx]
    if (ch >= '0' && ch <= '9') {
      if (isHandlingDecimal) {
        decimalRadix *= 0.1
        num += (ch - '0') * decimalRadix
      } else {
        num = 10 * num + (ch - '0')
      }
    } else {
      ch === '.' ? (isHandlingDecimal = !0) : ch === '-' && (isNeg = !0)
    }
  }

  isNeg && (num = -num)
  return rpxToPxNum(num)
}
// TODO: view/common.js RPXRE
const rpxInTemplate = /%%\?[+-]?\d+(\.\d+)?rpx\?%%/g
const rpxInCSS = /(:|\s)[+-]?\d+(\.\d+)?rpx/g

export default {
  isString,

  /**
   * 判断目标值是否为数组。
   * @param {*} target 目标值
   * @return {Boolean}
   **/
  isArray: function (target) {
    return Array.isArray
      ? Array.isArray(target)
      : Object.prototype.toString.call(target) === '[object Array]'
  },

  /**
   * 获取对象的原型
   * @param {Object} obj 对象
   * @return {Object} 原型
   **/
  getPrototype: function (obj) {
    return Object.getPrototypeOf
      ? Object.getPrototypeOf(obj)
      : obj.__proto__
        ? obj.__proto__
        : obj.constructor ? obj.constructor.prototype : void 0
  },

  /**
   * 判断目标值是否为对象。
   * @param {*} obj 目标值
   * @return {Boolean}
   **/
  isObject: function (obj) {
    return typeof obj === 'object' && obj !== null
  },

  /**
   * 判断目标值是否为空对象。
   * @param {*} obj 目标值
   * @return {Boolean}
   **/
  isEmptyObject: function (obj) {
    for (let key in obj) {
      return !1
    }
    return !0
  },

  /**
   * 判断目标值是否为 WxVirtualNode。
   * @param {*} node 目标值
   * @return {Boolean}
   **/
  isVirtualNode: function (node) {
    return node && node.type === 'WxVirtualNode'
  },

  /**
   * 判断目标值是否为 isVirtualText
   * @param {*} node 目标值
   * @return {Boolean}
   **/
  isVirtualText: function (node) {
    return node && node.type === 'WxVirtualText'
  },

  /**
   * 判断目标值是否为 undefined。
   * @param {*} obj 目标值
   * @return {Boolean}
   **/
  isUndefined: function (obj) {
    return Object.prototype.toString.call(obj) === '[object Undefined]'
  },

  /**
   * 将字符串中的 rpx 值转换为 px 值。
   * @param {String} propValue 待转换字符串
   * @param {Boolean} isInCSS 待转换字符串是否为来自于 css
   * @return {String} 转换后的字符串
   * @todo view/common.js 的 inlineCss 函数中有类似逻辑。
   **/
  transformRpx: function (propValue, isInCSS) {
    if (!isString(propValue)) return propValue

    let matches = void 0
    matches = isInCSS
      ? propValue.match(rpxInCSS)
      : propValue.match(rpxInTemplate)

    matches &&
      matches.forEach(function (match) {
        const pxNum = parseRpx(match)
        const cssValue = (isInCSS ? match[0] : '') + pxNum + 'px'
        propValue = propValue.replace(match, cssValue)
      })

    return propValue
  },

  /**
   * 生成 uuid
   * @return {String}
   **/
  uuid: function () {
    let uuidPart = function () {
      return Math.floor(65536 * (1 + Math.random()))
        .toString(16)
        .substring(1)
    }

    return (
      uuidPart() +
      uuidPart() +
      '-' +
      uuidPart() +
      '-' +
      uuidPart() +
      '-' +
      uuidPart() +
      '-' +
      uuidPart() +
      uuidPart() +
      uuidPart()
    )
  },

  /**
   * 获取目标值的类型描述字符串。
   * @param {*} obj 目标值
   * @return {String}
   * @example
   * getDataType([]) => 'Array'
   * getDataType({}) => 'Object'
   **/
  getDataType: function (obj) {
    return Object.prototype.toString
      .call(obj)
      .split(' ')[1]
      .split(']')[0]
  }
}

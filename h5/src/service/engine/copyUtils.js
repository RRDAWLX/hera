/**
 * @module
 */

/**
 * 辅助函数，拷贝
 * @param {any} obj
 * @param {Function} customizerFn
 * @returns {any}
 */
function copy (obj, customizerFn) {
  var res = copyValue(obj)
  return res !== null ? res : copyCollection(obj, customizerFn)
}

/**
 * 复制，分以下几种情况：<br/>
 * 1、被复制值是函数，直接返回该函数。<br/>
 * 2、被复制值是数组，返回空数组。<br/>
 * 3、被复制值是简单对象，返回空对象。<br/>
 * 4、被复制值是 Date 类型，返回新 Date 实例。<br/>
 * 5、被复制值是 RegExp 类型，返回新 RegExp 实例。<br/>
 * 6、其他类型的值，使用 customizerFn 进行复制。
 * @param {*} obj 被复制的值
 * @param {Function} customizerFn 自定义复制函数，入参为被复制值，返回复制结果。
 * @return {*}
 **/
function copyCollection (obj, customizerFn) {
  if (typeof customizerFn !== 'function') {
    throw new TypeError('customizer is must be a Function')
  }

  if (typeof obj === 'function') {
    return obj
  }

  var typeString = toString.call(obj)

  if (typeString === '[object Array]') {
    return []
  }

  if (typeString === '[object Object]' && obj.constructor === Object) {
    return {}
  }

  if (typeString === '[object Date]') {
    return new Date(obj.getTime())
  }

  if (typeString === '[object RegExp]') {
    var toStr = String(obj),
      pos = toStr.lastIndexOf('/')
    return new RegExp(toStr.slice(1, pos), toStr.slice(pos + 1))
  }

  var res = customizerFn(obj)
  return undefined !== res ? res : null
}

/**
 * 复制，如果被复制值是 Object 及其子类实例，返回 null，否则直接返回该值。
 * @param {*} param
 * @return {*} 非对象类型值
 **/
function copyValue (param) {
  var type = typeof param
  return param !== null && type !== 'object' && type !== 'function'
    ? param
    : null
}

var toString = Object.prototype.toString

export default {
  copy,
  copyCollection,
  copyValue
}

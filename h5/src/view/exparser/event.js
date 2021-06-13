/**
 * 事件模块
 * @module
 **/

import globalOptions from './global-options'

/**
 * 事件类型
 */
class Event {
  /**
   * 事件类型/事件名
   * @type {String}
   */
  type = ''
  /**
   * 回调函数列表，[{id: Number, callback: Function}]。
   * @type {Object[]}
   */
  #callbacks = []
  /**
   * 用于生成回调函数标识 ID，每次添加回调函数时自增。
   * @type {Number}
   */
  #index = 0

  /**
   * 回调函数列表是否为空
   * @type {Boolean}
   */
  get empty () {
    return this.#callbacks.length === 0
  }

  /**
   * @param {String} type 事件类型/事件名
   */
  constructor (type) {
    this.type = type
  }

  /**
   * 添加事件监听器
   * @param {Function} callback 事件监听器
   * @return {Number} 事件监听器标识 ID
   */
  add (callback) {
    let id = this.#index++
    this.#callbacks.push({ id, callback })
    return id
  }

  /**
   * 删除事件监听器
   * @param {(Function|Number)} callbackOrId 事件监听器或监听器标识 ID
   * @return {Boolean} 表示是否删除成功
   */
  remove (callbackOrId) {
    let callbacks = this.#callbacks

    for (let i = 0, len = callbacks.length; i < len; i++) {
      if (
        callbacks[i].id === callbackOrId ||
        callbacks[i].callback === callbackOrId
      ) {
        callbacks.splice(i, 1)
        return true
      }
    }

    return false
  }

  /**
   * 调用在事件上注册的所有监听器
   * @param {Object} thisArg 回调函数执行时的 this 指向
   * @param {Array} args 回调函数调用参数数组
   * @return {(Boolean|Undefined)} 如果有一个回调函数的返回值是 false，则返回 false，
   * 否则返回 undefined。
   */
  call (thisArg, args) {
    let ifPreventDefault = false

    for (let { callback } of this.#callbacks) {
      let res = this.constructor.safeCallback(
        this.type,
        callback,
        thisArg,
        args
      )

      if (res === false) {
        ifPreventDefault = true
      }
    }

    if (ifPreventDefault) {
      return false
    }
  }

  /**
   * 安全地调用函数
   * @param {String} type 如果函数调用出错，将要触发的事件类型/事件名
   * @param {Function} fn 待调用函数
   * @param {Object} thisArg 函数执行时的 this 指向
   * @param {Array} args 函数调用参数数组
   * @return {*} 如果函数正确执行，则返回函数的返回值；否则返回 undefined。
   */
  static safeCallback (type, fn, thisArg, args) {
    try {
      return fn.apply(thisArg, args)
    } catch (err) {
      let message = 'Exparser ' + (type || 'Error Listener') + ' Error @ '

      if (thisArg) {
        message += thisArg.is
      }

      message += '#' + (fn.name || '(anonymous)')
      handleError(err, {
        message,
        type,
        element: thisArg,
        method: fn,
        args
      })
    }
  }

  /**
   * 添加全局错误监听
   * @param {Function} callback 回调函数
   * @return {Number} 回调函数标识 ID
   */
  static addGlobalErrorListener (callback) {
    return globalError.add(callback)
  }

  /**
   * 删除全局错误监听
   * @param {(Function|Number)} callbackOrId 回调函数或回调函数标识 ID
   * @return {Boolean} 表示是否删除成功
   */
  static removeGlobalErrorListener (callbackOrId) {
    return globalError.remove(callbackOrId)
  }
}

/**
 * 全局错误处理程序
 * @function handleError
 * @param {Error} err 错误对象
 * @param {Object} errData 错误数据
 * @inner
 * @private
 */
function handleError (err, errData) {
  if (!errData.type || globalError.call(null, [err, errData]) !== false) {
    console.error(errData.message)

    if (globalOptions.throwGlobalError) {
      throw err
    }

    console.error(err.stack)
  }
}

// 创建一个全局错误对象
const globalError = new Event()

export default Event

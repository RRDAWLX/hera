/**
 * 视图层内部 JSBridge
 * @module
 */

import baseBridge from '@/common/jsbridge'
import reporter from '@/common/reporter'

/**
 * 调用 JSBridge.on 方法，参数自动透传。
 */
export function on (...args) {
  baseBridge.on(...args)
}

/**
 * 调用 JSBridge.invoke 方法，参数自动透传。
 */
export function invoke (...args) {
  baseBridge.invoke(...args)
}

/**
 * 调用 JSBridge.subscribe 方法，对回调方法进行封装后透传整体参数。
 * @static
 */
export function subscribe (...args) {
  let callback = args[1]

  args[1] = function ({ data, options }, ext, timeMark = {}) {
    let startTime = (options && options.timestamp) || 0
    let endTime = Date.now()
    let res

    if (typeof callback === 'function') {
      res = callback(data, ext)
    }

    // 统计从逻辑层到视图层的通信耗时
    reporter.speedReport({
      key: 'appService2Webview',
      data: data || {},
      timeMark: {
        startTime,
        endTime,
        nativeTime: timeMark.nativeTime
      }
    })

    return res
  }

  baseBridge.subscribe(...args)
}

/**
 * 调用 JSBridge.publish 方法，调整数据字段后透传整体参数。
 * @static
 */
export function publish (...args) {
  args[1] = {
    data: args[1],
    options: {
      timestamp: Date.now()
    }
  }
  baseBridge.publish(...args)
}

/**
 * 添加事件监听，调用 on 方法，参数自动透传。
 * @param {String} eventName
 * @param {Function} callback
 * @static
 */
export function onMethod (eventName, callback) {
  on(eventName, callback)
}

/**
 * 触发事件。
 * @param {String} eventName 事件名
 * @param {Object} [params={}] 触发事件的数据及相关的回调函数。
 * @param {Function} [params.success] 成功回调
 * @param {Function} [params.fail] 失败回调
 * @param {Function} [params.cancel] 取消回调
 * @param {Function} [params.complete] 无论成功、失败、取消都会执行的回调，
 * 在以上类型的回调执行完成后执行。
 * @param {Object} [innerParams={}] 包含一些回调函数
 * @param {Function} [innerParams.beforeAll] 在所有其他回调函数之前执行的回调函数
 * @param {Function} [innerParams.beforeSuccess] 在 params.success 回调函数之前执行的回调函数
 * @param {Function} [innerParams.afterSuccess] 在 params.success 回调函数之后执行的回调函数
 * @param {Function} [innerParams.fail] 在 params.fail 回调函数之后执行的回调函数
 * @param {Function} [innerParams.cancel] 在 params.cancel 回调函数之后执行的回调函数
 * @param {Function} [innerParams.complete] 在 params.complete 回调函数之后执行的回调函数
 * @static
 */
export function invokeMethod (eventName, params = {}, innerParams = {}) {
  let callbacks = {}

  for (let key in params) {
    if (typeof params[key] === 'function') {
      callbacks[key] = params[key]
      delete params[key]
    }
  }

  invoke(eventName, params, function (res) {
    res.errMsg = res.errMsg || eventName + ':ok'

    if (innerParams.beforeAll === 'function') {
      innerParams.beforeAll(res)
    }

    if (res.errMsg.indexOf(eventName + ':ok') === 0) {
      // 成功
      typeof innerParams.beforeSuccess === 'function' &&
        innerParams.beforeSuccess(res)
      typeof callbacks.success === 'function' && callbacks.success(res)
      typeof innerParams.afterSuccess === 'function' &&
        innerParams.afterSuccess(res)
    } else if (res.errMsg.indexOf(eventName + ':fail') === 0) {
      // 失败
      typeof callbacks.fail === 'function' && callbacks.fail(res)
      typeof innerParams.fail === 'function' && innerParams.fail(res)
    } else if (res.errMsg.indexOf(eventName + ':cancel') === 0) {
      // 取消
      typeof callbacks.cancel === 'function' && callbacks.cancel(res)
      typeof innerParams.cancel === 'function' && innerParams.cancel(res)
    }

    typeof callbacks.complete === 'function' && callbacks.complete(res)
    typeof innerParams.complete === 'function' && innerParams.complete(res)
  })
}

export default {
  on,
  invoke,
  subscribe,
  publish,
  onMethod,
  invokeMethod
}

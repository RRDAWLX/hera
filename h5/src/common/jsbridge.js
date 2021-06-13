// 在 iOS 上，小程序的 javascript 代码是运行在 JavaScriptCore 中，是由 WKWebView 来渲染的，环境有 iOS8、iOS9、iOS10
// 在 Android 上，小程序的 javascript 代码是通过 X5 JSCore来解析，是由 X5 基于 Mobile Chrome 37 内核来渲染的
// 在 开发工具上， 小程序的 javascript 代码是运行在 nwjs 中，是由 Chrome Webview 来渲染的

/**
 * 逻辑层与视图层公用 JSBridge
 * @module
 */

import platform from './platform'

let isIOS = platform.isIOS()
let callbacks = {}
let callbackIndex = 0
let defaultEventHandlers = {}
let eventPrefix = 'custom_event_'
let handlers = {}
let IFRAME_PREFIX = 'hybridjsbrige_'

var utils = {
  // 解析 JSON 字符串
  parseData: function (str) {
    var result

    if (str && typeof str === 'string') {
      try {
        result = JSON.parse(str)
      } catch (e) {
        result = {
          status: {
            code: 1,
            msg: 'PARAM_PARSE_ERROR'
          }
        }
      }
    } else {
      result = str || {}
    }

    return result
  }
}

/**
 * 发布消息，得到回应后以返回值作为入参执行回调函数。
 * @function postMessage
 * @param {String} event 事件名
 * @param {String} paramsString 消息内容
 * @param {String} callbackId 回调函数标识 ID
 * @private
 */
var postMessage = function (event, paramsString, callbackId) {
  // postMessage
  if (isIOS) {
    globalThis.webkit.messageHandlers.invokeHandler.postMessage({
      C: event,
      paramsString: paramsString,
      callbackId: callbackId
    })
  } else {
    var jsCoreHandleResult = HeraJSCore.invokeHandler(
      event,
      paramsString,
      callbackId
    )

    if (
      typeof jsCoreHandleResult !== 'undefined' &&
        typeof callbacks[callbackId] === 'function' &&
        jsCoreHandleResult !== ''
    ) {
      try {
        jsCoreHandleResult = JSON.parse(jsCoreHandleResult)
      } catch (e) {
        jsCoreHandleResult = {}
      }

      callbacks[callbackId](jsCoreHandleResult), delete callbacks[callbackId]
    }
  }
}
/**
   * 从网页中删除一个 iframe 元素。
   * @function retrieveIframe
   * @param {String} sid iframe 的标识 ID
   * @private
   */
var retrieveIframe = function (sid) {
  var iframeId = IFRAME_PREFIX + sid
  var iframe = document.querySelector('#' + iframeId)

  if (iframe) {
    document.documentElement.removeChild(iframe)
  }
}
/**
   * TODO
   * @function publishHandler
   * @param {Unknown} event 事件名
   * @param {String} paramsString 消息内容
   * @param {Unknown} webviewIds
   * @private
   */
var publishHandler = function (event, paramsString, webviewIds) {
  // publishHandler
  isIOS
    ? globalThis.webkit.messageHandlers.publishHandler.postMessage({
      event: event,
      paramsString: paramsString,
      webviewIds: webviewIds
    })
    : HeraJSCore.publishHandler(event, paramsString, webviewIds)
}
/**
   * 触发事件，并执行回调函数。
   * @function invoke
   * @param {String} event 事件名
   * @param {Object} params 参数
   * @param {Function} callback 回调函数
   * @static
   */
var invoke = function (event, params, callback) {
  // postMessage
  var paramsString = JSON.stringify(params || {})
  var callbackId = ++callbackIndex
  // reportLog(event,params,'','invoke');
  callbacks[callbackId] = callback
  postMessage(event, paramsString, callbackId)
}
/**
   * 调用回调函数
   * @function invokeCallbackHandler
   * @param {String} callbackId 回调函数标识 ID
   * @param {*} params 回调函数调用参数
   * @static
   */
var invokeCallbackHandler = function (callbackId, params) {
  var callback = callbacks[callbackId]
  // reportLog('invokeCallbackHandler:'+callbackId,params,'','app2view_get');
  typeof callback === 'function' && callback(params),
  delete callbacks[callbackId]
  if (isIOS) retrieveIframe(callbackId)
}
/**
   * 老的回调函数调用方式
   * @function oldCallbackHandler
   * @param {(Object|String)} data
   * @param {Object} data.bridgeParam
   * @param {String} data.bridgeParam.callbackID 回调函数标识 ID
   * @param {*} data.param 回调函数调用参数
   * @static
   */
var oldCallbackHandler = function (data) {
  // {"bridgeParam":{"action":"call","callbackID":"1468927578039","status":{"status_code":-5,"status_reason":"'module' or 'identifier' is unsupported."}}}
  if (data) {
    if (typeof data === 'string') {
      data = utils.parseData(data)
    }

    var callbackId = data.bridgeParam.callbackID

    // 延迟是为了避免：
    // 在 ios 中，如果 onComplete 回调中有 alert 等有阻塞作用的代码时，会导致页面“卡死”（Native UI层级覆盖导致点击无效）
    if (callbackId) {
      setTimeout(function () {
        invokeCallbackHandler(callbackId, data.param)
      }, 1)
    }
  }
}
/**
   * TODO：内部调用了 retrieveIframe
   * @function publishCallbackHandler
   * @param {String} callbackId 回调函数标识 ID
   * @static
   */
var publishCallbackHandler = function (callbackId) {
  if (isIOS) retrieveIframe(callbackId)
}
/**
   * 监听原生事件
   * @function on
   * @param {String} eventName 事件名
   * @param {Function} handler 回调函数
   * @static
   */
var on = function (eventName, handler) {
  defaultEventHandlers[eventName] = handler
}
/**
   * 发布事件
   * @function publish
   * @param {Unknown} eventName 事件名
   * @param {Object} params 事件参数
   * @param {Unknown} webviewIds
   * @static
   */
var publish = function (eventName, params, webviewIds) {
  // publishHandler
  webviewIds = webviewIds || []
  var paramsString
  var event = eventPrefix + eventName
  paramsString = JSON.stringify(params)
  webviewIds = JSON.stringify(webviewIds)
  publishHandler(event, paramsString, webviewIds)
}
/**
   * 监听自定义事件
   * @function subscribe
   * @param {String} eventName 事件名
   * @param {Function} handler 回调函数
   * @static
   */
var subscribe = function (eventName, handler) {
  handlers[eventPrefix + eventName] = handler
}
/**
   * 调用事件回调函数
   * @function subscribeHandler
   * @param {String} eventName 事件名
   * @param {Object} data
   * @param {String} webviewId
   * @param {Object} reportParams
   * @static
   */
var subscribeHandler = function (eventName, data, webviewId, reportParams) {
  // 执行注册的回调
  var handler
    // reportLog('subscribeHandler:'+eventName,data,[webviewId||''],'app2view_get');
    ;(handler =
      eventName.indexOf(eventPrefix) != -1
        ? handlers[eventName]
        : defaultEventHandlers[eventName]),
  typeof handler === 'function' && handler(data, webviewId, reportParams)
}

const HeraJSBridge = {
  invoke,
  invokeCallbackHandler,
  oldCallbackHandler,
  publishCallbackHandler,
  on,
  publish,
  subscribe,
  subscribeHandler
}

/**
 * @global
 * @see module:common/jsbridge
 **/
globalThis.HeraJSBridge = HeraJSBridge

export default {
  ...HeraJSBridge
}

/**
 * 日志上报模块
 * @module
 */

import * as errorType from './errorType'
import platform from '../platform'

let jsBridge, bridgeName, logEventName

// 初始化 JSBridge 相关参数
if (typeof ServiceJSBridge !== 'undefined') {
  jsBridge = globalThis.ServiceJSBridge
  bridgeName = 'Service'
  logEventName = 'H5_JS_SERVICE_ERR'
} else if (typeof HeraJSBridge !== 'undefined') {
  jsBridge = globalThis.HeraJSBridge
  bridgeName = 'Hera'
  logEventName = 'H5_JS_VIEW_ERR'
}

/**
 * 监听 JSBridgeReady 事件
 * @param {Function} fn 回调函数
 * @private
 */
function onBridgeReady (fn) {
  typeof jsBridge !== 'undefined'
    ? fn()
    : document.addEventListener(bridgeName + 'JSBridgeReady', fn, !1)
}

/**
 * 调用 JSBridge.invoke 方法
 * @private
 */
function invoke () {
  // invoke
  var args = arguments
  onBridgeReady(function () {
    jsBridge.invoke.apply(jsBridge, args)
  })
}

/**
 * 以key/value的形式上报日志
 * @private
 */
function reportKeyValue () {
  // 以key/value的形式上报日志
  !reportKeyValues ||
    reportKeyValues.length <= 0 ||
    (invoke('reportKeyValue', {
      dataArray: reportKeyValues
    }),
    (reportKeyValues = []))
}

/**
 * TODO
 * @private
 */
function reportIDKey () {
  !reportIDKeys ||
    reportIDKeys.length <= 0 ||
    (invoke('reportIDKey', { dataArray: reportIDKeys }), (reportIDKeys = []))
}

/**
 * TODO
 * @private
 */
function systemLog () {
  !systemLogs ||
    systemLogs.length <= 0 ||
    (invoke('systemLog', { dataArray: systemLogs }), (systemLogs = []))
}

/**
 * 生成安全调用函数
 * @param {Function} fn
 * @return {Function}
 * @private
 */
function safeCall (fn) {
  //
  return function () {
    try {
      return fn.apply(fn, arguments)
    } catch (e) {
      console.error('reporter error:' + e.message)
    }
  }
}

var reportIDKeyLength = 1
var reportKeyValueLengthThreshold = 20
var systemLogLength = 50
var submitTLThreshold = 50
var reportKeyTLThreshold = 50
var reportIDKeyTLThreshold = 20
var logTLThreshold = 50
var speedReportThreshold = 500
var slowReportThreshold = 500
// errorReportTemp = 3,
// errorReportSize = 3,
var slowReportLength = 3
// errorReportLength = 50,
var slowReportValueLength = 50
var reportKeyValues = []
var reportIDKeys = []
var systemLogs = []
var reportKeyTimePreTime = 0
var reportIDKeyPreTime = 0
var logPreTime = 0
var submitPreTime = 0
var slowReportTime = 0
var speedReportMap = {}
// errorReportMap = {},
var slowReportMap = {}

var errListenerFns = function () {}
var utils = {
  // log report obj
  /**
   * 生成一个函数的包装函数。
   * 如果原函数执行时间超过 1s，则上报函数执行时间日志。
   * 如果函数执行出错，则上报函数执行错误日志。
   * @function surroundThirdByTryCatch
   * @param {Function} fn
   * @param {Unknown} ext
   * @return {Function}
   * @static
   */
  surroundThirdByTryCatch: function (fn, ext) {
    return function () {
      var res
      try {
        var startTime = Date.now()
        res = fn.apply(fn, arguments)
        var doTime = Date.now() - startTime
        doTime > 1e3 &&
          utils.slowReport({
            key: 'apiCallback',
            cost: doTime,
            extend: ext
          })
      } catch (e) {
        console.log(e)
        utils.thirdErrorReport({
          error: e,
          extend: ext
        })
      }
      return res
    }
  },

  /**
   * 慢上报日志
   * @param {Object} params 日志信息
   * @static
   */
  slowReport: function (params) {
    var key = params.key
    var cost = params.cost
    var extend = params.extend
    var force = params.force
    var slowValueType = errorType.SlowValueType[key]
    var now = Date.now()
    // 指定类型 强制或上报间隔大于＝指定阀值 extend类型数不超出阀值&当前extend上报数不超出阀值
    var flag =
      slowValueType &&
      (force || !(now - slowReportTime < slowReportThreshold)) &&
      !(
        Object.keys(slowReportMap).length > slowReportValueLength ||
        (slowReportMap[extend] || (slowReportMap[extend] = 0),
        slowReportMap[extend]++,
        slowReportMap[extend] > slowReportLength)
      )

    if (flag) {
      slowReportTime = now
      var value = cost + ',' + encodeURIComponent(extend) + ',' + slowValueType
      utils.reportKeyValue({
        key: 'Slow',
        value: value,
        force: !0
      })
    }
  },

  /**
   * 快速上报日志
   * @param {Object} params 日志信息
   * @static
   */
  speedReport: function (params) {
    var key = params.key
    var data = params.data
    var timeMark = params.timeMark
    var force = params.force
    var SpeedValueType = errorType.SpeedValueType[key]
    var now = Date.now()
    var dataLength = 0
    var nativeTime = timeMark.nativeTime
    var flag =
        SpeedValueType &&
        (force ||
          !(
            now - (speedReportMap[SpeedValueType] || 0) <
            speedReportThreshold
          )) &&
        timeMark.startTime &&
        timeMark.endTime &&
        ((SpeedValueType != 1 && SpeedValueType != 2) || nativeTime)

    if (flag) {
      data && (dataLength = JSON.stringify(data).length)
      speedReportMap[SpeedValueType] = now
      var value =
        SpeedValueType +
        ',' +
        timeMark.startTime +
        ',' +
        nativeTime +
        ',' +
        nativeTime +
        ',' +
        timeMark.endTime +
        ',' +
        dataLength
      utils.reportKeyValue({
        key: 'Speed',
        value: value,
        force: true
      })
    }
  },

  /**
   * 上报 key/value 日志
   * @param {Object} params 日志信息
   * @static
   */
  reportKeyValue: function (params) {
    var key = params.key
    var value = params.value
    var force = params.force
    errorType.KeyValueType[key] &&
      ((!force && Date.now() - reportKeyTimePreTime < reportKeyTLThreshold) ||
        ((reportKeyTimePreTime = Date.now()),
        reportKeyValues.push({
          key: errorType.KeyValueType[key],
          value: value
        }),
        reportKeyValues.length >= reportKeyValueLengthThreshold &&
          reportKeyValue()))
  },

  /**
   * 上报 IDKey 日志
   * @param {Object} params 日志信息
   * @static
   */
  reportIDKey: function (params) {
    var id = params.id
    var key = params.key
    var force = params.force
    errorType.IDKeyType[key] &&
      ((!force && Date.now() - reportIDKeyPreTime < reportIDKeyTLThreshold) ||
        ((reportIDKeyPreTime = Date.now()),
        reportIDKeys.push({
          id: id || platform.isIOS() ? '356' : '358',
          key: errorType.IDKeyType[key],
          value: 1
        }),
        reportIDKeys.length >= reportIDKeyLength && reportIDKey()))
  },

  /**
   * 上报第三方错误日志
   * @param {Object} params 日志信息
   * @static
   */
  thirdErrorReport: function (params) {
    var error = params.error
    var extend = params.extend
    console.log(error)
    utils.errorReport({
      key: 'thirdScriptError',
      error: error,
      extend: extend
    })
  },

  /**
   * 上报错误日志
   * @param {Object} params 日志信息
   * @static
   */
  errorReport: function (params) {
    var data = {}
    var error = params.error || {}
    var extend = params.extend
    data.msg = extend ? error.message + ';' + extend : error.message
    data.stack = error.stack

    if (errorType.ErrorType[params.key]) {
      data.key = params.key
    } else {
      data.key = 'unknowErr'
    }

    jsBridge.publish('H5_LOG_MSG', { event: logEventName, desc: data }, [
      params.webviewId || ''
    ])
  },

  /**
   * 上报系统日志
   * @param {String} log 日志信息
   * @param {Boolean} debug
   * @static
   */
  log: function (log, debug) {
    log &&
      typeof log === 'string' &&
      ((!debug && Date.now() - logPreTime < logTLThreshold) ||
        ((logPreTime = Date.now()),
        systemLogs.push(log + ''),
        systemLogs.length >= systemLogLength && systemLog()))
  },

  /**
   * 上报各类日志
   * @static
   */
  submit: function () {
    Date.now() - submitPreTime < submitTLThreshold ||
      ((submitPreTime = Date.now()),
      reportIDKey(),
      reportKeyValue(),
      systemLog())
  },

  /**
   * 添加错误监听器
   * @param {Function} fn 回调函数
   * @static
   */
  registerErrorListener: function (fn) {
    typeof fn === 'function' && (errListenerFns = fn)
  },

  /**
   * 清除错误监听器
   * @static
   */
  unRegisterErrorListener: function () {
    errListenerFns = function () {}
  },

  /**
   * 触发错误事件
   * @param {*} params 事件参数
   * @static
   */
  triggerErrorMessage: function (params) {
    errListenerFns(params)
  }
}

var defineObj = {}

/**
 * 基于 utils 上的方法生成安全调用函数，并赋值给 defineObj。
 * @param {String} key 方法名
 * @private
 */
/* function _defindGeter (key) {
  defineObj.__defineGetter__(key, function () {
    return safeCall(utils[key])
  })
} */

Object.entries(utils).forEach(([key, fn]) => {
  defineObj[key] = safeCall(fn)
})

/* for (var key in utils) {
  _defindGeter(key)
} */

// 页面卸载前提交日志信息
typeof globalThis !== 'undefined' &&
  (globalThis.onbeforeunload = function () {
    utils.submit()
  })

/**
 * @global
 */
globalThis.Reporter = defineObj

export default {
  ...defineObj
}

import utils from './utils'

function invoke () {
  // ServiceJSBridge.invoke
  ServiceJSBridge.invoke.apply(ServiceJSBridge, arguments)
}

function on () {
  // ServiceJSBridge.on
  ServiceJSBridge.on.apply(ServiceJSBridge, arguments)
}

function publish () {
  // ServiceJSBridge.publish
  var args = Array.prototype.slice.call(arguments)
  args[1] = {
    data: args[1],
    options: {
      timestamp: Date.now()
    }
  }
  ServiceJSBridge.publish.apply(ServiceJSBridge, args)
}

function subscribe () {
  // ServiceJSBridge.subscribe
  var args = Array.prototype.slice.call(arguments)
  var callback = args[1]
  args[1] = function (params, viewId) {
    var data = params.data
    var options = params.options
    var timeMark =
        arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}
    var timestamp = (options && options.timestamp) || 0
    var curTime = Date.now()
    typeof callback === 'function' && callback(data, viewId)
    Reporter.speedReport({
      key: 'webview2AppService',
      data: data || {},
      timeMark: {
        startTime: timestamp,
        endTime: curTime,
        nativeTime: timeMark.nativeTime || 0
      }
    })
  }
  ServiceJSBridge.subscribe.apply(ServiceJSBridge, args)
}

function invokeMethod (apiName) {
  var options =
      arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}
  var innerFns =
      arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}
  var params = {}
  for (var i in options) {
    typeof options[i] === 'function' &&
      ((params[i] = Reporter.surroundThirdByTryCatch(
        options[i],
        'at api ' + apiName + ' ' + i + ' callback function'
      )),
      delete options[i])
  }
  var sysEventFns = {}
  for (var s in innerFns) {
    typeof innerFns[s] === 'function' &&
      (sysEventFns[s] = utils.surroundByTryCatchFactory(
        innerFns[s],
        'at api ' + apiName + ' ' + s + ' callback function'
      ))
  }
  invoke(apiName, options, function (res) {
    res.errMsg = res.errMsg || apiName + ':ok'
    var isOk = res.errMsg.indexOf(apiName + ':ok') === 0
    var isCancel = res.errMsg.indexOf(apiName + ':cancel') === 0
    var isFail = res.errMsg.indexOf(apiName + ':fail') === 0
    if (
      (typeof sysEventFns.beforeAll === 'function' && sysEventFns.beforeAll(res),
      isOk)
    ) {
      typeof sysEventFns.beforeSuccess === 'function' &&
        sysEventFns.beforeSuccess(res),
      typeof params.success === 'function' && params.success(res),
      typeof sysEventFns.afterSuccess === 'function' &&
          sysEventFns.afterSuccess(res)
    } else if (isCancel) {
      (res.errMsg = res.errMsg.replace(
        apiName + ':cancel',
        apiName + ':fail cancel'
      )),
      typeof params.fail === 'function' && params.fail(res),
      typeof sysEventFns.beforeCancel === 'function' &&
          sysEventFns.beforeCancel(res),
      typeof params.cancel === 'function' && params.cancel(res),
      typeof sysEventFns.afterCancel === 'function' &&
          sysEventFns.afterCancel(res)
    } else if (isFail) {
      typeof sysEventFns.beforeFail === 'function' &&
        sysEventFns.beforeFail(res),
      typeof params.fail === 'function' && params.fail(res)
      var rt = !0
      typeof sysEventFns.afterFail === 'function' &&
        (rt = sysEventFns.afterFail(res)),
      rt !== !1 &&
          Reporter.reportIDKey({
            key: apiName + '_fail'
          })
    }
    typeof params.complete === 'function' && params.complete(res),
    typeof sysEventFns.afterAll === 'function' && sysEventFns.afterAll(res)
  })
  Reporter.reportIDKey({
    key: apiName
  })
}
function noop () {}
function onMethod (apiName, callback) {
  // onMethod
  on(
    apiName,
    utils.surroundByTryCatchFactory(
      callback,
      'at api ' + apiName + ' callback function'
    )
  )
}
function beforeInvoke (apiName, params, paramTpl) {
  var res = utils.paramCheck(params, paramTpl)
  return (
    !res || (beforeInvokeFail(apiName, params, 'parameter error: ' + res), !1)
  )
}

function beforeInvokeFail (apiName) {
  var params =
      arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}
  var errMsg =
      arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : ''
  var err = apiName + ':fail ' + errMsg
  console.error(err)
  var fail = Reporter.surroundThirdByTryCatch(
    params.fail || noop,
    'at api ' + apiName + ' fail callback function'
  )
  var complete = Reporter.surroundThirdByTryCatch(
    params.complete || noop,
    'at api ' + apiName + ' complete callback function'
  )
  fail({ errMsg: err })
  complete({ errMsg: err })
}

function checkUrlInConfig (apiName, url, params) {
  var path = url.replace(/\.html\?.*|\.html$/, '')
  return (
    __wxConfig.pages.indexOf(path) !== -1 ||
    (beforeInvokeFail(
      apiName,
      params,
      'url "' + utils.removeHtmlSuffixFromUrl(url) + '" is not in app.json'
    ),
    !1)
  )
}

// 在桥接执行几个方法
export default {
  invoke: invoke,
  on: on,
  publish: publish,
  subscribe: subscribe,
  invokeMethod: invokeMethod,
  onMethod: onMethod,
  noop: noop,
  beforeInvoke: beforeInvoke,
  beforeInvokeFail: beforeInvokeFail,
  checkUrlInConfig: checkUrlInConfig
}

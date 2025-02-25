/**
 * @module
 */

/**
 * 辅助函数 是否是devtool环境
 * @returns {boolean}
 * @todo 显然有误，且该功能与其他模块有重复。
 */
var isDevTools = function () {
  return true
}

/**
 * 给url增加.html后缀
 * @param {string} url
 * @returns {string}
 */
var addHtmlSuffixToUrl = function (url) {
  // 给url增加.html后缀
  if (typeof url !== 'string') {
    return url
  }
  var uri = url.split('?')[0]
  var query = url.split('?')[1]
  uri += '.html'
  if (typeof query !== 'undefined') {
    return uri + '?' + query
  } else {
    return uri
  }
}

/**
 * 去除.html后缀
 * @param {string} url
 * @returns {string}
 */
var removeHtmlSuffixFromUrl = function (url) {
  // 去除url后面的.html
  if (typeof url === 'string' && url.indexOf('.html') === url.length - 4) {
    return url.substring(0, url.length - 5)
  } else {
    return url
  }
}

var hasOwnProperty = Object.prototype.hasOwnProperty

var toString = Object.prototype.toString

/**
 * 封装报错
 * @param {String} e 错误描述
 */
class AppServiceEngineKnownError extends Error {
  constructor (e) {
    super('APP-SERVICE-Engine:' + e)
    this.type = 'AppServiceEngineKnownError'
  }
}

var pageEngine = {
  getPlatform: function () {
    // get platform
    return 'devtools'
  },
  /**
   * 安全执行 page里面的各种函数
   * @returns {any}
   * @todo 重复功能
   */
  safeInvoke: function () {
    // do page method
    var res = void 0
    var args = Array.prototype.slice.call(arguments)
    var fn = args[0]
    args = args.slice(1)
    try {
      var startTime = Date.now()
      res = this[fn].apply(this, args)
      var doTime = Date.now() - startTime
      doTime > 1e3 &&
        Reporter.slowReport({
          key: 'pageInvoke',
          cost: doTime,
          extend: 'at ' + this.__route__ + ' page ' + fn + ' function'
        })
    } catch (e) {
      Reporter.thirdErrorReport({
        error: e,
        extend: 'at "' + this.__route__ + '" page ' + fn + ' function'
      })
    }
    return res
  },
  /**
   * 是否是空对象
   * @param {any} obj
   * @returns {any}
   * @todo 与 view/virtual-dom/Utils.js 中功能类似
   */
  isEmptyObject: function (obj) {
    for (var t in obj) {
      if (obj.hasOwnProperty(t)) {
        return false
      }
    }
    return true
  },

  /**
   * 拷贝
   * Object.assign
   * @param {any} target
   * @param {any} obj
   * @returns {any}
   */
  extend: function (target, obj) {
    for (var keys = Object.keys(obj), o = keys.length; o--;) {
      target[keys[o]] = obj[keys[o]]
    }
    return target
  },

  /**
   * 空函数
   */
  noop: function () {},

  /**
   * 获取toStringTag
   * @param {any} param
   * @returns {any}
   */
  getDataType: function (param) {
    return Object.prototype.toString
      .call(param)
      .split(' ')[1]
      .split(']')[0]
  },
  isObject: function (param) {
    return param !== null && typeof param === 'object'
  },
  hasOwn: function (obj, attr) {
    return hasOwnProperty.call(obj, attr)
  },
  def: function (obj, attr, value, enumerable) {
    Object.defineProperty(obj, attr, {
      value: value,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    })
  },
  isPlainObject: function (e) {
    return toString.call(e) === '[object Object]'
  },

  /**
   * 在控制台打印错误信息。
   **/
  error: function (title, err) {
    console.group(new Date() + ' ' + title)
    console.error(err)
    console.groupEnd()
  },

  /**
   * 在控制台打印警告信息。
   **/
  warn: function (title, warn) {
    console.group(new Date() + ' ' + title)
    console.warn(warn)
    console.groupEnd()
  },

  /**
   * 在控制台打印信息。
   **/
  info: function (msg) {
    __wxConfig__ && __wxConfig__.debug && console.info(msg)
  },

  /**
   * 安全执行，错误上报
   * @param {any} fn
   * @param {any} extend
   * @returns {any}
   */
  surroundByTryCatch: function (fn, extend) {
    var self = this
    return function () {
      try {
        return fn.apply(fn, arguments)
      } catch (e) {
        console.log(e)
        self.errorReport(e, extend)
        return function () {}
      }
    }
  },

  errorReport: function (err, extend) {
    // d
    if (Object.prototype.toString.apply(err) === '[object Error]') {
      if (err.type === 'AppServiceEngineKnownError') {
        throw err
      }
      Reporter.errorReport({
        key: 'jsEnginScriptError',
        error: err,
        extend: extend
      })
    }
  },

  /**
   * 封装了钩子函数
   * @returns {any}
   */
  publish: function () {
    var params = Array.prototype.slice.call(arguments)
    var defaultOpt = {
      options: {
        timestamp: Date.now()
      }
    }
    params[1]
      ? (params[1].options = this.extend(
        params[1].options || {},
        defaultOpt.options
      ))
      : (params[1] = defaultOpt)
    ServiceJSBridge.publish.apply(ServiceJSBridge, params)
  },

  AppServiceEngineKnownError: AppServiceEngineKnownError
}

// export default Object.assi{},{},pageEngine,htmlSuffix);
export default {
  ...pageEngine,
  isDevTools,
  addHtmlSuffixToUrl,
  removeHtmlSuffixFromUrl
}

/**
 * 错误监控及上报。
 * @module
 **/

import reporter from '@/common/reporter'
import exparser from '../exparser'

/**
 * 生成一个函数的安全调用函数，当原函数执行出错时会记录该错误，错误不会被抛出。
 * @param {Function} func 原函数
 * @return {Function} 安全调用函数
 * @static
 **/
const catchError = function (func) {
  return function () {
    try {
      func.apply(void 0, Array.from(arguments))
    } catch (err) {
      console.error(err.stack)
      reporter.errorReport({
        key: 'exparserScriptError',
        error: err
      })
    }
  }
}

// 监控全局错误，并上报日志。
exparser.addGlobalErrorListener(function (error, errData) {
  reporter.errorReport({
    key: 'webviewScriptError',
    error: error,
    extend: errData.message
  })
})

export default { catchError }

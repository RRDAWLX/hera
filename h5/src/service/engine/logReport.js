/**
 * @module
 */
/**
 * 上报监控
 * @param {any} eventName 事件名
 * @param {Object} pageObj 页面对象
 * @param {String} pageObj.__route__ 页面路由
 * @param {String} pageObj.__wxWebviewId__ 页面对应的 Webview ID
 * @param {any} desc 日志描述信息
 * @returns {any}
 */

export var triggerAnalytics = function (eventName, pageObj, desc) {
  let data = {}
  if (pageObj) {
    data.pageRoute = pageObj.__route__
  }
  if (desc) {
    data.desc = desc
  }
  ServiceJSBridge.publish('H5_LOG_MSG', { event: eventName, desc: data }, [
    (pageObj && pageObj.__wxWebviewId__) || ''
  ])
}

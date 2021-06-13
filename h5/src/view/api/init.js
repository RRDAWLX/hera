/**
 * 页面初始化：<br />
 * 1、监听 5 个事件：log、warn、error、info、debug。<br />
 * 2、监听 initLogs 事件，根据入参执行 console 上的相关方法。<br />
 * 3、在页面中的 DOMContentLoaded 事件被触发 100 ms 后，发布 DOMContentLoaded 事件。
 * @module
 */

import bridge from './bridge'

/**
 * 在 DOMContentLoaded 事件被触发后之后执行回调函数
 * @param {Function} callback
 * @private
 */
function execOnReady (callback) {
  document.readyState !== 'loading'
    ? callback()
    : document.addEventListener('DOMContentLoaded', callback)
}

// 监听以上 5 个事件
['log', 'warn', 'error', 'info', 'debug'].forEach(name =>
  bridge.subscribe(name, ({ log }) => console[name].apply(console, log))
)

let hasInitLogs = false
// 订阅 initLogs 事件
bridge.subscribe('initLogs', ({ logs }) => {
  if (!hasInitLogs) {
    hasInitLogs = true
    logs.forEach(({ method, log }) => console[method].apply(console, log))
  }
})

// 在页面中的 DOMContentLoaded 事件被触发 100 ms 后，在 JSBridge 上发布 DOMContentLoaded 事件。
execOnReady(() => setTimeout(() => bridge.publish('DOMContentLoaded', {}), 100))

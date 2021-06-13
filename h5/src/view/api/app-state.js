/**
 * 页面进入前台、进入后台的回调函数的注册。
 * @module
 **/

import bridge from './bridge'

let foregroundCallbacks = []
let backgroundCallbacks = []

/**
 * 注册页面进入前台的回调函数
 * @param {Function} callback 回调函数
 */
export function onAppEnterForeground (callback) {
  foregroundCallbacks.push(callback)
}

/**
 * 注册页面进入后台的回调函数
 * @param {Function} callback 回调函数
 * @static
 */
export function onAppEnterBackground (callback) {
  backgroundCallbacks.push(callback)
}

bridge.subscribe('onAppEnterForeground', function (e) {
  foregroundCallbacks.forEach(callback => callback(e))
})

bridge.subscribe('onAppEnterBackground', function (e) {
  backgroundCallbacks.forEach(callback => callback(e))
})

export default {
  onAppEnterForeground,
  onAppEnterBackground
}

// TODO: INVOKE_METHOD 事件的参数为 name，args；
// PAGE_EVENT 事件的参数位 eventName，data。应该可以保持一致，待优化。

import reporter from '@/common/reporter'
import platform from '@/common/platform'
import bridge from './bridge'
import contactButton from './contact-button'
import appState from './app-state'
import { animationToStyle } from './style'
import './init'
import { getLocalImgData } from './image'
import route from './route'
import version from './version'

/**
 * 发布 INVOKE_METHOD 事件。
 * @param {String} name 要调用的方法名称
 * @param {Object} args 调用参数。
 * @private
 **/
function publishInvokeMethod (name, args) {
  bridge.publish('INVOKE_METHOD', { name, args })
}

// TODO: 接口文档待完善
let apiObj = {
  invoke: bridge.invoke,
  on: bridge.on,
  getPlatform: platform.getPlatform,

  ...appState,
  ...contactButton,
  ...route,
  getLocalImgData,
  animationToStyle,

  initReady: function () {
    bridge.invokeMethod('initReady')
  },
  redirectTo: function (params) {
    publishInvokeMethod('redirectTo', params)
  },
  navigateTo: function (params) {
    publishInvokeMethod('navigateTo', params)
  },
  reLaunch: function (params) {
    publishInvokeMethod('reLaunch', params)
  },
  switchTab: function (params) {
    publishInvokeMethod('switchTab', params)
  },
  clearStorage: function () {
    publishInvokeMethod('clearStorage', {})
  },
  showKeyboard: function (params) {
    bridge.invokeMethod('showKeyboard', params)
  },
  showDatePickerView: function (params) {
    bridge.invokeMethod('showDatePickerView', params)
  },
  hideKeyboard: function (params) {
    bridge.invokeMethod('hideKeyboard', params)
  },
  insertMap: function (params) {
    bridge.invokeMethod('insertMap', params)
  },
  removeMap: function (params) {
    bridge.invokeMethod('removeMap', params)
  },
  updateMapCovers: function (params) {
    bridge.invokeMethod('updateMapCovers', params)
  },
  insertVideoPlayer: function (e) {
    bridge.invokeMethod('insertVideoPlayer', e)
  },
  removeVideoPlayer: function (e) {
    bridge.invokeMethod('removeVideoPlayer', e)
  },
  insertShareButton: function (e) {
    bridge.invokeMethod('insertShareButton', e)
  },
  updateShareButton: function (e) {
    bridge.invokeMethod('updateShareButton', e)
  },
  removeShareButton: function (e) {
    bridge.invokeMethod('removeShareButton', e)
  },
  onAppDataChange: function (callback) {
    bridge.subscribe('appDataChange', callback)
  },
  onPageScrollTo: function (callback) {
    bridge.subscribe('pageScrollTo', callback)
  },
  publishPageEvent: function (eventName, data) {
    bridge.publish('PAGE_EVENT', { eventName, data })
  }
}

let exportApi = { version }
// 将 apiObj 上的所有方法进行封装，然后添加到 exportApi 上
Object.entries(apiObj).forEach(([key, fn]) => {
  if (platform.isDevtools()) {
    exportApi[key] = fn
  } else {
    exportApi[key] = function (...args) {
      try {
        return fn.apply(this, args)
      } catch (error) {
        reporter.errorReport({
          key: 'webviewSDKScriptError',
          error
        })
      }
    }
  }
})

/**
 * 在全局对象上挂载 exportApi。
 * @module
 */
/** @global */
window.wd = exportApi
export default {
  ...exportApi
}

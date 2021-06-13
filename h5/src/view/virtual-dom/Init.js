/**
 * @module
 **/

import Enums from './Enums'
import './Utils'

// 设置网页根元素的 font-size
const initFontSize = function () {
  document.addEventListener(
    'DOMContentLoaded',
    function () {
      let screenWidth = window.innerWidth > 0 ? window.innerWidth : screen.width
      // screenWidth = screenWidth>375?375:screenWidth
      document.documentElement.style.fontSize =
        screenWidth / Enums.RPX_RATE + 'px'
    },
    1e3
  )
}

/**
 * 初始化：
 * 1、在全局环境挂载 webview 引擎版本号。
 * 2、设置网页根元素的 font-size。
 **/
const init = function () {
  /**
   * webview 引擎版本号
   * @global
   **/
  window.__webview_engine_version__ = 0.02
  initFontSize()
}

export default { init }

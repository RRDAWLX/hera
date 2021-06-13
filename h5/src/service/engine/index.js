/**
 * @module
 */

// 小程序service 接口api 导出
import pageInit from './pageInit'
import initApp from './initApp'

// 暴露Page方法
window.Page = pageInit.pageHolder
// 暴露App方法
window.App = initApp.appHolder

window.getApp = initApp.getApp
window.getCurrentPages = pageInit.getCurrentPages

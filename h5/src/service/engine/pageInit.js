/**
 * @module
 */

import utils from './utils'
import parsePage from './parsePage'
import * as eventDefine from './constants'
import * as reportRealtimeAction from './logReport'

var getRouteToPage
var getWebviewIdToPage
var setWxRouteBegin
var setWxRoute
var setWxConfig
var reset
var pageHolder
var getCurrentPages
var getCurrentPage

var pageStack = [] // 页面堆栈

var tabBars = [] // tab栏url列表

var currentPage
__wxConfig__.tabBar &&
  __wxConfig__.tabBar.list &&
  typeof __wxConfig__.tabBar.list === 'object' &&
  typeof __wxConfig__.tabBar.list.forEach === 'function' &&
  __wxConfig__.tabBar.list.forEach(function (item) {
    tabBars.push(item.pagePath)
  })

var app = {
  appRouteTime: 0,
  newPageTime: 0,
  pageReadyTime: 0
}

var speedReport = function (key, startTime, endTime) {
  Reporter.speedReport({
    key: key,
    timeMark: {
      startTime: startTime,
      endTime: endTime
    }
  })
}

var pageStackObjs = {}

var pageRegObjs = {} // key:pathname value: 是PageObj

var pageIndex = 0

/**
 * 获取currentPage
 * @returns {any}
 */
getCurrentPage = function () {
  return currentPage
}

/**
 * 从pageStack中获取所有的page列表
 * @returns {}
 */
getCurrentPages = function () {
  var pageArr = []
  pageStack.forEach(function (pageObj) {
    pageArr.push(pageObj.page)
  })
  return pageArr
}

/**
 * 注册Page实例，和Path关联起来，缓存到本地变量中，并且改变PageIndex
 * @param {any} pageObj
 * @returns {void}
 */
pageHolder = function (pageObj) {
  // Page 接口
  if (!__wxRouteBegin) {
    throw utils.error(
      'Page 注册错误',
      'Please do not register multiple Pages in ' + __wxRoute + '.js'
    )
    new utils.AppServiceEngineKnownError(
      'Please do not register multiple Pages in ' + __wxRoute + '.js'
    )
  }

  __wxRouteBegin = !1
  var pages = __wxConfig__.pages
  var pagePath = pages[pageIndex]

  // 注册page，然后pageIndex + 1
  pageIndex++

  if (utils.getDataType(pageObj) !== 'Object') {
    throw utils.error(
      'Page 注册错误',
      'Options is not object: ' +
        JSON.stringify(pageObj) +
        ' in ' +
        __wxRoute +
        '.js'
    )
    new utils.AppServiceEngineKnownError(
      'Options is not object: ' +
        JSON.stringify(pageObj) +
        ' in ' +
        __wxRoute +
        '.js'
    )
  }

  utils.info('Register Page: ' + pagePath)
  pageRegObjs[pagePath] = pageObj
}

/**
 * 初始化Page的data属性，然后调用appDataChange 渲染
 * @param {string} pageObj
 * @param {number} webviewId
 * @returns {void}
 */
var pageInitData = utils.surroundByTryCatch(function (pageObj, webviewId) {
  utils.info('Update view with init data')
  var ext = {}
  ;(ext.webviewId = webviewId),
  (ext.enablePullUpRefresh = pageObj.hasOwnProperty('onReachBottom'))
  var params = {
    data: {
      data: pageObj.data,
      ext: ext,
      options: {
        firstRender: !0
      }
    }
  }
  utils.publish('appDataChange', params, [webviewId])
})

/**
 * 描述
 * @param {string} routePath 路由
 * @param {id} webviewId webviewId
 * @param {any} params 其他参数
 * @returns {void}
 */
var pageParse = function (routePath, webviewId, params) {
  // 解析page e:pagepath t:webviewId params:
  var curPageObj
  routePath = routePath.replace(/\.htm[^\.]*$/, '')

  // 找到对应的PageObj
  if (pageRegObjs.hasOwnProperty(routePath)) {
    curPageObj = pageRegObjs[routePath]
  } else {
    utils.warn(
      'Page route 错误',
      'Page[' +
        routePath +
        '] not found. May be caused by: 1. Forgot to add page route in app.json. 2. Invoking Page() in async task.'
    )
    curPageObj = {}
  }

  app.newPageTime = Date.now()

  // 编译出来一个内部的page对象 把data，方法，更新操作等等维护在page实例中
  var page = new parsePage(curPageObj, webviewId, routePath)

  // 初始化page，然后通知更新dom
  pageInitData(page, webviewId)

  if (utils.isDevTools()) {
    __wxAppData[routePath] = page.data
    __wxAppData[routePath].__webviewId__ = webviewId
    utils.publish(eventDefine.UPDATE_APP_DATA)
  }

  // 将当前page对象，放入到页面栈中
  currentPage = {
    page: page,
    webviewId: webviewId,
    route: routePath
  }
  pageStack.push(currentPage)

  // 调用页面的生命周期函数
  page.onLoad(params)
  page.onShow()

  // 缓存到本地
  pageStackObjs[webviewId] = {
    page: page,
    route: routePath
  }

  // 发送报告
  reportRealtimeAction.triggerAnalytics('enterPage', page)
  speedReport('appRoute2newPage', app.appRouteTime, app.newPageTime)
}

/**
 * 辅助函数，隐藏page
 * @param {any} pageItem
 * @returns {any}
 */
var pageHide = function (pageItem) {
  // 执行page hide event
  pageItem.page.onHide()
  reportRealtimeAction.triggerAnalytics('leavePage', pageItem.page)
}

/**
 * 辅助函数，卸载page
 * @param {any} pageItem
 * @returns {any}
 */
var pageUnload = function (pageItem) {
  // do page unload
  pageItem.page.onUnload()
  utils.isDevTools() &&
    (delete __wxAppData[pageItem.route],
    utils.publish(eventDefine.UPDATE_APP_DATA))
  delete pageStackObjs[pageItem.webviewId]
  pageStack = pageStack.slice(0, pageStack.length - 1)
  reportRealtimeAction.triggerAnalytics('leavePage', pageItem.page)
}

/**
 * 辅助函数，不知道是啥
 * @param {any} pageItem
 * @returns {any}
 */
var isTabBarsPage = function (pageItem) {
  return (
    tabBars.indexOf(pageItem.route) !== -1 ||
    tabBars.indexOf(pageItem.route + '.html') !== -1
  )
}

/**
 * 打开，跳转，返回的页面操作。主要内容是路由切换的逻辑
 * @param {any} routePath
 * @param {any} pWebViewId
 * @param {any} pageParams
 * @param {any} pApiKey
 * @returns {any}
 */
var skipPage = function (routePath, pWebViewId, pageParams, pApiKey) {
  // 打开、跳转页面
  utils.info('On app route: ' + routePath)
  app.appRouteTime = Date.now()

  if (pApiKey === 'navigateTo') {
    currentPage && pageHide(currentPage)
    pageStackObjs.hasOwnProperty(pWebViewId)
      ? utils.error(
        'Page route 错误(system error)',
        'navigateTo with an already exist webviewId ' + pWebViewId
      )
      : pageParse(routePath, pWebViewId, pageParams)
  } else if (pApiKey === 'redirectTo') {
    currentPage && pageUnload(currentPage)
    pageStackObjs.hasOwnProperty(pWebViewId)
      ? utils.error(
        'Page route 错误(system error)',
        'redirectTo with an already exist webviewId ' + pWebViewId
      )
      : pageParse(routePath, pWebViewId, pageParams)
  } else if (pApiKey === 'navigateBack') {
    for (var isExist = !1, i = pageStack.length - 1; i >= 0; i--) {
      var pageItem = pageStack[i]

      if (pageItem.webviewId === pWebViewId) {
        isExist = !0
        currentPage = pageItem
        pageItem.page.onShow()
        reportRealtimeAction.triggerAnalytics('enterPage', pageItem)
        break
      }

      pageUnload(pageItem)
    }

    isExist ||
      utils.error(
        'Page route 错误(system error)',
        'navigateBack with an unexist webviewId ' + pWebViewId
      )
  } else if (pApiKey === 'reLaunch') {
    currentPage && pageUnload(currentPage)
    pageStackObjs.hasOwnProperty(pWebViewId)
      ? utils.error(
        'Page route 错误(system error)',
        'redirectTo with an already exist webviewId ' + pWebViewId
      )
      : pageParse(routePath, pWebViewId, pageParams)
  } else if (pApiKey === 'switchTab') {
    for (var onlyOnePage = !0; pageStack.length > 1;) {
      pageUnload(pageStack[pageStack.length - 1])
      onlyOnePage = !1
    }

    if (pageStack[0].webviewId === pWebViewId) {
      currentPage = pageStack[0]
      onlyOnePage || currentPage.page.onShow()
    } else if (
      (isTabBarsPage(pageStack[0])
        ? onlyOnePage && pageHide(pageStack[0])
        : pageUnload(pageStack[0]),
      pageStackObjs.hasOwnProperty(pWebViewId))
    ) {
      var pageObj = pageStackObjs[pWebViewId].page
      currentPage = {
        webviewId: pWebViewId,
        route: routePath,
        page: pageObj
      }
      pageStack = [currentPage]
      pageObj.onShow()
      reportRealtimeAction.triggerAnalytics('enterPage', pageObj)
    } else {
      pageStack = []
      pageParse(routePath, pWebViewId, pageParams)
    }
  } else {
    pApiKey === 'appLaunch'
      ? pageStackObjs.hasOwnProperty(pWebViewId)
        ? utils.error(
          'Page route 错误(system error)',
          'appLaunch with an already exist webviewId ' + pWebViewId
        )
        : pageParse(routePath, pWebViewId, pageParams)
      : utils.error(
        'Page route 错误(system error)',
        'Illegal open type: ' + pApiKey
      )
  }
}

/**
 * dom ready回调
 * @param {any} pWebviewId
 * @param {any} pEvent
 * @param {any} params
 * @returns {any}
 */
var doWebviewEvent = function (pWebviewId, pEvent, params) {
  // do dom ready
  if (!pageStackObjs.hasOwnProperty(pWebviewId)) {
    return utils.warn(
      '事件警告',
      'OnWebviewEvent: ' + pEvent + ', WebviewId: ' + pWebviewId + ' not found'
    )
  }

  var pageItem = pageStackObjs[pWebviewId]
  var pageObj = pageItem.page

  return pEvent === eventDefine.DOM_READY_EVENT
    ? ((app.pageReadyTime = Date.now()),
    utils.info('Invoke event onReady in page: ' + pageItem.route),
    pageObj.onReady(),
    reportRealtimeAction.triggerAnalytics('pageReady', pageObj),
    void speedReport('newPage2pageReady', app.newPageTime, app.pageReadyTime))
    : (utils.info('Invoke event ' + pEvent + ' in page: ' + pageItem.route),
    pageObj.hasOwnProperty(pEvent)
      ? utils.safeInvoke.call(pageObj, pEvent, params)
      : utils.warn(
        '事件警告',
        'Do not have ' +
              pEvent +
              ' handler in current page: ' +
              pageItem.route +
              '. Please make sure that ' +
              pEvent +
              ' handler has been defined in ' +
              pageItem.route +
              ', or ' +
              pageItem.route +
              ' has been added into app.json'
      ))
}

/**
 * 下拉刷新钩子，执行对应page的刷新逻辑
 * @param {any} pWebviewId
 * @returns {any}
 */
var pullDownRefresh = function (pWebviewId) {
  // do pulldownrefresh
  pageStackObjs.hasOwnProperty(pWebviewId) ||
    utils.warn(
      '事件警告',
      'onPullDownRefresh WebviewId: ' + pWebviewId + ' not found'
    )

  var pageItem = pageStackObjs[pWebviewId]
  var pageObj = pageItem.page

  if (pageObj.hasOwnProperty('onPullDownRefresh')) {
    utils.info('Invoke event onPullDownRefresh in page: ' + pageItem.route)
    utils.safeInvoke.call(pageObj, 'onPullDownRefresh')
    reportRealtimeAction.triggerAnalytics('pullDownRefresh', pageObj)
  }
}

/**
 * 分享回调钩子，调用onShareAppMessage
 * @param {any} params
 * @param {any} pWebviewId
 * @returns {any}
 */
var invokeShareAppMessage = function (params, pWebviewId) {
  // invoke event onShareAppMessage
  var shareParams = params
  var pageItem = pageStackObjs[pWebviewId]
  var pageObj = pageItem.page
  var eventName = 'onShareAppMessage'

  if (pageObj.hasOwnProperty(eventName)) {
    utils.info('Invoke event onShareAppMessage in page: ' + pageItem.route)
    var shareObj = utils.safeInvoke.call(pageObj, eventName) || {}
    shareParams.title = shareObj.title || params.title
    shareParams.desc = shareObj.desc || params.desc
    shareParams.path = shareObj.path
      ? utils.addHtmlSuffixToUrl(shareObj.path)
      : params.path
    shareParams.path.length > 0 &&
      shareParams.path[0] === '/' &&
      (shareParams.path = shareParams.path.substr(1))
    shareParams.success = shareObj.success
    shareParams.cancel = shareObj.cancel
    shareParams.fail = shareObj.fail
    shareParams.complete = shareObj.complete
  }

  return shareParams
}

// 切换route回调，包括各种操作
wx.onAppRoute(
  utils.surroundByTryCatch(function (params) {
    var path = params.path
    var webviewId = params.webviewId
    var query = params.query || {}
    var openType = params.openType
    skipPage(path, webviewId, query, openType)
  }),
  'onAppRoute'
)

// onWebviewEvent回调，主要是page的dom ready
wx.onWebviewEvent(
  utils.surroundByTryCatch(function (params) {
    var webviewId = params.webviewId
    var eventName = params.eventName
    var data = params.data
    return doWebviewEvent(webviewId, eventName, data)
  }, 'onWebviewEvent')
)

// 下拉刷新回调
ServiceJSBridge.on(
  'onPullDownRefresh',
  utils.surroundByTryCatch(function (e, pWebViewId) {
    pullDownRefresh(pWebViewId)
  }, 'onPullDownRefresh')
)

var shareAppMessage = function (params, webviewId) {
  var shareInfo = invokeShareAppMessage(params, webviewId)
  ServiceJSBridge.invoke('shareAppMessage', shareInfo, function (res) {
    / ^shareAppMessage: ok /.test(res.errMsg) &&
    typeof shareInfo.success === 'function'
      ? shareInfo.success(res)
      : /^shareAppMessage:cancel/.test(res.errMsg) &&
        typeof shareInfo.cancel === 'function'
        ? shareInfo.cancel(res)
        : /^shareAppMessage:fail/.test(res.errMsg) &&
          typeof shareInfo.fail === 'function' &&
          shareInfo.fail(res), // bug?? 原代码：shareInfo.fail && shareInfo.cancel(res)
    typeof shareInfo.complete === 'function' && shareInfo.complete(res)
  })
}

// 分享回调
ServiceJSBridge.on(
  'onShareAppMessage',
  utils.surroundByTryCatch(shareAppMessage, 'onShareAppMessage')
)

/**
 * 重置 app，清空页面。
 **/
reset = function () {
  currentPage = undefined
  pageStackObjs = {}
  pageRegObjs = {}
  pageStack = []
  pageIndex = 0
}

setWxConfig = function (e) {
  __wxConfig__ = e
}
setWxRoute = function (e) {
  __wxRoute = e
}
setWxRouteBegin = function (e) {
  __wxRouteBegin = e
}
getWebviewIdToPage = function () {
  return pageStackObjs
}
getRouteToPage = function () {
  return pageRegObjs
}

export default {
  getRouteToPage,
  getWebviewIdToPage,
  setWxRouteBegin,
  setWxRoute,
  setWxConfig,
  reset,
  pageHolder,
  getCurrentPages,
  getCurrentPage
}

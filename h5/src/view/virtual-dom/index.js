/**
 * @module
 */

import WxVirtualNode from './WxVirtualNode'
import Utils from './Utils'
import WxVirtualText from './WxVirtualText'
import AppData from './AppData'
import ErrorCatcher from './ErrorCatcher'
import TouchEvents from './TouchEvents'
import Init from './Init'
import exparser from '../exparser'
import viewApi from '../api'
import reporter from '@/common/reporter'

Init.init()

/**
 * @global
 * @type {Function}
 * @see AppData.mergeData
 */
window.__mergeData__ = AppData.mergeData
/**
 * 虚拟 dom 生成的 domtree
 * @global
 * @type {DOMElement}
 */
window.__DOMTree__ = void 0 // 虚拟dom生成的domtree
// window.firstRender = 0;
let domReady = '__DOMReady'
// 虚拟 dom 树根节点
let rootNode = void 0

const STATE_FLAGS = {
  funcReady: !1,
  dataReady: !1,
  // 页面是否已完成首次渲染
  firstRender: !1
}
const dataChangeEventQueue = []
let webViewInfo = {
  webviewStartTime: Date.now(),
  funcReady: 0
}

function speedReport (key, startTime, endTime, data) {
  reporter.speedReport({
    key: key,
    timeMark: {
      startTime: startTime,
      endTime: endTime
    },
    force: key !== 'reRenderTime',
    data: data
  })
}

const createWXVirtualNode = function (
  tagName,
  props,
  newProps,
  wxkey,
  wxVkey,
  children
) {
  return new WxVirtualNode(tagName, props, newProps, wxkey, wxVkey, children)
}

const createWxVirtualText = function (txt) {
  return new WxVirtualText(txt)
}

/**
 * 生成虚拟节点树。
 * @param {Object} opt 配置对象
 * @param {Object[]} children 子元素配置对象数组
 * @return {WxVirtualNode}
 **/
const createWXVirtualNodeRec = function (opt) {
  // Recursively
  if (Utils.isString(opt) || (Number(opt) === opt && Number(opt) % 1 === 0)) {
    return createWxVirtualText(String(opt))
  }

  let children = []
  opt.children.forEach(function (child) {
    children.push(createWXVirtualNodeRec(child))
  })

  return createWXVirtualNode(
    opt.tag,
    opt.attr,
    opt.n,
    opt.wxKey,
    opt.wxVkey,
    children
  )
}

const createBodyNode = function (e) {
  var t = window.__generateFunc__(AppData.getAppData(), e)
  t.tag = 'body'
  return createWXVirtualNodeRec(t)
}

// 首次渲染
const firstTimeRender = function (event) {
  if (event.ext) {
    /**
     * Webview ID
     * @global
     * @type {String}
     **/
    typeof event.ext.webviewId !== 'undefined' &&
      (window.__webviewId__ = event.ext.webviewId)
    event.ext.enablePullUpRefresh && (window.__enablePullUpRefresh__ = !0)
  }

  rootNode = createBodyNode(event.data)
  window.__DOMTree__ = rootNode.render()
  exparser.Element.replaceDocumentElement(window.__DOMTree__, document.body)
  setTimeout(function () {
    viewApi.publishPageEvent(domReady, {})
    viewApi.initReady()
    TouchEvents.enablePullUpRefresh()
  }, 0)
}

const reRender = function (event) {
  var t = createBodyNode(event.data)
  var n = rootNode.diff(t)
  n.apply(window.__DOMTree__)
  rootNode = t
}

// 监听数据变化事件，并决定首次渲染还是重渲染。
var renderOnDataChange = function (event) {
  if (STATE_FLAGS.firstRender) {
    setTimeout(function () {
      let timeStamp = Date.now()
      reRender(event)
      speedReport('reRenderTime', timeStamp, Date.now())
      document.dispatchEvent(new CustomEvent('pageReRender', {}))
    }, 0)
  } else {
    let timeStamp = Date.now()
    speedReport('firstGetData', webViewInfo.funcReady, Date.now())
    firstTimeRender(event)
    speedReport('firstRenderTime', timeStamp, Date.now())

    if (!(event.options && event.options.firstRender)) {
      console.error('firstRender not the data from Page.data')
      reporter.errorReport({
        key: 'webviewScriptError',
        error: new Error('firstRender not the data from Page.data'),
        extend: 'firstRender not the data from Page.data'
      })
    }

    STATE_FLAGS.firstRender = !0
    document.dispatchEvent(new CustomEvent('pageReRender', {}))
  }
}

window.onerror = function (e, t, n, i, o) {
  console.log(arguments)
  console.log(o.stack)
  reporter.errorReport({
    key: 'webviewScriptError',
    error: o
  })

  if (viewApi.getPlatform() === 'ios') {
    globalThis.webkit.messageHandlers.publishHandler.postMessage(
      'wawebview sdk error:' + o.msg
    )
  }
}

viewApi.onAppDataChange(
  ErrorCatcher.catchError(function (event) {
    STATE_FLAGS.dataReady = !0
    STATE_FLAGS.funcReady
      ? renderOnDataChange(event)
      : dataChangeEventQueue.push(event)
  })
)

document.addEventListener(
  'generateFuncReady',
  ErrorCatcher.catchError(function (event) {
    webViewInfo.funcReady = Date.now()
    speedReport(
      'funcReady',
      webViewInfo.webviewStartTime,
      webViewInfo.funcReady
    )

    // 根据模板 view.html 中的配置，generateFuncReady 事件触发时，
    // __pageFrameStartTime__、__pageFrameEndTime__ 一定已存在。
    window.__pageFrameStartTime__ &&
      window.__pageFrameEndTime__ &&
      speedReport(
        'pageframe',
        window.__pageFrameStartTime__,
        window.__pageFrameEndTime__
      )
    window.__WAWebviewStartTime__ &&
      window.__WAWebviewEndTime__ &&
      speedReport(
        'WAWebview',
        window.__WAWebviewStartTime__,
        window.__WAWebviewEndTime__
      )
    window.__generateFunc__ = event.detail.generateFunc
    STATE_FLAGS.funcReady = !0

    if (STATE_FLAGS.dataReady) {
      for (let eventName in dataChangeEventQueue) {
        let event = dataChangeEventQueue[eventName]
        renderOnDataChange(event)
      }
    }
  })
)

export default {
  /**
   * 清空页面，重置 dom 树和虚拟 dom 树。
   **/
  reset: function () {
    rootNode = void 0
    window.__DOMTree__ = void 0
    // nonsenselet = {}
  }
}

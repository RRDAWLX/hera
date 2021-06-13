import './Utils'
import viewApi from '../api'

let bottomCheckDistance = 20
let windowScrollY = 0
let stopedTouch = !1
let refreshFinish = !0

/**
 * 获取视口高度
 * @return {Number} 视口高度
 **/
const getWindowHeight = function () {
  return document.compatMode === 'CSS1Compat'
    ? document.documentElement.clientHeight
    : document.body.clientHeight
}

/**
 * 获取页面高度
 * @return {Number} 页面高度
 **/
const getScrollHeight = function () {
  let bodyScrollHeight = 0
  let documentElementScrollHeight = 0
  document.body && (bodyScrollHeight = document.body.scrollHeight)
  document.documentElement &&
    (documentElementScrollHeight = document.documentElement.scrollHeight)

  return Math.max(bodyScrollHeight, documentElementScrollHeight)
}

/**
 * 检测页面是否滚动到了底部
 * @return {Boolean}
 **/
const checkScrollBottom = function () {
  let isGoingBottom = windowScrollY - window.scrollY <= 0
  windowScrollY = window.scrollY
  let ref = window.scrollY + getWindowHeight() + bottomCheckDistance
  return !!(ref >= getScrollHeight() && isGoingBottom)
}

/**
 * 触发上拉刷新，相关事件为 onReachBottom。
 **/
const triggerPullUpRefresh = function () {
  if (refreshFinish && !stopedTouch) {
    viewApi.publishPageEvent('onReachBottom', {})
    refreshFinish = !1
    setTimeout(function () {
      refreshFinish = !0
    }, 350)
  }
}

/**
 * 根据 window.__enablePullUpRefresh__ 决定是否打开上拉刷新功能。
 **/
const enablePullUpRefresh = function () {
  if (window.__enablePullUpRefresh__) {
    !(function () {
      window.onscroll = function () {
        checkScrollBottom() && triggerPullUpRefresh()
      }

      let startPoint = 0
      window.__DOMTree__.addListener('touchstart', function (event) {
        startPoint = event.touches[0].pageY
        stopedTouch = !1
      })
      window.__DOMTree__.addListener('touchmove', function (event) {
        if (!stopedTouch) {
          let currentPoint = event.touches[0].pageY

          if (currentPoint < startPoint && checkScrollBottom()) {
            triggerPullUpRefresh()
            stopedTouch = !0
          }
        }
      })
      window.__DOMTree__.addListener('touchend', function () {
        stopedTouch = !1
      })
    })()
  }
}

export default {
  getScrollHeight,
  getWindowHeight,
  checkScrollBottom,
  triggerPullUpRefresh,
  enablePullUpRefresh
}

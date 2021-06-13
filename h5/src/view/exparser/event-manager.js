/**
 * Element 事件管理模块：给元素添加、触发、删除事件。
 * @module
 **/

import Event from './event'

const now = Date.now()

/**
 * 触发元素上的事件。
 * @param {Element} target 目标元素
 * @param {String} eventName 事件名
 * @param {Object} detail 事件描述信息，回调函数入参对象中的 detail 字段值
 * @param {Object} [options={}] 事件配置参数
 * @param {DOMEvent} [options.originalEvent] DOM 原生 event 对象
 * @param {Boolean} [options.bubbles=false] 事件是否冒泡
 * @param {Boolean} [options.composed=false] {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Event/Event 事件是否会在影子DOM根节点之外触发侦听器}
 * @param {Object} [options.extraFields] 事件额外描述信息
 */
export function triggerEvent (target, eventName, detail, options = {}) {
  let timeStamp = Date.now() - now
  let originalEvent = options.originalEvent
  let bubbles = !!options.bubbles
  let composed = !!options.composed
  let extraFields = options.extraFields || {}
  let nTarget = getTargetElement(target)

  const preventDefault = function () {
    originalEvent && originalEvent.preventDefault()
  }

  let ifStopPropagation = false
  const stopPropagation = function () {
    ifStopPropagation = true
  }

  const eventOpt = {
    target: nTarget,
    currentTarget: nTarget,
    type: eventName,
    timeStamp,
    detail,
    preventDefault,
    stopPropagation,
    ...extraFields
  }

  let exeEvent = function (event, targetEle) {
    eventOpt.currentTarget = targetEle
    const res = event.call(targetEle, [eventOpt])

    if (res === false) {
      preventDefault()
      stopPropagation()
    }
  }

  let targetParent = nTarget.parentNode
  let targetEle = nTarget

  const goAhead = function () {
    // 冒泡执行事件
    if (targetEle) {
      if (targetParent === targetEle) {
        targetParent = targetEle.parentNode
      }

      // 如果当前元素上绑定了响应的事件，则执行注册的回调。
      if (targetEle.__wxEvents && targetEle.__wxEvents[eventName]) {
        exeEvent(targetEle.__wxEvents[eventName], targetEle)
      }

      // 事件可冒泡且未停止冒泡的情况下返回 true
      return bubbles && !ifStopPropagation
    }

    return false
  }

  while (goAhead()) {
    // 更新 targetEle
    if (targetEle.__host) {
      // targetEle 是一个 shadowRoot
      // 如果事件不能在影子DOM根节点之外触，则结束事件冒泡。
      if (!composed) break

      if (!(targetParent && targetParent.__domElement)) {
        targetParent = targetEle.__host
        eventOpt.target = targetParent
      }

      targetEle = targetEle.__host
    } else {
      let isRealDom = true

      if (targetEle.__domElement || targetEle.__virtual) {
        isRealDom = false
      }

      targetEle =
        isRealDom || !composed ? targetEle.parentNode : targetEle.__slotParent
    }
  }
}

/**
 * 监听元素上的事件
 * @param {Element} ele 元素
 * @param {String} eventName 事件名
 * @param {Function} handler 事件监听器
 * @return {Number} 事件监听器标识 ID
 */
export function addListenerToElement (ele, eventName, handler) {
  let targetEle = getTargetElement(ele)
  targetEle.__wxEvents = targetEle.__wxEvents || Object.create(null)
  targetEle.__wxEvents[eventName] =
    targetEle.__wxEvents[eventName] || new Event('Event Listener')
  return targetEle.__wxEvents[eventName].add(handler)
}

/**
 * 删除元素上的事件监听器
 * @param {Element} ele 元素
 * @param {String} eventName 事件名
 * @param {Function} handler 事件监听器
 */
export function removeListenerFromElement (ele, eventName, handler) {
  let targetEle = getTargetElement(ele)

  if (targetEle.__wxEvents && targetEle.__wxEvents[eventName]) {
    targetEle.__wxEvents[eventName].remove(handler)
  }
}

/**
 * 解析元素对应的 Element。
 * @param {Element|DOMElement} ele
 * @return {Element}
 * @private
 **/
function getTargetElement (ele) {
  let target = ele.__wxElement || ele

  if (ele === target.shadowRoot) {
    // _renderingMode === 'native' ???
    target = ele
  }

  return target
}

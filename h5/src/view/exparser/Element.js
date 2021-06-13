/**
 * @module
 */

import * as eventManager from './event-manager'
import Observer from './observer'

/**
 * 将元素及其子孙元素设置为已附着（已插入页面 DOM 树）状态，并调用 attached 生命周期方法。
 * @param {Element} ele
 * @private
 */
function attachElement (ele) {
  if (!ele.parentNode || ele.parentNode.__attached) {
    // 深度优先地当将前元素和其所有子孙元素设置为已附着状态
    let setAttached = function (ele) {
      ele.__attached = true

      if (ele.shadowRoot instanceof Element) {
        setAttached(ele.shadowRoot)
      }

      if (Array.isArray(ele.childNodes)) {
        for (let child of ele.childNodes) {
          setAttached(child)
        }
      }
    }

    setAttached(ele)

    // 深度优先地调用当前元素和其所有子孙元素的 attached 生命周期方法
    let callAttached = function (ele) {
      if (ele.__lifeTimeFuncs) {
        component._callLifeTimeFuncs(ele, 'attached')
      }

      if (ele.shadowRoot instanceof Element) {
        callAttached(ele.shadowRoot)
      }

      if (Array.isArray(ele.childNodes)) {
        for (let child of ele.childNodes) {
          callAttached(child)
        }
      }
    }

    callAttached(ele)
  }
}

/**
 * 将元素及其子孙元素设置为未附着（未插入页面 DOM 树）状态，并调用 detached 生命周期方法。
 * @param {Element} ele
 * @private
 */
function detachElement (ele) {
  if (ele.__attached) {
    let setDetached = function (ele) {
      ele.__attached = false

      if (ele.shadowRoot instanceof Element) {
        setDetached(ele.shadowRoot)
      }

      if (Array.isArray(ele.childNodes)) {
        for (let child of ele.childNodes) {
          setDetached(child)
        }
      }
    }

    setDetached(ele)

    let callDetached = function (ele) {
      if (ele.__lifeTimeFuncs) {
        component._callLifeTimeFuncs(ele, 'detached')
      }

      if (ele.shadowRoot instanceof Element) {
        callDetached(ele.shadowRoot)
      }

      if (Array.isArray(ele.childNodes)) {
        for (let child of ele.childNodes) {
          callDetached(child)
        }
      }
    }

    callDetached(ele)
  }
}

/**
 * 调用 ele 上与子节点 childEle 相关的添加/删除 observer。
 * @param {Element} ele
 * @param {String} type add/remove
 * @param {Element} childEle
 * @private
 **/
function callChildObserver (ele, type, childEle) {
  if (
    (ele.__childObservers && !ele.__childObservers.empty) ||
    ele.__subtreeObserversCount
  ) {
    let opts = {
      type: 'childList',
      target: ele
    }

    if (type === 'add') {
      opts.addedNodes = [childEle]
    } else {
      opts.removedNodes = [childEle]
    }

    Observer.callObservers(ele, '__childObservers', opts)
  }
}

/**
 * componentObj 的 DOM 节点中添加 newNode 的 DOM 节点，删除 oldNode 的 DOM 节点。
 * @param {(Element|Unknown)} componentObj
 * @param {Element} newNode
 * @param {Element} oldNode
 * @param {Boolean} willRemoveOldNode 是否删除老节点
 * @private
 **/
function attachShadowRoot (componentObj, newNode, oldNode, willRemoveOldNode) {
  // 增、删、改节点
  let copyOfOriginalElement = componentObj

  // 找 componentObj 的 dom 节点
  if (copyOfOriginalElement instanceof Element) {
    while (copyOfOriginalElement.__virtual) {
      let slotParent = copyOfOriginalElement.__slotParent

      if (!slotParent) {
        return
      }

      if (newNode && !oldNode) {
        // 为插入新节点做铺垫
        let oldNodeIdx = slotParent.__slotChildren.indexOf(
          copyOfOriginalElement
        )
        oldNode = slotParent.__slotChildren[oldNodeIdx + 1]
      }

      copyOfOriginalElement = slotParent
    }

    if (copyOfOriginalElement instanceof Element) {
      copyOfOriginalElement = copyOfOriginalElement.__domElement
    }
  }

  let newDomEle = null

  // 找 newNode 的 dom 节点
  if (newNode) {
    if (newNode.__virtual) {
      newDomEle = document.createDocumentFragment()

      let appendDomElement = function (ele) {
        for (let child of ele.__slotChildren) {
          if (child.__virtual) {
            appendDomElement(child)
          } else {
            newDomEle.appendChild(child.__domElement)
          }
        }
      }

      appendDomElement(newNode)
    } else {
      newDomEle = newNode.__domElement
    }
  }

  let oldDomEle = null

  // 找 oldNode 的 dom 节点
  if (oldNode) {
    if (oldNode.__virtual) {
      let oldParentNode = componentObj
      let oldNodeIdx = 0

      if (willRemoveOldNode) {
        let removeDomElement = function (ele) {
          for (let child of ele.__slotChildren) {
            if (child.__virtual) {
              removeDomElement(child)
            } else {
              copyOfOriginalElement.removeChild(child.__domElement)
            }
          }
        }

        removeDomElement(oldNode)
        willRemoveOldNode = false
        oldNodeIdx = oldParentNode.__slotChildren.indexOf(oldNode) + 1
      } else {
        oldParentNode = oldNode.__slotParent
        oldNodeIdx = oldParentNode.__slotChildren.indexOf(oldNode)
      }

      if (newNode) {
        // 在 ele 的子节点列表中的 idx 位置开始查找第一个非虚拟节点
        let findNonVirtualNode = function (ele, idx) {
          let children = ele.__slotChildren
          let len = children.length

          for (; idx < len; idx++) {
            let child = children[idx]

            if (!child.__virtual) {
              return child
            }

            child = findNonVirtualNode(child, 0)

            if (child) {
              return child
            }
          }
        }

        let curOldParentNode = oldParentNode
        oldNode = findNonVirtualNode(curOldParentNode, oldNodeIdx)

        while (!oldNode && curOldParentNode.__virtual) {
          oldNodeIdx =
            curOldParentNode.__slotParent.__slotChildren.indexOf(
              curOldParentNode
            ) + 1
          curOldParentNode = curOldParentNode.__slotParent
          oldNode = findNonVirtualNode(curOldParentNode, oldNodeIdx)
        }

        if (oldNode) {
          oldDomEle = oldNode.__domElement
        }
      }
    } else {
      oldDomEle = oldNode.__domElement
    }
  }

  if (willRemoveOldNode) {
    newDomEle
      ? copyOfOriginalElement.replaceChild(newDomEle, oldDomEle)
      : copyOfOriginalElement.removeChild(oldDomEle)
  } else {
    newDomEle &&
      (oldDomEle
        ? copyOfOriginalElement.insertBefore(newDomEle, oldDomEle)
        : copyOfOriginalElement.appendChild(newDomEle))
  }
}

/**
 * 将 newNode 插入到 ele 的子节点 oldNode 前，并视情况删除 oldNode。
 * @param {Element} ele 父节点
 * @param {Element} newNode 待插入节点
 * @param {Element} oldNode 子节点
 * @param {Boolean} willRemoveOldNode 是否删除老节点
 * @return {Boolean} 标识操作是否成功
 * @private
 **/
function updateSubtree (ele, newNode, oldNode, willRemoveOldNode) {
  let oldNodeIndex = -1

  if (oldNode) {
    oldNodeIndex = ele.childNodes.indexOf(oldNode)

    if (oldNodeIndex < 0) {
      return false
    }
  }

  if (willRemoveOldNode) {
    if (newNode === oldNode) {
      willRemoveOldNode = false
    } else {
      if (ele.__subtreeObserversCount) {
        Observer.updateSubtreeCaches(oldNode, -ele.__subtreeObserversCount)
      }

      oldNode.parentNode = null
      oldNode.__slotParent = null
    }
  }

  let originalParentNode = ele.__slots ? ele.__slots[''] : ele
  let parentNode = null

  if (newNode) {
    parentNode = newNode.parentNode
    newNode.parentNode = ele
    newNode.__slotParent = originalParentNode
    let subtreeObserversCount = ele.__subtreeObserversCount

    if (parentNode) {
      let originalIndexOfNewNode = parentNode.childNodes.indexOf(newNode)
      parentNode.childNodes.splice(originalIndexOfNewNode, 1)

      if (parentNode === ele && originalIndexOfNewNode < oldNodeIndex) {
        oldNodeIndex--
      }

      subtreeObserversCount -= parentNode.__subtreeObserversCount
    }

    if (subtreeObserversCount) {
      Observer.updateSubtreeCaches(newNode, subtreeObserversCount)
    }
  }

  attachShadowRoot(originalParentNode, newNode, oldNode, willRemoveOldNode)

  if (oldNodeIndex === -1) {
    oldNodeIndex = ele.childNodes.length
  }

  if (newNode) {
    ele.childNodes.splice(oldNodeIndex, willRemoveOldNode ? 1 : 0, newNode)
  } else {
    ele.childNodes.splice(oldNodeIndex, willRemoveOldNode ? 1 : 0)
  }

  if (willRemoveOldNode) {
    detachElement(oldNode)
    callChildObserver(ele, 'remove', oldNode)
  }

  if (newNode) {
    if (parentNode) {
      detachElement(newNode)
      callChildObserver(parentNode, 'remove', newNode)
    }

    attachElement(newNode)
    callChildObserver(ele, 'add', newNode)
  }

  return true
}

/**
 * 添加、删除、移动节点
 * @param {Element} ele 根节点
 * @param {Element} newNode
 * @param {Element} oldNode
 * @param {Boolean} willRemoveOldNode 是否删除老节点
 * @return {(Element|Null)} 如果操作失败，则返回null。如果操作成功，则分以下 2 种情况：
 * 1、willRemoveOldNode 为 true，返回 oldNode;
 * 2、willRemoveOldNode 为 false，返回 newNode。
 * @see updateSubtree
 * @private
 **/
function handleChild (ele, newNode, oldNode, willRemoveOldNode) {
  let returnNode = willRemoveOldNode ? oldNode : newNode
  let done = updateSubtree(ele, newNode, oldNode, willRemoveOldNode)
  return done ? returnNode : null
}

// component 模块的引用
let component = null

/**
 * 元素，DOM 元素的映射
 **/
class Element {
  /**
   * 注册 component 模块，避免循环引用。
   * @param {Object} c component 模块
   **/
  static setCompnentSystem (c) {
    component = c
  }

  /**
   * 初始化元素
   * @param {Element} ele
   **/
  static initialize (ele) {
    Element.call(ele)
  }

  /**
   * 在 ele 的 DOM 节点的子节点列表尾部添加 node 的 DOM 节点。
   * @param {Element} ele
   * @param {Element} node
   **/
  static _attachShadowRoot (ele, node) {
    attachShadowRoot(ele, node, null, false)
  }

  /**
   * 在父节点的子节点列表末尾添加节点。
   * @param {Element} ele 父节点
   * @param {Element} child 待添加节点
   * @return {(Element|Null)} 如果添加成功，则返回被添加的节点；否则返回 null。
   **/
  static appendChild (ele, child) {
    return handleChild(ele, child, null, false)
  }

  /**
   * 在父节点的子节点列表中插入节点。
   * @param {Element} ele 父节点
   * @param {Element} newNode 待插入节点
   * @param {Element} refNode 将要插在这个节点之前
   * @return {(Element|Null)} 如果插入成功，则返回被插入的节点；否则返回 null。
   **/
  static insertBefore (ele, newNode, refNode) {
    return handleChild(ele, newNode, refNode, false)
  }

  /**
   * 删除父节点的子节点。
   * @param {Element} ele 父节点
   * @param {Element} removedChild 待删除节点
   * @return {(Element|Null)} 如果删除成功，则返回被删除的节点；否则返回 null。
   **/
  static removeChild (ele, removedChild) {
    return handleChild(ele, null, removedChild, true)
  }

  /**
   * 替换父节点的子节点。
   * @param {Element} ele 父节点
   * @param {Element} newNode 用来替换子节点的新节点
   * @param {Element} oldNode 待替换节点
   * @return {(Element|Null)} 如果替换成功，则返回被替换的节点；否则返回 null。
   **/
  static replaceChild (ele, newNode, oldNode) {
    return handleChild(ele, newNode, oldNode, true)
  }

  /**
   * 替换根元素，用于将 Element 对应的 DOM 插入到 DOM 树中。
   * @param {Element} ele 新节点
   * @param {Element} oldChild 被替换节点
   **/
  static replaceDocumentElement (ele, oldChild) {
    if (!ele.__attached) {
      oldChild.parentNode.replaceChild(ele.__domElement, oldChild)
      attachElement(ele)
    }
  }

  /**
   * 是否已插入到 DOM 树中？？？
   * @type {Boolean}
   **/
  __attached = false

  /**
   * 父节点
   * @type {?Element}
   **/
  parentNode = null

  /**
   * 子节点
   * @type {Element[]}
   **/
  childNodes = []

  /**
   * @type {?(Element|DOMElement)}
   **/
  __slotParent = null

  /**
   * @type {(Element[]|DOMElement[])}
   **/
  __slotChildren = this.childNodes

  /**
   * @type {Number}
   **/
  __subtreeObserversCount = 0

  /**
   * 在子节点列表尾部添加节点
   * @param {Element} child 被添加节点
   * @return {(Element|Null)} 如果添加成功，则返回被添加节点；否则返回 null。
   **/
  appendChild (child) {
    return handleChild(this, child, null, false)
  }

  /**
   * 在子节点列表中插入节点。
   * @param {Element} newChild 待插入节点
   * @param {Element} refChild 将要插在这个节点之前
   * @return {(Element|Null)} 如果插入成功，则返回被插入的节点；否则返回 null。
   **/
  insertBefore (newChild, refChild) {
    return handleChild(this, newChild, refChild, false)
  }

  /**
   * 删除子节点。
   * @param {Element} child 待删除节点
   * @return {(Element|Null)} 如果删除成功，则返回被删除的节点；否则返回 null。
   **/
  removeChild (child) {
    return handleChild(this, null, child, true)
  }

  /**
   * 替换子节点。
   * @param {Element} newChild 用来替换子节点的新节点
   * @param {Element} oldChild 待替换节点
   * @return {(Element|Null)} 如果替换成功，则返回被替换的节点；否则返回 null。
   **/
  replaceChild (newChild, oldChild) {
    return handleChild(this, newChild, oldChild, true)
  }

  /**
   * 触发事件
   * @param {String} eventName 事件名
   * @param {Object} detail 事件描述信息，回调函数入参。
   * @param {Object} options 事件是否要冒泡等配置项
   * @see module:view/exparser/event-manager.triggerEvent
   **/
  triggerEvent (eventName, detail, options) {
    eventManager.triggerEvent(this, eventName, detail, options)
  }

  /**
   * 添加事件监听器
   * @param {String} eventName 事件名
   * @param {Function} handler 事件监听器
   **/
  addListener (eventName, handler) {
    eventManager.addListenerToElement(this, eventName, handler)
  }

  /**
   * 删除事件监听器
   * @param {String} eventName 事件名
   * @param {Function} handler 事件监听器
   **/
  removeListener (eventName, handler) {
    eventManager.removeListenerFromElement(this, eventName, handler)
  }

  /**
   * 是否继承了某个 behavior
   * @param {String} behaviorName behavior 名
   * @return {Boolean}
   **/
  hasBehavior (behaviorName) {
    return !!this.__behavior && this.__behavior.hasBehavior(behaviorName)
  }
}

export default Element

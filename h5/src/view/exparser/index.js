/**
 * exparser 各类输出接口
 * @module
 */

import Event from './event'
import * as eventManager from './event-manager'
import Behavior from './behavior'
import Element from './element'
import component from './component'
import TextNode from './text-node'
import VirtualNode from './virtual-node'
import Observer from './observer'
import globalOptions from './global-options'

// TODO: 接口文档待完善
let exportApi = {
  globalOptions,
  Behavior,
  Element,
  TextNode,
  VirtualNode,
  Component: component,
  Observer,

  // Register
  registerBehavior: Behavior.create,
  registerElement: component.register,

  // Create node
  createElement: component.create,
  createTextNode: TextNode.create,
  createVirtualNode: VirtualNode.create,

  // Dom manipulation
  appendChild: Element.appendChild,
  insertBefore: Element.insertBefore,
  removeChild: Element.removeChild,
  replaceChild: Element.replaceChild,

  // Event
  addListenerToElement: eventManager.addListenerToElement,
  removeListenerFromElement: eventManager.removeListenerFromElement,
  triggerEvent: eventManager.triggerEvent,
  addGlobalErrorListener: Event.addGlobalErrorListener,
  removeGlobalErrorListener: Event.removeGlobalErrorListener
}

/**
 * @global
 */
window.exparser = exportApi

export default {
  ...exportApi
}

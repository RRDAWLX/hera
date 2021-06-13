/**
 * @module
 **/

import Event from './event'
import * as eventManager from './event-manager'
import Template from './template'
import Behavior from './behavior'
import Element from './element'
import Observer from './observer'

function camelToDashed (txt) {
  return txt.replace(/[A-Z]/g, function (ch) {
    return '-' + ch.toLowerCase()
  })
}

const addListenerToElement = eventManager.addListenerToElement
const component = {}

/**
 * 已注册的组件定义。
 * @type {Object}
 **/
component.list = Object.create(null)

// 不直接引用 component，为了避免循环引用。
Template.setCompnentSystem(component)
Element.setCompnentSystem(component)

// attribute(this, prop, propName, value)
/**
 * 设置 ele 对应的 dom 元素的属性。
 * @param {Element} ele
 * @param {Object} opt 属性定义对象
 * @param {Function} opt.type 值类型，值为各种构造函数：Boolean、Array……
 * 如果是 Object，则不会设置属性值。
 * @param {String} propName
 * @param {*} value
 * @private
 **/
function setAttribute (ele, opt, propName, value) {
  propName = camelToDashed(propName)
  let dom = ele.__domElement

  if (opt.type === Boolean) {
    value ? dom.setAttribute(propName, '') : dom.removeAttribute(propName)
  } else if (opt.type === Array) {
    dom.setAttribute(propName, JSON.stringify(value))
  } else if (opt.type !== Object) {
    dom.setAttribute(propName, value)
  }
}

/**
 * 根据值类型生成标准化的值。
 * @param {*} value
 * @param {Function} type 值类型构造函数，String、Number、Boolean、Array、Object……
 * @return {*}
 **/
function getNormalizedValue (value, type) {
  switch (type) {
    case String:
      return value === null || value === undefined ? '' : String(value)

    case Number:
      return isFinite(value) ? Number(value) : false

    case Boolean:
      return !!value

    case Array:
      return Array.isArray(value) ? value : []

    case Object:
      return typeof value === 'object' ? value : null

    default:
      return undefined === value ? null : value
  }
}

/**
 * 根据类型返回属性默认值
 * @param {Function} type 类型构造函数，Boolean、Array……
 * @return {*} type 值为不同值时返回的默认值如下：
 * 1、BOOlean，默认值 false；
 * 2、String，默认值 '';
 * 3、Number，默认值 0;
 * 4、Array，默认值 [];
 * 5、其他，默认值 null。
 **/
function getDefaultPropValue (type) {
  switch (type) {
    case Boolean:
      return false

    case String:
      return ''

    case Number:
      return 0

    case Array:
      return []

    default:
      return null
  }
}

/**
 * 注册组件
 * @param {Object} nElement 选项数据
 * @param {String} [nElement.is=''] 组件名
 * @param {Object} [nElement.options={}]
 **/
component.register = function (nElement) {
  let opts = nElement.options || {}
  // 组件原型属性定义
  let propDefination = {
    is: {
      value: nElement.is || ''
    }
  }
  let componentBehavior = new Behavior(nElement)
  let behaviorProperties = Object.create(null)

  // 添加属性定义
  Object.keys(componentBehavior.properties).forEach(function (propKey) {
    let behaviorProperty = componentBehavior.properties[propKey]

    if (
      behaviorProperty === String ||
      behaviorProperty === Number ||
      behaviorProperty === Boolean ||
      behaviorProperty === Object ||
      behaviorProperty === Array
    ) {
      behaviorProperty = {
        type: behaviorProperty
      }
    }

    if (undefined === behaviorProperty.value) {
      behaviorProperty.value = getDefaultPropValue(behaviorProperty.type)
    }

    behaviorProperties[propKey] = {
      type: behaviorProperty.type,
      value: behaviorProperty.value,
      // Function，赋值时值强制转换函数，返回转换后的值，返回 undefined 表示不做转换。
      coerce: componentBehavior.methods[behaviorProperty.coerce],
      // Function
      observer: componentBehavior.methods[behaviorProperty.observer],
      // Boolan，是否为 dom 属性
      public: !!behaviorProperty.public
    }

    propDefination[propKey] = {
      enumerable: true,

      get: function () {
        let value = this.__propData[propKey]
        return undefined === value ? behaviorProperties[propKey].value : value
      },

      set: function (value) {
        let behProp = behaviorProperties[propKey]
        value = getNormalizedValue(value, behProp.type)
        let oldValue = this.__propData[propKey]

        // 转换 value
        if (behProp.coerce) {
          let realVal = Event.safeCallback(
            'Property Filter',
            behProp.coerce,
            this,
            [value, oldValue]
          )

          if (realVal !== undefined) {
            value = realVal
          }
        }

        if (value !== oldValue) {
          // 更新属性
          this.__propData[propKey] = value
          // 更新 dom 属性
          behProp.public && setAttribute(this, behProp, propKey, value)
          // 更新模板？？？
          this.__templateInstance.updateValues(this, this.__propData, propKey)

          // 调用属性上的监听器
          if (behProp.observer) {
            Event.safeCallback('Property Observer', behProp.observer, this, [
              value,
              oldValue
            ])
          }

          // 调用组件上的监听器
          if (behProp.public) {
            if (
              (this.__propObservers && !this.__propObservers.empty) ||
              this.__subtreeObserversCount
            ) {
              Observer.callObservers(this, '__propObservers', {
                type: 'properties',
                target: this,
                propertyName: propKey
              })
            }
          }
        }
      }
    }
  }) // end forEach

  // 组件实例原型
  let proto = Object.create(Element.prototype, propDefination)
  proto.__behavior = componentBehavior

  for (let methodName in componentBehavior.methods) {
    proto[methodName] = componentBehavior.methods[methodName]
  }

  proto.__lifeTimeFuncs = componentBehavior.getAllLifeTimeFuncs()
  let publicProps = (proto.__propPublic = Object.create(null))
  let defaultValues = {}

  for (let propName in behaviorProperties) {
    defaultValues[propName] = behaviorProperties[propName].value
    publicProps[propName] = !!behaviorProperties[propName].public
  }

  // 定义组件模板
  let template = document.getElementById(componentBehavior.is)

  if (
    !componentBehavior.template &&
    template &&
    template.tagName === 'TEMPLATE'
  ) {
    // eslint-disable-next-line
  } else {
    template = document.createElement('template')
    template.innerHTML = componentBehavior.template || ''
  }

  template = new Template(
    template,
    defaultValues,
    componentBehavior.methods,
    opts
  )

  // 定义组件内部事件
  let innerEvents = Object.create(null)
  let allListeners = componentBehavior.getAllListeners()

  for (let listenerName in allListeners) {
    let callbacks = []

    for (let methodName of allListeners[listenerName]) {
      callbacks.push(componentBehavior.methods[methodName])
    }

    innerEvents[listenerName] = callbacks
  }

  component.list[componentBehavior.is] = {
    proto,
    template,
    defaultValuesJSON: JSON.stringify(defaultValues),
    innerEvents
  }
}

/**
 * 创建组件实例，实际上是 Element 实例。
 * @param {String} [tagName="virtual"]
 * @return {Element}
 **/
component.create = function (tagName) {
  // 生成组件 DOM 根节点
  tagName = tagName ? tagName.toLowerCase() : 'virtual'
  let domEle = document.createElement(tagName)
  // 初始化组件实例
  let componentDefine = component.list[tagName] || component.list['']
  let newComponent = Object.create(componentDefine.proto)
  Element.initialize(newComponent)
  // 关联组件实例、组件 DOM 根节点、模板实例
  // element prop
  newComponent.__domElement = domEle
  domEle.__wxElement = newComponent
  newComponent.__propData = JSON.parse(componentDefine.defaultValuesJSON)
  // element prop
  newComponent.__templateInstance = componentDefine.template.createInstance(
    newComponent
  ) // 参数多余？
  let tmplIns = newComponent.__templateInstance

  if (tmplIns.shadowRoot instanceof Element) {
    Element._attachShadowRoot(newComponent, tmplIns.shadowRoot)
    // element prop
    newComponent.shadowRoot = tmplIns.shadowRoot
    newComponent.__slotChildren = [tmplIns.shadowRoot]
    tmplIns.shadowRoot.__slotParent = newComponent
  } else {
    newComponent.__domElement.appendChild(tmplIns.shadowRoot)
    newComponent.shadowRoot = domEle
    newComponent.__slotChildren = domEle.childNodes
  }

  newComponent.shadowRoot.__host = newComponent
  // element prop
  newComponent.$ = tmplIns.idMap
  // element prop
  newComponent.$$ = domEle

  if (!tmplIns.slots['']) {
    tmplIns.slots[''] = domEle
  }

  newComponent.__slots = tmplIns.slots // 占位节点
  newComponent.__slots[''].__slotChildren = newComponent.childNodes

  let innerEvents = componentDefine.innerEvents

  // 绑定事件
  for (let innerEventName in innerEvents) {
    let innerEventNameSlice = innerEventName.split('.', 2)
    let eventName = innerEventNameSlice[innerEventNameSlice.length - 1]
    let nComponent = newComponent
    let isRootNodeEvent = true

    // 找到绑定事件的节点
    if (innerEventNameSlice.length === 2) {
      let id = innerEventNameSlice[0]

      if (id !== '') {
        isRootNodeEvent = false

        if (id !== 'this') {
          nComponent = newComponent.$[id]
        }
      }
    }

    if (nComponent) {
      for (let callback of innerEvents[innerEventName]) {
        addListenerToElement(
          isRootNodeEvent ? nComponent.shadowRoot : nComponent,
          eventName,
          callback.bind(newComponent)
        )
      }
    }
  }

  // 调用 created 生命周期方法
  component._callLifeTimeFuncs(newComponent, 'created')
  return newComponent
}

/**
 * 判断组件上是否有某个属性。
 * @param {Element} ele
 * @param {String} propName
 * @return {Boolean}
 **/
component.hasProperty = function (ele, propName) {
  return undefined !== ele.__propPublic[propName]
}

/**
 * 判断组件上是否有某个公共属性。
 * @param {Element} ele
 * @param {String} propName
 * @return {Boolean}
 **/
component.hasPublicProperty = function (ele, propName) {
  return ele.__propPublic[propName] === true
}

/**
 * 调用组件的某个生命周期方法。
 * @param {Element} ele
 * @param {String} funcName 生命周期方法名
 **/
component._callLifeTimeFuncs = function (ele, funcName) {
  let func = ele.__lifeTimeFuncs[funcName]
  func.call(ele, [])
}

// 注册最基础的组件
component.register({
  is: '',
  template: '<wx-content></wx-content>',
  properties: {}
})

export default component

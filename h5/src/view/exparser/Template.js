/**
 * @module
 */

import globalOptions from './global-options'
import BoundProps from './bound-props'
import TemplateExparser from './template-exparser'
import Element from './element'
import SlotNode from './slot-node'
import VirtualNode from './virtual-node'
import TextNode from './text-node'

const dollarSign = String.fromCharCode(36) // $

// 'a-bc-d' => aBcD
function dashToCamel (txt) {
  return txt.replace(/-([a-z])/g, function (match, p1) {
    return p1.toUpperCase()
  })
}

/**
 * 属性
 * @typedef Attribute
 * @type {Object}
 * @property {String} name 属性名
 * @property {*} value 属性值
 **/

/**
 * 基于 attributes 生成属性对象。
 * @param {Arribute[]} attributes
 * @return {Object}
 * @example
 * getAttributes([{ name: 'num', value: 1 }]) => { num: 1 }
 **/
function getAttributes (attributes) {
  let tempObj = Object.create(null)
  let idx = 0

  for (; idx < attributes.length; idx++) {
    tempObj[attributes[idx].name] = attributes[idx].value
  }

  return tempObj
}

function setObjAttr (obj, key, value) {
  obj[key] = value
}

/**
 * 把nodes追加到shadowRoot下???
 * @param {Element[]} nodes
 * @param {Element} shadowRoot
 * @param {Unknown} idMap
 * @param {Unknown} slots
 * @param {Unknown} binding
 **/
function domRendering (nodes, shadowRoot, idMap, slots, binding) {
  // 把nodes追加到shadowRoot下
  let newNode = null
  let attrIdx = 0
  let attr = null
  let rootIdx = 0

  for (; rootIdx < nodes.length; rootIdx++) {
    let node = nodes[rootIdx]

    if (node.name === undefined) {
      // 文本节点
      newNode = new TextNode(node.text)
      node.exp &&
        binding.add(node.exp, newNode.__domElement, 'textContent', setObjAttr)
      Element.appendChild(shadowRoot, newNode)
    } else {
      let attributes = node.attrs

      if (node.name === 'virtual') {
        newNode = VirtualNode.create(node.virtual)
      } else if (node.custom) {
        newNode = component.create(node.name)
        attrIdx = 0

        for (; attrIdx < attributes.length; attrIdx++) {
          attr = attributes[attrIdx]

          if (attr.updater) {
            attr.updater(newNode, attr.name, attr.value)
          } else {
            if (newNode.__behavior.properties[attr.name].type === Boolean) {
              newNode[attr.name] = !0
            } else {
              newNode[attr.name] = attr.value
            }
          }

          attr.exp && binding.add(attr.exp, newNode, attr.name, attr.updater)
        }
      } else {
        newNode = new SlotNode(document.importNode(node.prerendered, false)) // 以real dom创建Vnode
        attrIdx = 0

        for (; attrIdx < attributes.length; attrIdx++) {
          attr = attributes[attrIdx]
          binding.add(attr.exp, newNode.__domElement, attr.name, attr.updater)
        }
      }

      Element.appendChild(shadowRoot, newNode)
      node.id && (idMap[node.id] = newNode)
      node.slot !== undefined && (slots[node.slot] = newNode)
      domRendering(node.children, newNode, idMap, slots, binding)
    }
  }
}

/**
 * 把nodes追加到shadowRoot下???
 * @param {Element[]} nodes
 * @param {Element} shadowRoot
 * @param {Unknown} idMap
 * @param {Unknown} slots
 * @param {Unknown} binding
 **/
function nativeRendering (nodes, shadowRoot, idMap, slots, binding) {
  let tempNode = null
  let attrIdx = 0
  let attr = null
  let idx = 0

  for (; idx < nodes.length; idx++) {
    let nodeItem = nodes[idx]

    if (void 0 === nodeItem.name) {
      tempNode = document.createTextNode(nodeItem.text)
      nodeItem.exp &&
        binding.add(nodeItem.exp, tempNode, 'textContent', setObjAttr)
      shadowRoot.appendChild(tempNode)
    } else {
      let attributes = nodeItem.attrs
      // 浅复制
      tempNode = document.importNode(nodeItem.prerendered, false)
      attrIdx = 0

      for (; attrIdx < attributes.length; attrIdx++) {
        attr = attributes[attrIdx]
        binding.add(attr.exp, tempNode, attr.name, attr.updater)
      }

      shadowRoot.appendChild(tempNode)
      nodeItem.id && (idMap[nodeItem.id] = tempNode)
      undefined !== nodeItem.slot && (slots[nodeItem.slot] = tempNode)
      nativeRendering(nodeItem.children, tempNode, idMap, slots, binding)
    }
  }
}

/**
 * 切换 dom 元素的类
 * @param {Element} ele
 * @param {String} classname
 * @param {Boolean} force 如果为 true，则强制加上类；如果为 false，则强制删除类。
 **/
function toggleDomClassAttr (ele, classname, force) {
  ele.__domElement.classList.toggle(classname, !!force)
}

function setDomStyle (ele, attr, value) {
  ele.__domElement.style[attr] = value
}

function setAttr (ele, attr, value) {
  if (value === !0) {
    ele.setAttribute(attr, '')
  } else {
    if (value === false || undefined === value || value === null) {
      ele.removeAttribute(attr)
    } else {
      ele.setAttribute(attr, value)
    }
  }
}

function toggleClassAttr (ele, classname, force) {
  ele.classList.toggle(classname, !!force)
}

function setStyle (ele, attr, value) {
  ele.style[attr] = value
}

let slot = {
  name: 'virtual',
  virtual: 'slot',
  slot: '',
  attrs: [],
  children: []
}
let virtual = {
  name: 'virtual',
  slot: '',
  attrs: [],
  prerendered: document.createElement('virtual'),
  children: []
}

class Instance {
  /**
   * @type {Object}
   */
  idMap = Object.create(null)

  /**
   * @type {Object}
   */
  slots = Object.create(null)

  /**
   * @type {BoundProps}
   */
  _binding = new BoundProps()

  /**
   * @type {?(DocumentFragment|VirtualNode)}
   */
  shadowRoot = null

  /**
   *
   * @param {Element} ele
   * @param {Object} propData
   * @param {String} propKey
   **/
  updateValues (ele, propData, propKey) {
    propKey && this._binding.update(ele, propData, propKey)
  }
}

// component 模块的引用
let component = null

class Template {
  /**
   * 注册 component 模块，避免循环引用。
   * @param {Object} c component 模块
   **/
  static setCompnentSystem (c) {
    component = c
  }

  /**
   *
   * @type {Object[]}
   **/
  _tagTreeRoot = []

  /**
   * @type {String}
   **/
  _renderingMode

  /**
   * @param {Object} ele
   * @param {String} ele.tagName
   * @param {Object.<String, *>} ele.attributes
   * @param {Object[]} ele.content 子节点列表
   * @param {Element[]} ele.childNodes
   * @param {Object} data
   * @param {Object.<String, Function>} behaviorMethods
   * @param {Object} opts
   * @param {String} opts.renderingMode
   * @param {Boolean} opts.parseTextContent
   * @param {Boolean} opts.keepWhiteSpace
   **/
  constructor (ele, data, behaviorMethods, opts) {
    let renderingMode = (this._renderingMode =
      opts.renderingMode || globalOptions.renderingMode)
    let slotRef = renderingMode === 'native' ? virtual : slot
    // 确定配置项
    let eleAttributes = getAttributes(ele.attributes)
    let textParseOpt = {
      parseTextContent:
        undefined !== eleAttributes['parse-text-content'] ||
        opts.parseTextContent ||
        globalOptions.parseTextContent,
      keepWhiteSpace:
        undefined !== eleAttributes['keep-white-space'] ||
        opts.keepWhiteSpace ||
        globalOptions.keepWhiteSpace
    }
    let content = ele.content

    if (ele.tagName !== 'TEMPLATE') {
      content = document.createDocumentFragment()

      while (ele.childNodes.length) {
        content.appendChild(ele.childNodes[0])
      }
    }

    let isSlotPused = false

    const childNodeFn = function (
      tagTree,
      contentChildNodes,
      tempArr,
      textParseOpt
    ) {
      for (let nodeItem of contentChildNodes) {
        let treeLengthList = tempArr.concat(tagTree.length)

        // if not Node.COMMENT_NODE
        if (nodeItem.nodeType !== 8) {
          // if not Node.TEXT_NODE
          if (nodeItem.nodeType !== 3) {
            // 不是占位标签
            if (
              nodeItem.tagName !== 'WX-CONTENT' &&
              nodeItem.tagName !== 'SLOT'
            ) {
              let isCustomEle =
                nodeItem.tagName.indexOf('-') >= 0 && renderingMode !== 'native'
              let prerendered = isCustomEle
                ? null
                : document.createElement(nodeItem.tagName)
              let id = ''
              let nodeItemAttributes = nodeItem.attributes
              let attrs = []

              if (nodeItemAttributes) {
                let parseOpts = {}

                for (let nodeItemAttr of nodeItemAttributes) {
                  if (nodeItemAttr.name === 'id') {
                    id = nodeItemAttr.value
                  } else if (nodeItemAttr.name === 'parse-text-content') {
                    parseOpts.parseTextContent = true
                  } else if (nodeItemAttr.name === 'keep-white-space') {
                    parseOpts.keepWhiteSpace = true
                  } else {
                    let attrSetter
                    let attrName = nodeItemAttr.name

                    // 属性名末尾是$
                    if (nodeItemAttr.name.slice(-1) === dollarSign) {
                      if (isCustomEle) {
                        attrSetter = setObjAttr
                        attrName = dashToCamel(nodeItemAttr.name.slice(0, -1))
                      } else {
                        // dom
                        attrSetter = setAttr
                        attrName = nodeItemAttr.name.slice(0, -1)
                      }
                    } else if (nodeItemAttr.name.slice(-1) === ':') {
                      attrSetter = setObjAttr
                      attrName = dashToCamel(nodeItemAttr.name.slice(0, -1))
                    } else if (nodeItemAttr.name.slice(0, 6) === 'class.') {
                      attrSetter = isCustomEle
                        ? toggleDomClassAttr
                        : toggleClassAttr
                      attrName = nodeItemAttr.name.slice(6)
                    } else if (nodeItemAttr.name.slice(0, 6) === 'style.') {
                      attrSetter = isCustomEle ? setDomStyle : setStyle
                      attrName = nodeItemAttr.name.slice(6)
                    }

                    let exp

                    if (attrSetter) {
                      exp = new TemplateExparser(
                        nodeItemAttr.value,
                        behaviorMethods
                      )
                    }

                    let value = exp
                      ? exp.calculate(null, data)
                      : nodeItemAttr.value

                    if (!isCustomEle) {
                      (attrSetter || setAttr)(prerendered, attrName, value)
                    }

                    if (isCustomEle || exp) {
                      attrs.push({
                        name: attrName,
                        value,
                        updater: attrSetter,
                        exp
                      })
                    }
                  }
                }

                let elementNode = {
                  name: nodeItem.tagName.toLowerCase(),
                  id,
                  custom: isCustomEle,
                  attrs,
                  prerendered,
                  children: []
                }
                tagTree.push(elementNode)

                if (nodeItem.tagName === 'VIRTUAL') {
                  elementNode.virtual = 'virtual'
                }

                if (nodeItem.childNodes) {
                  childNodeFn(
                    elementNode.children,
                    nodeItem.childNodes,
                    treeLengthList,
                    parseOpts
                  )
                }

                if (
                  elementNode.children.length === 1 &&
                  elementNode.children[0] === slotRef
                ) {
                  elementNode.children.pop()
                  elementNode.slot = ''
                }
              }
            } else {
              isSlotPused = true
              tagTree.push(slotRef)
            }
          } else {
            let text = nodeItem.textContent

            if (!textParseOpt.keepWhiteSpace) {
              text = text.trim()

              if (text === '') continue

              nodeItem.textContent = text
            }

            let exp = textParseOpt.parseTextContent
              ? new TemplateExparser(text, behaviorMethods)
              : null

            tagTree.push({
              exp,
              text: exp ? exp.calculate(null, data) : text
            })
          }
        }
      }
    }

    let tagTree = this._tagTreeRoot
    childNodeFn(tagTree, content.childNodes, [], textParseOpt)

    if (!isSlotPused) {
      tagTree.push(slotRef)
    }

    if (tagTree.length === 1 && tagTree[0] === slotRef) {
      tagTree.pop()
    }
  }

  /**
   * 创建一个 Instance 实例。
   * @return {Instance}
   **/
  createInstance () {
    let ins = new Instance()
    let shadowRoot

    if (this._renderingMode === 'native') {
      shadowRoot = document.createDocumentFragment()
      nativeRendering(
        this._tagTreeRoot,
        shadowRoot,
        ins.idMap,
        ins.slots,
        ins._binding
      )
    } else {
      shadowRoot = new VirtualNode('shadow-root')
      domRendering(
        this._tagTreeRoot,
        shadowRoot,
        ins.idMap,
        ins.slots,
        ins._binding
      )
    }

    ins.shadowRoot = shadowRoot
    return ins
  }
}

export default Template

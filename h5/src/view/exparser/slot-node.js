import Element from './element'

/**
 * 插槽节点
 **/
class SlotNode extends Element {
  /**
   * 插槽节点关联的 dom 节点，等同 __domElement 属性。
   * @type {?DOMElement}
   **/
  $$ = null

  /**
   * 插槽节点关联的 dom 节点，等同 $$ 属性。
   * @type {?DOMElement}
   **/
  __domElement = null

  /**
   * @param {DOMElement} dom
   **/
  constructor (dom) {
    super()
    this.$$ = this.__domElement = dom
    dom.__wxElement = this
  }
}

export default SlotNode

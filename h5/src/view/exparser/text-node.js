import Observer from './observer'

/**
 * 文本节点
 */
class TextNode {
  static create (txt) {
    return new TextNode(txt)
  }

  /**
   * TextNode 实例的 dom 元素，等同 __domElement 属性。
   * @type {DOMElement}
   **/
  $$ = null

  /**
   * TextNode 实例的 dom 元素，等同 $$ 属性。
   * @type {DOMElement}
   **/
  __domElement = null

  // TODO:
  // __textObservers = null

  /**
   * 以当前节点为根节点的子树上的 observer 数量。
   * @type {Number}
   **/
  __subtreeObserversCount = 0

  /**
   * 父节点
   * @type {VirtualNode}
   **/
  parentNode = null

  /**
   * @param {String} [txt=''] 文本内容
   **/
  constructor (txt = '') {
    this.$$ = this.__domElement = document.createTextNode(txt)
    this.__domElement.__wxElement = this
  }

  get textContent () {
    return this.__domElement.textContent
  }

  /**
   * @param {String} txt 文本内容
   */
  set textContent (txt) {
    this.__domElement.textContent = txt

    if (
      (this.__textObservers && !this.__textObservers.empty) ||
      this.__subtreeObserversCount
    ) {
      Observer.callObservers(this, '__textObservers', {
        type: 'characterData',
        target: this
      })
    }
  }
}

export default TextNode

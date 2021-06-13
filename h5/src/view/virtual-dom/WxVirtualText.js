import exparser from '../exparser'

/**
 * 虚拟文本节点
 * @class
 **/
class wxVirtualText {
  /**
   * @param {String} txt 文本内容
   */
  constructor (txt) {
    this.text = String(txt)
  }

  /**
   * 生成文本节点
   * @return {(Text|TextNode)} 文本节点
   * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Text Text}
   * 类型说明
   **/
  render (global) {
    const parser = global ? global.document || exparser : exparser
    return parser.createTextNode(this.text)
  }
}

/**
 * 节点类型说明
 * @type {String}
 **/
wxVirtualText.prototype.type = 'WxVirtualText'

export default wxVirtualText

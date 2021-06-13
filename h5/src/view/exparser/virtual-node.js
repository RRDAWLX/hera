import Element from './element'

class VirtualNode extends Element {
  /**
   * 创建一个虚拟节点
   * @param {String} is 节点名
   * @return {VirtualNode}
   **/
  static create (is) {
    return new VirtualNode(is)
  }

  /**
   * 标识是否为虚拟节点
   * @type {Boolean}
   **/
  __virtual = true

  /**
   * 节点名
   * @type {String}
   **/
  is = ''

  /**
   * @param {String} is 节点名
   **/
  constructor (is) {
    super()
    this.is = is
  }
}

export default VirtualNode

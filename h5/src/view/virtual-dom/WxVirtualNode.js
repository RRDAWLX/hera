import Utils from './Utils'
import Properties from './Properties'
import Diff from './Diff'
import WxVirtualText from './WxVirtualText'
import './Enums'
import exparser from '../exparser'

/**
 * @class
 **/
class WxVirtualNode {
  /**
   * @param {String} [tagName='div'] 标签名
   * @param {Object} props 属性
   * @param {String[]} [newProps=[]] 新属性名数组
   * @param {String} wxKey ???
   * @param {String} wxVkey ???
   * @param {(WxVirtualNode[]|WxVirtualText[]|String[])} [children=[]] 子节点列表
   **/
  constructor (tagName, props, newProps, wxKey, wxVkey, children) {
    /**
     * 标签名
     * @type {String}
     **/
    this.tagName = tagName || 'div'
    /**
     * 属性
     * @type {Object}
     **/
    this.props = props || {}
    /**
     * 子节点列表
     * @type {WxVirtualNode[]}
     **/
    this.children = children || []
    /**
     * 新属性 ???
     * @type {Object[]}
     **/
    this.newProps = newProps || []
    /**
     * ???
     * @type {String}
     **/
    this.wxVkey = wxVkey
    /**
     * ???
     * @memberof WxVirtualNode
     * @member {(String|Undefined)} wxKey
     * @instance
     **/
    Utils.isUndefined(wxKey)
      ? (this.wxKey = void 0)
      : (this.wxKey = String(wxKey))
    /**
     * 子孙节点数量
     * @type {Number}
     **/
    this.descendants = 0 // 子节点数

    if (this.tagName == 'wx-map') {
      // mapSDK按需加载
      import('../components/wx-map').then(map => map.loadSDK())
    }

    for (let c = 0; c < this.children.length; ++c) {
      let child = this.children[c]

      if (Utils.isVirtualNode(child)) {
        this.descendants += child.descendants
      } else {
        if (Utils.isString(child)) {
          this.children[c] = new WxVirtualText(child)
        } else {
          Utils.isVirtualText(child) ||
            console.log('invalid child', tagName, props, children, child)
        }
      }

      ++this.descendants
    }
  }

  /**
   * 渲染 dom 树
   * @return {Element} dom 树根节点
   **/
  render () {
    let ele =
      this.tagName !== 'virtual'
        ? exparser.createElement(this.tagName)
        : exparser.VirtualNode.create('virtual')

    Properties.applyProperties(ele, this.props)

    this.children.forEach(function (child) {
      let dom = child.render()
      ele.appendChild(dom)
    })

    return ele
  }

  /**
   * 生成相对于新树的补丁
   * @param {WxVirtualNode} newNode 新树根节点
   * @return {Patch} 补丁
   **/
  diff (newNode) {
    return Diff.diff(this, newNode)
  }
}

/**
 * 标识节点类型为 WxVirtualNode
 * @type {String}
 **/
WxVirtualNode.prototype.type = 'WxVirtualNode'

export default WxVirtualNode

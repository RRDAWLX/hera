import Properties from './Properties'
import Enums from './Enums'

/**
 * @class
 **/
class VPatch {
  /**
   *
   * @param {Number} type
   * @param {VNode} vNode
   * @param {Patch} patch
   **/
  constructor (type, vNode, patch) {
    /**
     * @member {Number}
     **/
    this.type = Number(type)
    /**
     * @member {VNode}
     **/
    this.vNode = vNode
    /**
     * @member {Patch}
     **/
    this.patch = patch
  }

  /**
   * 应用补丁，更新节点。
   * @param {Node} node 被更新的节点
   * @return {Node} 更新后的节点
   **/
  apply (node) {
    switch (this.type) {
      case Enums.PATCH_TYPE.TEXT:
        return VPatch.stringPatch(node, this.patch)
      case Enums.PATCH_TYPE.VNODE:
        return VPatch.vNodePatch(node, this.patch)
      case Enums.PATCH_TYPE.PROPS:
        return VPatch.applyProperties(node, this.patch, this.vNode.props)
      case Enums.PATCH_TYPE.REORDER:
        return VPatch.reorderChildren(node, this.patch)
      case Enums.PATCH_TYPE.INSERT:
        return VPatch.insertNode(node, this.patch)
      case Enums.PATCH_TYPE.REMOVE:
        return VPatch.removeNode(node)
      default:
        return node
    }
  }

  /**
   * 用 patch 生成新节点以替换老节点。
   * @param {Node} node 待替换节点
   * @param {Patch} patch 补丁
   * @return {Node} 更新后的节点
   **/
  static stringPatch (node, patch) {
    let parent = node.parentNode
    let newEle = patch.render()
    parent && newEle !== node && parent.replaceChild(newEle, node)
    return newEle
  }

  /**
   * 用 patch 生成新节点以替换老节点。
   * @param {Node} node 待替换节点
   * @param {Patch} patch 补丁
   * @return {Node} 更新后的节点
   * @todo 内部逻辑与 stringPatch 一模一样。
   **/
  static vNodePatch (node, patch) {
    let parent = node.parentNode
    let newEle = patch.render()
    parent && newEle !== node && parent.replaceChild(newEle, node)
    return newEle
  }

  /**
   * 更新属性。
   * @param {Node} node 待替换节点
   * @param {Patch} patch 补丁
   * @param {Object.<String, *>} props 待应用的属性
   * @return {Node} 更新后的节点
   * @todo 此处有误，Properties.applyProperties 只有两个入参。
   **/
  static applyProperties (node, patch, props) {
    Properties.applyProperties(node, patch, props)
    return node
  }

  /**
   * 更新父节点的子节点列表。
   * @param {Node} node 父节点
   * @return {Node} 被更新后的父节点
   **/
  static reorderChildren (node, moves) {
    let removes = moves.removes
    let inserts = moves.inserts
    let childNodes = node.childNodes
    let removedChildren = {}

    removes.forEach(function (remove) {
      let childNode = childNodes[remove.index]
      remove.key && (removedChildren[remove.key] = childNode)
      node.removeChild(childNode)
    })

    inserts.forEach(function (insert) {
      let childNode = removedChildren[insert.key]
      node.insertBefore(childNode, childNodes[insert.index])
    })

    return node
  }

  /**
   * 在父节点的子节点列表尾部出入基于 patch 生成的新节点。
   * @param {Node} node 父节点
   * @param {Patch} patch 补丁
   * @return {Node} 被更新后的父节点
   **/
  static insertNode (node, patch) {
    let newEle = patch.render()
    node && node.appendChild(newEle)
    return node
  }

  /**
   * 删除节点。
   * @param {Node} node 待删除节点
   * @return {Null} null
   **/
  static removeNode (node) {
    let parent = node.parentNode
    parent && parent.removeChild(node)
    return null
  }
}

export default VPatch

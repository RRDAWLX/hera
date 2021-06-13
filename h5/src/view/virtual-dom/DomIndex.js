/**
 * @module
 **/

// 通过遍历tree找出patchIndexs中相应索引对应的node,返回nodes
/**
 * 通过遍历 tree 找出 patchIndexs 中相应索引对应的 node，返回nodes
 * @param {Node} rootNode dom 树根节点
 * @param {VNode} tree 虚拟 dom 树根节点
 * @param {Number[]} patchIndexs 索引数组
 * @return {Object} 索引对应的 dom 节点，键为索引，值为 dom 节点。
 **/
const getDomIndex = function (rootNode, tree, patchIndexs) {
  if (patchIndexs && patchIndexs.length != 0) {
    patchIndexs = patchIndexs.sort(function (a, b) {
      // 升序
      return a - b
    })
    let nodes = {} // real dom <-> vdom : key = nodeindex, value = real node
    mapIndexToDom(rootNode, tree, patchIndexs, nodes, 0)
    return nodes
  }

  return {}
}

/**
 * 没懂
 **/
const mapIndexToDom = function mapIndexToDom (
  realDomRootNode,
  vDomRootNode,
  patchIndexs,
  nodes,
  rootIndex
) {
  if (realDomRootNode) {
    // real place to add node to maps
    oneOfIndexesInRange(patchIndexs, rootIndex, rootIndex) &&
      (nodes[rootIndex] = realDomRootNode)
    let vDomChildren = vDomRootNode.children

    if (vDomChildren) {
      let realDomChildren = realDomRootNode.childNodes,
        idx = 0

      for (; idx < vDomChildren.length; ++idx) {
        let vChild = vDomChildren[idx]
        ++rootIndex
        let lastIndex = rootIndex + (vChild.descendants || 0)
        oneOfIndexesInRange(patchIndexs, rootIndex, lastIndex) &&
          mapIndexToDom(
            realDomChildren[idx],
            vChild,
            patchIndexs,
            nodes,
            rootIndex
          )
        rootIndex = lastIndex
      }
    }
  }
}

// Binary search for an index in the interval [left, right]
/**
 * 判断一组索引值中是否至少有一个索引在指定的闭区间内。
 * @param {Number[]} 索引数组
 * @param {Number} left 闭区间下限
 * @param {Number} right 闭区间上限
 * @return {Boolean}
 **/
const oneOfIndexesInRange = function (indices, left, right) {
  let index = 0,
    length = indices.length - 1

  for (; index <= length;) {
    let pivotKey = (length + index) >> 1,
      pivotValue = indices[pivotKey]

    if (pivotValue < left) {
      index = pivotKey + 1
    } else {
      if (!(pivotValue > right)) return !0
      length = pivotKey - 1
    }
  }

  return !1
}

export default { getDomIndex, mapIndexToDom, oneOfIndexesInRange }

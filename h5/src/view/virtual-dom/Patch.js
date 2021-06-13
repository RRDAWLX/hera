import DomIndex from './DomIndex'

/**
 * @class
 **/
class Patch {
  /**
   * @param {Node} oldTree 老 dom 树根节点？？？
   * @param {Patch[]} patches 补丁数组？？？
   **/
  constructor (oldTree, patches) {
    /**
     * 老 dom 树根节点？？？
     * @member {Node}
     **/
    this.oldTree = oldTree
    /**
     * 补丁数组？？？
     * @member {Patch[]}
     **/
    this.patches = patches
    /**
     * 补丁索引数组
     * @member {Patch[]}
     **/
    this.patchIndexes = Object.keys(this.patches).map(function (idx) {
      return Number(idx)
    })
  }

  /**
   * 在 dom 树上应用补丁。
   * @param {Node} rootNode dom 树根节点
   * @return {Node} dom 树根节点
   **/
  apply (rootNode) {
    let that = this
    if (this.patchIndexes.length === 0) return rootNode

    let doms = DomIndex.getDomIndex(rootNode, this.oldTree, this.patchIndexes)

    this.patchIndexes.forEach(function (patchIdx) {
      let dom = doms[patchIdx]

      if (dom) {
        let patches = that.patches[patchIdx]
        patches.forEach(function (vpatch) {
          vpatch.apply(dom)
        })
      }
    })

    return rootNode
  }
}

export default Patch

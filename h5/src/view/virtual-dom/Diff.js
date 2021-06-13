/**
 * @module
 **/

import VPatch from './VPatch'
import Patch from './Patch'
import Utils from './Utils'
import ListDiff from './ListDiff'
import Enums from './Enums'

/**
 * 比较两棵树，返回老树变成新树需要的补丁。
 * @param {WxVirtualNode} oriEle 老树根节点
 * @param {WxVirtualNode} newEle 新树根节点
 * @return {Patch} 补丁
 **/
const diff = function (oriEle, newEle) {
  let patches = {}
  diffNode(oriEle, newEle, patches, 0)
  return new Patch(oriEle, patches)
}

/**
 * 比较新、老两棵虚拟节点树，将补丁附着到补丁对象上。
 * @param {WxVirtualNode} oriEle 老树根节点
 * @param {WxVirtualNode} newEle 新树根节点
 * @param {Object.<String, Patch[]>} patches 补丁对象
 * @param {String} index 索引
 **/
const diffNode = function (oriEle, newEle, patches, index) {
  if (oriEle !== newEle) {
    let patch = patches[index]

    if (newEle == null) {
      patch = appendPatch(patch, new VPatch(Enums.PATCH_TYPE.REMOVE, oriEle))
    } else if (Utils.isVirtualNode(newEle)) {
      if (Utils.isVirtualNode(oriEle)) {
        if (
          oriEle.tagName === newEle.tagName &&
          oriEle.wxKey === newEle.wxKey
        ) {
          if (oriEle.tagName === 'virtual' && oriEle.wxVkey !== newEle.wxVkey) {
            // 虚拟节点变化
            patch = appendPatch(
              patch,
              new VPatch(Enums.PATCH_TYPE.VNODE, oriEle, newEle)
            )
          } else {
            let propPatches = diffProps(newEle.props, newEle.newProps) // 属性变化
            propPatches &&
              (patch = appendPatch(
                patch,
                new VPatch(Enums.PATCH_TYPE.PROPS, oriEle, propPatches)
              ))
            patch = diffChildren(oriEle, newEle, patches, patch, index)
          }
        } else {
          patch = appendPatch(
            patch,
            new VPatch(Enums.PATCH_TYPE.VNODE, oriEle, newEle)
          )
        }
      } else {
        patch = appendPatch(
          patch,
          new VPatch(Enums.PATCH_TYPE.VNODE, oriEle, newEle)
        )
      }
    } else {
      if (!Utils.isVirtualText(newEle)) {
        console.log('unknow node type', oriEle, newEle)
        throw {
          message: 'unknow node type',
          node: newEle
        }
      }

      newEle.text !== oriEle.text &&
        (patch = appendPatch(
          patch,
          new VPatch(Enums.PATCH_TYPE.TEXT, oriEle, newEle)
        ))
    }

    patch && (patches[index] = patch)
  }
}

/**
 * 比较新、老两棵树的子节点差异，将补丁添加到补丁对象上，返回补丁数组。
 * @param {WxVirtualNode} old 老树根节点
 * @param {WxVirtualNode} newEle 新树根节点
 * @param {Object.<String, Patch[]>} patches 补丁对象
 * @param {Patch[]} patch 补丁数组
 * @param {String} index 索引
 * @return {Patch[]} 补丁数组
 **/
const diffChildren = function (old, newEle, patches, patch, index) {
  let oldChildren = old.children
  let orderedSet = ListDiff.listDiff(oldChildren, newEle.children)
  let newChildren = orderedSet.children
  let len =
    oldChildren.length > newChildren.length
      ? oldChildren.length
      : newChildren.length
  let idx = 0

  for (; idx < len; ++idx) {
    let oldChild = oldChildren[idx],
      newChild = newChildren[idx]
    ++index

    if (oldChild) {
      diffNode(oldChild, newChild, patches, index)
    } else {
      if (newChild) {
        patch = appendPatch(
          patch,
          new VPatch(Enums.PATCH_TYPE.INSERT, oldChild, newChild)
        )
      }
    }

    Utils.isVirtualNode(oldChild) && (index += oldChild.descendants)
  }

  orderedSet.moves &&
    (patch = appendPatch(
      patch,
      new VPatch(Enums.PATCH_TYPE.REORDER, old, orderedSet.moves)
    ))

  return patch
}

// 设置属性
/**
 * 读取目标对象中指定的几个属性，组成的新对象。
 * @param {Object} props 属性对象
 * @param {String[]} 属性名数组
 * @return {(Object|Undefined)} 如果新对象为空对象，则返回 undefined，否则返回该新对象。
 * @see module:view/virtual-dom/Utils.isEmptyObject
 **/
const diffProps = function (props, newProps) {
  let tempObj = {}

  for (let key in newProps) {
    let newPropName = newProps[key]
    tempObj[newPropName] = props[newPropName]
  }

  return Utils.isEmptyObject(tempObj) ? void 0 : tempObj
}

// 将newPatch加入到patches数组
/**
 * 将 patch 加入到 patch 数组
 * @param {Patch[]} patches patch 数组
 * @param {Patch} newPatch 待添加 patch
 * @return {Patch[]} patch 数组
 **/
const appendPatch = function (patches, newPatch) {
  if (patches) {
    patches.push(newPatch)
    return patches
  } else {
    return [newPatch]
  }
}

export default {
  diff,
  diffChildren,
  diffNode,
  diffProps,
  appendPatch
}

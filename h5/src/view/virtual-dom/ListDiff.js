/**
 * @module
 **/

import Utils from './Utils'

// a for old, b for new
/**
 * 对比新老两个元素数组，返回一个元素数组，以及需要对该元素数组进行的插入、删除操作。
 * @param {Element[]} aChildren 老元素数组
 * @param {Element[]} bChildren 新元素数组
 * @return {{chidren: Element[], moves: ?{removes: Array, inserts: Array}}}
 **/
const listDiff = function (aChildren, bChildren) {
  // 删除数组中指定下标 index 的元素，并返回 { index, key }。
  function remove (arr, index, key) {
    arr.splice(index, 1)
    return {
      index: index,
      key: key
    }
  }

  let aChildIndex = makeKeyAndFreeIndexes(aChildren)
  let aKeys = aChildIndex.keyIndexes

  // remove original child if it has no keyed child
  if (Utils.isEmptyObject(aKeys)) {
    return {
      children: bChildren,
      moves: null
    }
  }

  let bChildIndex = makeKeyAndFreeIndexes(bChildren)
  let bKeys = bChildIndex.keyIndexes
  let bFree = bChildIndex.freeIndexes

  // remove original child if newChild has no keyed child
  if (Utils.isEmptyObject(bKeys)) {
    return {
      children: bChildren,
      moves: null
    }
  }

  let newChildren = []
  let freeIndex = 0
  let deletedItems = 0

  // Iterate through oldChs and match oldChs node in newChs
  // O(N) time
  for (let idx = 0; idx < aChildren.length; ++idx) {
    let aItem = aChildren[idx]
    let aItemKey = getItemKey(aItem)

    if (aItemKey) {
      if (Object.prototype.hasOwnProperty.call(bKeys, aItemKey)) {
        // Match up the old keys
        let itemIndex = bKeys[aItemKey]
        newChildren.push(bChildren[itemIndex])
      } else {
        // Remove old keyed items
        ++deletedItems
        newChildren.push(null)
      }
    } else if (freeIndex < bFree.length) {
      // Match the item in a with the next free item in b
      let itemIndex = bFree[freeIndex]
      newChildren.push(bChildren[itemIndex])
      ++freeIndex
    } else {
      // There are no free items in b to match with
      // the free items in a, so the extra free nodes
      // are deleted.
      ++deletedItems
      newChildren.push(null)
    }
  }

  let lastFreeIndex = bFree[freeIndex] || bChildren.length

  // Iterate through b and append any new keys
  // O(M) time
  for (let idx = 0; idx < bChildren.length; ++idx) {
    let newItem = bChildren[idx]
    let bItemKey = getItemKey(newItem)

    if (bItemKey) {
      Object.prototype.hasOwnProperty.call(aKeys, bItemKey) ||
        newChildren.push(newItem)
    } else if (idx >= lastFreeIndex) {
      newChildren.push(newItem)
    }
  }

  let simulate = newChildren.slice(0)
  let simulateIndex = 0
  let removes = []
  let inserts = []

  for (let idx = 0; idx < bChildren.length;) {
    let itemNode = bChildren[idx]
    let itemKey = getItemKey(itemNode)
    let simulateItem = simulate[simulateIndex]
    let newItemKey = getItemKey(simulateItem)

    // remove items
    for (; simulateItem === null;) {
      // if null remove it
      removes.push(remove(simulate, simulateIndex, newItemKey))

      // update simulateItem info
      simulateItem = simulate[simulateIndex]
      newItemKey = getItemKey(simulateItem)
    }

    if (newItemKey === itemKey) {
      ++simulateIndex
      ++idx
    } else {
      // if we need a key in this position...
      if (itemKey) {
        if (newItemKey) {
          if (bKeys[newItemKey] === idx + 1) {
            inserts.push({
              key: itemKey,
              index: idx
            })
          } else {
            // if an insert doesn't put this key in place, it needs to move
            removes.push(remove(simulate, simulateIndex, newItemKey))
            simulateItem = simulate[simulateIndex]

            // items are matching, so skip ahead
            if (simulateItem && getItemKey(simulateItem) === itemKey) {
              ++simulateIndex
            } else {
              // if the remove didn't put the wanted item in place, we need to insert it
              inserts.push({
                key: itemKey,
                index: idx
              })
            }
          }
        } else {
          // insert a keyed wanted item
          inserts.push({
            key: itemKey,
            index: idx
          })
        }
        ++idx
      } else {
        // a key in simulate has no matching wanted key, remove it
        removes.push(remove(simulate, simulateIndex, newItemKey))

        // simulateItem will update at the beginning of  next iteration
      }
    }
  }

  // remove all the remaining nodes from simulate
  for (; simulateIndex < simulate.length;) {
    let simulateItem = simulate[simulateIndex]
    let itemKey = getItemKey(simulateItem)
    removes.push(remove(simulate, simulateIndex, itemKey))
  }

  if (removes.length === deletedItems && inserts.length === 0) {
    return {
      children: newChildren,
      moves: null
    }
  } else {
    return {
      children: newChildren,
      moves: {
        removes: removes,
        inserts: inserts
      }
    }
  }
}

/**
 * 遍历一组元素，一旦发现元素的 wxKey 值已出现过，将其赋值为 undefined。
 * 返回这组元素中出现的 wxKey 与元素在数组中的索引的映射关系；
 * 返回经处理后无 wxKey 值的元素的索引组成的数组，索引值由小到大。
 * @param {Element[]} 元素数组
 * @return {{keyIndexes: Object.<String, Number>, freeIndexes: Number[]}}
 * { keyIndexes: Object.<String, Number>, freeIndexes: Number[] }
 **/
const makeKeyAndFreeIndexes = function (children) {
  let keyIndexes = {}
  let freeIndexes = []

  for (let idx = 0; idx < children.length; ++idx) {
    let child = children[idx]
    let wxKey = getItemKey(child)

    if (wxKey) {
      if (Object.prototype.hasOwnProperty.call(keyIndexes, wxKey)) {
        console.error(`多次使用 ${wxKey} 作为 wxKey`)
        child.wxKey = void 0
        freeIndexes.push(idx)
      } else {
        keyIndexes[wxKey] = idx
      }
    } else {
      freeIndexes.push(idx)
    }
  }

  return {
    keyIndexes: keyIndexes,
    freeIndexes: freeIndexes
  }
}

/**
 * 获取元素上的属性 wxKey
 * @param {Element} ele
 * @return {(String|Undefined)}
 **/
const getItemKey = function (ele) {
  if (ele) return ele.wxKey
}

export default {
  listDiff,
  makeKeyAndFreeIndexes,
  getItemKey
}

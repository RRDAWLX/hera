/**
 * 路由相关工具。
 * @module
 **/
import bridge from './bridge'

/**
 * 根据路径前缀和路径生成目标路径。
 * @param {String} [pathPrefix=''] 路径前缀
 * @param {String} [path=''] 路径
 * @return {String}
 * @static
 */
export function getRealRoute (pathPrefix = '', path = '') {
  if (path.indexOf('/') === 0) {
    return path.slice(1)
  }

  if (path.indexOf('./') === 0) {
    path = path.slice(2)
  }

  let index = 0
  let folderArr = path.split('/')
  let folderLength = folderArr.length

  while (index < folderLength && folderArr[index] === '..') {
    index++
  }

  folderArr.splice(0, index)
  let prefixArr = pathPrefix.length > 0 ? pathPrefix.split('/') : []
  prefixArr.splice(prefixArr.length - index - 1, index + 1)
  let pathArr = prefixArr.concat(folderArr)
  return pathArr.join('/')
}

/**
 * 获取当前路由。
 * @param {Object} params 请求参数及成功、失败等回调函数。
 **/
export function getCurrentRoute (params) {
  bridge.invokeMethod('getCurrentRoute', params, {
    beforeSuccess: function (res) {
      res.route = res.route.split('?')[0]
    }
  })
}

export default {
  getRealRoute,
  getCurrentRoute
}

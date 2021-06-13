/**
 * 图片相关操作。
 * @module
 **/
import bridge from './bridge'
import route from './route'

let processing = false // 标识当前是否正在处理读取图片的任务
const todo = [] // 待执行的读取图片任务

function beforeAllFn () {
  processing = false

  if (todo.length > 0) {
    getLocalImgData(todo.shift())
  }
}

/**
 * 读取本地图片
 * @param {Object} params 包含读取参数和成功、失败等情况的回调函数。
 **/
export function getLocalImgData (params) {
  if (processing) {
    todo.push(params)
  } else {
    processing = true

    if (typeof params.path === 'string') {
      // TODO：fail、cancel等情况没考虑
      route.getCurrentRoute({
        success: function (res) {
          params.path = route.getRealRoute(
            res.route || 'index.html',
            params.path
          )
          bridge.invokeMethod('getLocalImgData', params, {
            beforeAll: beforeAllFn
          })
        }
      })
    } else {
      bridge.invokeMethod('getLocalImgData', params, {
        beforeAll: beforeAllFn
      })
    }
  }
}

export default {
  getLocalImgData
}

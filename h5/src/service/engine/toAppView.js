import utils from './utils'

/**
 * 通知dom更新
 * @class
 * @returns {any}
 */
class toAppView {
  constructor () {}

  /**
     * 向视图层发送数据。
     * @param {*} data
     * @param {String} webviewId 视图层所在 Webview ID
     **/
  static emit (data, webviewId) {
    utils.publish(
      'appDataChange',
      {
        data: {
          data: data
        }
      },
      [webviewId]
    )
  }
}
export default toAppView

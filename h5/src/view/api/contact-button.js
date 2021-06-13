/**
 * 触发 contact button 相关事件
 * @module
 */

import bridge from './bridge'

/**
 * 触发 insertContactButton 事件
 * @param {Object} e 事件对象
 * @static
 */
function insertContactButton (e) {
  bridge.invokeMethod('insertContactButton', e)
}

/**
 * 触发 updateContactButton 事件
 * @param {Object} e 事件对象
 * @static
 */
function updateContactButton (e) {
  bridge.invokeMethod('updateContactButton', e)
}

/**
 * 触发 removeContactButton 事件
 * @param {Object} e 事件对象
 * @static
 */
function removeContactButton (e) {
  bridge.invokeMethod('removeContactButton', e)
}

/**
 * 触发 enterContact 事件
 * @param {Object} e 事件对象
 * @static
 */
function enterContact (e) {
  bridge.invokeMethod('enterContact', e)
}

export default {
  insertContactButton,
  updateContactButton,
  removeContactButton,
  enterContact,
}

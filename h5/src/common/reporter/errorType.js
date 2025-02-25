/**
 * 错误类型定义
 * @module
 */

/**
 * @readonly
 * @enum {Number}
 */
export var IDKeyType = {
  login: 1,
  login_cancel: 2,
  login_fail: 3,
  request_fail: 4,
  connectSocket_fail: 5,
  closeSocket_fail: 6,
  sendSocketMessage_fail: 7,
  uploadFile_fail: 8,
  downloadFile_fail: 9,
  redirectTo_fail: 10,
  navigateTo_fail: 11,
  navigateBack_fail: 12,
  appServiceSDKScriptError: 13,
  webviewSDKScriptError: 14,
  jsEnginScriptError: 15,
  thirdScriptError: 16,
  webviewScriptError: 17,
  exparserScriptError: 18,
  startRecord: 19,
  startRecord_fail: 20,
  getLocation: 21,
  getLocation_fail: 22,
  chooseLocation: 23,
  chooseLocation_fail: 24,
  openAddress: 25,
  openAddress_fail: 26,
  openLocation: 27,
  openLocation_fail: 28,
  makePhoneCall: 29,
  makePhoneCall_fail: 30,
  operateWXData: 31,
  operateWXData_fail: 32,
  checkLogin: 33,
  checkLogin_fail: 34,
  refreshSession: 35,
  refreshSession_fail: 36,
  chooseVideo: 37,
  chooseVideo_fail: 38,
  chooseImage: 39,
  chooseImage_fail: 40,
  verifyPaymentPassword: 41,
  verifyPaymentPassword_fail: 42,
  requestPayment: 43,
  requestPayment_fail: 44,
  bindPaymentCard: 45,
  bindPaymentCard_fail: 46,
  requestPaymentToBank: 47,
  requestPaymentToBank_fail: 48,
  openDocument: 49,
  openDocument_fail: 50,
  chooseContact: 51,
  chooseContact_fail: 52,
  operateMusicPlayer: 53,
  operateMusicPlayer_fail: 54,
  getMusicPlayerState_fail: 55,
  playVoice_fail: 56,
  setNavigationBarTitle_fail: 57,
  switchTab_fail: 58,
  getImageInfo_fail: 59,
  enableCompass_fail: 60,
  enableAccelerometer_fail: 61,
  getStorage_fail: 62,
  setStorage_fail: 63,
  clearStorage_fail: 64,
  removeStorage_fail: 65,
  getStorageInfo_fail: 66,
  getStorageSync_fail: 67,
  setStorageSync_fail: 68,
  addCard_fail: 69,
  openCard_fail: 70
}

/**
 * @readonly
 * @enum {String}
 */
export var KeyValueType = {
  Speed: '13544',
  Error: '13582',
  Slow: '13968'
}

/**
 * @readonly
 * @enum {Number}
 */
export var SpeedValueType = {
  webview2AppService: 1,
  appService2Webview: 2,
  funcReady: 3,
  firstGetData: 4,
  firstRenderTime: 5,
  reRenderTime: 6,
  forceUpdateRenderTime: 7,
  appRoute2newPage: 8,
  newPage2pageReady: 9,
  thirdScriptRunTime: 10,
  pageframe: 11,
  WAWebview: 12
}

/**
 * @readonly
 * @enum {Number}
 */
export var SlowValueType = {
  apiCallback: 1,
  pageInvoke: 2
}

/**
 * @readonly
 * @enum {Number}
 */
export var ErrorType = {
  appServiceSDKScriptError: 1,
  webviewSDKScriptError: 2,
  jsEnginScriptError: 3,
  thirdScriptError: 4,
  webviewScriptError: 5,
  exparserScriptError: 6
}

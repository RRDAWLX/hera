export const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
  DEVTOOLS: 'devtools'
}

let platform = ''

// TODO: 待完善
export function getPlatform () {
  if (!platform && window) {
    let ua = window.navigator.userAgent.toLowerCase()

    if (/android/.test(ua)) {
      platform = PLATFORMS.ANDROID
    } else if (/iphone|ipad/.test(ua)) {
      platform = PLATFORMS.IOS
    } else {
      platform = PLATFORMS.DEVTOOLS
    }
  }

  return platform
}

export function isAndroid () {
  return getPlatform() === PLATFORMS.ANDROID
}

export function isIOS () {
  return getPlatform() === PLATFORMS.IOS
}

export function isDevtools () {
  return getPlatform() === PLATFORMS.DEVTOOLS
}

export default {
  getPlatform,
  isAndroid,
  isIOS,
  isDevtools
}

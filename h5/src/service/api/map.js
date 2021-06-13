// 1-8 map相关事件和方法

import pubsub from './bridge'
import utils from './utils'
import EventEmitter2 from './EventEmitter2'

function notifyWebviewIdtoMap (e) {
  webviewID = e
}

var mapIds = {}
var mapInfo = {}
var EventEmitter = new EventEmitter2.EventEmitter2()
var webviewID = 0
var callbackIndex = 0

ServiceJSBridge.subscribe('mapInsert', function (params, viewId) {
  var domId = params.domId
  var mapId = params.mapId
  var bindregionchange = params.bindregionchange
  var bindtap = params.bindtap
  var showLocation = params.showLocation
  var key = viewId + '_' + domId
  mapIds[key] = mapIds[key] || mapId

  mapInfo[viewId + '_' + mapId] = {
    bindregionchange: bindregionchange,
    bindtap: bindtap,
    showLocation: showLocation
  }
  EventEmitter.emit('mapInsert')
})

class MapContext {
  constructor (mapId) {
    var that = this
    if (typeof mapId !== 'string') throw new Error('map ID should be a String')
    this.domId = mapId

    ServiceJSBridge.subscribe('doMapActionCallback', function (event, t) {
      var callbackId = event.callbackId
      event.method === 'getMapCenterLocation' &&
        callbackId &&
        typeof that[callbackId] === 'function' &&
        (that[callbackId]({
          longitude: event.longitude,
          latitude: event.latitude
        }),
        delete that[callbackId])
    })
  }

  _invoke (methodName, params) {
    var platform = utils.getPlatform()
    if (platform === 'ios' || platform === 'android') {
      var curMapInfo = mapInfo[webviewID + '_' + params.mapId]
      if (methodName === 'moveToMapLocation') {
        return void (curMapInfo && curMapInfo.showLocation
          ? pubsub.invokeMethod(methodName, params)
          : console.error(
            'only show-location set to true can invoke moveToLocation'
          ))
      }
      pubsub.invokeMethod(methodName, params)
    } else {
      params.method = methodName
      var callbackId =
        'callback' + webviewID + '_' + params.mapId + '_' + callbackIndex++
      this[callbackId] = params.success
      params.callbackId = callbackId
      pubsub.publish('doMapAction' + params.mapId, params, [webviewID])
    }
  }

  _invokeMethod (name, params) {
    var self = this
    var index = webviewID + '_' + this.domId
    typeof mapIds[index] === 'number' || mapIds[index]
      ? ((params.mapId = mapIds[index]), this._invoke(name, params))
      : EventEmitter.on('mapInsert', function () {
        params.mapId = mapIds[index]
        self._invoke(name, params)
      })
  }

  getCenterLocation () {
    var params =
      arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
    this._invokeMethod('getMapCenterLocation', params)
  }

  moveToLocation () {
    var params =
      arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
    this._invokeMethod('moveToMapLocation', params)
  }
}

export default {
  notifyWebviewIdtoMap: notifyWebviewIdtoMap,
  MapContext: MapContext, // class
  mapInfo: mapInfo
}

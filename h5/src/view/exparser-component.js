import heraJSBridge from '@/common/jsbridge'
import exparser from './exparser'

function exeWhenWXJSbridgeReady (fn) {
  // 因为在模板 view.html 中，__pageFrameEndTime__ 的赋值在小程序框架代码加载之后，
  // 所以这里一定是执行 addEventListener 语句。
  window.__pageFrameEndTime__ // 首次generateFuncReady加载完毕
    ? fn()
    : document.addEventListener('generateFuncReady', fn)
}

// 转发 window 上的 animation 和 transition 相关的动画事件到 exparser
!(function (win) {
  var getOpt = function (args) {
    return {
      animationName: args.animationName,
      elapsedTime: args.elapsedTime
    }
  }
  var isWebkit = null
  var animationAPIList = [
    'webkitAnimationStart',
    'webkitAnimationIteration',
    'webkitAnimationEnd',
    'animationstart',
    'animationiteration',
    'animationend',
    'webkitTransitionEnd',
    'transitionend'
  ]
  animationAPIList.forEach(function (key) {
    isWebkit = key.slice(0, 6) === 'webkit'

    if (isWebkit) {
      key = key.slice(6).toLowerCase()
    }

    win.addEventListener(
      key,
      function (event) {
        event.target.__wxElement &&
          exparser.triggerEvent(event.target.__wxElement, key, getOpt(event))
        document.dispatchEvent(new CustomEvent('pageReRender', {}))
      },
      !0
    )
  })
})(window)

// 订阅并转发 heraJSBridge 提供的全局事件到 exparser
!(function () {
  exeWhenWXJSbridgeReady(function () {
    heraJSBridge.subscribe('onAppRouteDone', function () {
      window.__onAppRouteDone = !0
      exparser.triggerEvent(
        document,
        'routeDone',
        {},
        {
          bubbles: !0
        }
      )
      document.dispatchEvent(new CustomEvent('pageReRender', {}))
    })

    heraJSBridge.subscribe('setKeyboardValue', function (event) {
      event &&
        event.data &&
        exparser.triggerEvent(
          document,
          'setKeyboardValue',
          {
            value: event.data.value,
            cursor: event.data.cursor,
            inputId: event.data.inputId
          },
          {
            bubbles: !0
          }
        )
    })

    heraJSBridge.subscribe('hideKeyboard', function () {
      exparser.triggerEvent(
        document,
        'hideKeyboard',
        {},
        {
          bubbles: !0
        }
      )
    })

    heraJSBridge.on('onKeyboardComplete', function (event) {
      exparser.triggerEvent(
        document,
        'onKeyboardComplete',
        {
          value: event.value,
          inputId: event.inputId
        },
        {
          bubbles: !0
        }
      )
    })

    heraJSBridge.on('onKeyboardConfirm', function (event) {
      exparser.triggerEvent(
        document,
        'onKeyboardConfirm',
        {
          value: event.value,
          inputId: event.inputId
        },
        {
          bubbles: !0
        }
      )
    })

    heraJSBridge.on('onTextAreaHeightChange', function (event) {
      exparser.triggerEvent(
        document,
        'onTextAreaHeightChange',
        {
          height: event.height,
          lineCount: event.lineCount,
          inputId: event.inputId
        },
        {
          bubbles: !0
        }
      )
    })

    heraJSBridge.on('onKeyboardShow', function (event) {
      exparser.triggerEvent(
        document,
        'onKeyboardShow',
        {
          inputId: event.inputId
        },
        {
          bubbles: !0
        }
      )
    })
  })
})()

// 转发 window 上的 error 以及各种表单事件到 exparser
!(function (window) {
  exparser.globalOptions.renderingMode = 'native'

  window.addEventListener(
    'change',
    function (event) {
      exparser.triggerEvent(event.target, 'change', {
        value: event.target.value
      })
    },
    !0
  )

  window.addEventListener(
    'input',
    function (event) {
      exparser.triggerEvent(event.target, 'input')
    },
    !0
  )

  window.addEventListener(
    'load',
    function (event) {
      exparser.triggerEvent(event.target, 'load')
    },
    !0
  )

  window.addEventListener(
    'error',
    function (event) {
      exparser.triggerEvent(event.target, 'error')
    },
    !0
  )

  window.addEventListener(
    'focus',
    function (event) {
      exparser.triggerEvent(event.target, 'focus'), event.preventDefault()
    },
    !0
  )

  window.addEventListener(
    'blur',
    function (event) {
      exparser.triggerEvent(event.target, 'blur')
    },
    !0
  )

  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame
  window.requestAnimationFrame ||
    (window.requestAnimationFrame = function (func) {
      typeof func === 'function' &&
        setTimeout(function () {
          func()
        }, 17)
    })
})(window),
// touch events
(function (win) {
  var triggerEvent = function (event, name, params) {
    exparser.triggerEvent(event.target, name, params, {
      originalEvent: event,
      bubbles: !0,
      composed: !0,
      extraFields: {
        touches: event.touches,
        changedTouches: event.changedTouches
      }
    })
  }
  var distanceThreshold = 10
  var longtapGapTime = 350
  var wxScrollTimeLowestValue = 50
  var setTouches = function (event, change) {
    event[change ? 'changedTouches' : 'touches'] = [
      {
        identifier: 0,
        pageX: event.pageX,
        pageY: event.pageY,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        target: event.target
      }
    ]
    return event
  }
  var isTouchstart = !1
  var oriTimeStamp = 0
  var curX = 0
  var curY = 0
  var curEvent = 0
  var longtapTimer = null
  var isCancletap = !1
  var canceltap = function (node) {
    for (; node; node = node.parentNode) {
      var element = node.__wxElement || node
      if (
        element.__wxScrolling &&
            Date.now() - element.__wxScrolling < wxScrollTimeLowestValue
      ) {
        return !0
      }
    }
    return !1
  }
  var triggerLongtap = function () {
    triggerEvent(curEvent, 'longtap', {
      x: curX,
      y: curY
    })
  }
  var touchstart = function (event, x, y) {
    if (!oriTimeStamp) {
      oriTimeStamp = event.timeStamp
      curX = x
      curY = y
      if (canceltap(event.target)) {
        longtapTimer = null
        isCancletap = !0
        triggerEvent(event, 'canceltap', {
          x: x,
          y: y
        })
      } else {
        longtapTimer = setTimeout(triggerLongtap, longtapGapTime)
        isCancletap = !1
      }
      curEvent = event
      event.defaultPrevented && (oriTimeStamp = 0)
    }
  }
  var touchmove = function (e, x, y) {
    if (oriTimeStamp) {
      if (
        !(
          Math.abs(x - curX) < distanceThreshold &&
              Math.abs(y - curY) < distanceThreshold
        )
      ) {
        longtapTimer && (clearTimeout(longtapTimer), (longtapTimer = null))
        isCancletap = !0
        triggerEvent(curEvent, 'canceltap', {
          x: x,
          y: y
        })
      }
    }
  }
  var touchend = function (event, x, y, isTouchcancel) {
    if (oriTimeStamp) {
      oriTimeStamp = 0
      longtapTimer && (clearTimeout(longtapTimer), (longtapTimer = null))
      if (isTouchcancel) {
        event = curEvent
        x = curX
        y = curY
      } else {
        if (!isCancletap) {
          triggerEvent(curEvent, 'tap', {
            x: x,
            y: y
          })
          readyAnalyticsReport(curEvent)
        }
      }
    }
  }
  win.addEventListener(
    'scroll',
    function (event) {
      event.target.__wxScrolling = Date.now()
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'touchstart',
    function (event) {
      isTouchstart = !0
      triggerEvent(event, 'touchstart')
      event.touches.length === 1 &&
          touchstart(event, event.touches[0].pageX, event.touches[0].pageY)
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'touchmove',
    function (event) {
      triggerEvent(event, 'touchmove')
      event.touches.length === 1 &&
          touchmove(event, event.touches[0].pageX, event.touches[0].pageY)
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'touchend',
    function (event) {
      triggerEvent(event, 'touchend')
      event.touches.length === 0 &&
          touchend(
            event,
            event.changedTouches[0].pageX,
            event.changedTouches[0].pageY
          )
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'touchcancel',
    function (event) {
      triggerEvent(event, 'touchcancel')
      touchend(null, 0, 0, !0)
    },
    {
      capture: !0,
      passive: !1
    }
  )
  window.addEventListener('blur', function () {
    touchend(null, 0, 0, !0)
  })
  win.addEventListener(
    'mousedown',
    function (event) {
      if (!isTouchstart && !oriTimeStamp) {
        setTouches(event, !1)
        triggerEvent(event, 'touchstart')
        touchstart(event, event.pageX, event.pageY)
      }
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'mousemove',
    function (event) {
      if (!isTouchstart && oriTimeStamp) {
        setTouches(event, !1)
        triggerEvent(event, 'touchmove')
        touchmove(event, event.pageX, event.pageY)
      }
    },
    {
      capture: !0,
      passive: !1
    }
  )
  win.addEventListener(
    'mouseup',
    function (event) {
      if (!isTouchstart && oriTimeStamp) {
        setTouches(event, !0)
        triggerEvent(event, 'touchend')
        touchend(event, event.pageX, event.pageY)
      }
    },
    {
      capture: !0,
      passive: !1
    }
  )
  var analyticsConfig = {}
  var readyAnalyticsReport = function (event) {
    if (analyticsConfig.selector) {
      for (
        var selector = analyticsConfig.selector, target = event.target;
        target;

      ) {
        if (target.tagName && target.tagName.indexOf('WX-') === 0) {
          var classNames = target.className
            .split(' ')
            .map(function (className) {
              return '.' + className
            })
              ;['#' + target.id]
            .concat(classNames)
            .forEach(function (curSelector) {
              selector.indexOf(curSelector) > -1 &&
                    analyticsReport(target, curSelector)
            })
        }
        target = target.parentNode
      }
    }
  }
  var analyticsReport = function (ele, selector) {
    for (var i = 0; i < analyticsConfig.data.length; i++) {
      var curData = analyticsConfig.data[i]
      if (curData.element === selector) {
        var data = {
          eventID: curData.eventID,
          page: curData.page,
          element: curData.element,
          action: curData.action,
          time: Date.now()
        }
        selector.indexOf('.') === 0 &&
              (data.index = Array.prototype.indexOf.call(
                document.body.querySelectorAll(curData.element),
                ele
              ))
        exeWhenWXJSbridgeReady(function () {
          heraJSBridge.publish('analyticsReport', {
            data: data
          })
        })
        break
      }
    }
  }
  exeWhenWXJSbridgeReady(function () {
    heraJSBridge.subscribe('analyticsConfig', function (params) {
      if (Object.prototype.toString.call(params.data) === '[object Array]') {
        analyticsConfig.data = params.data
        analyticsConfig.selector = []
        analyticsConfig.data.forEach(function (e) {
          e.element && analyticsConfig.selector.push(e.element)
        })
      }
    })
  })
})(window)

// import './behaviors/wx-base'
// import './behaviors/wx-data-component'
// import './behaviors/wx-disabled'
// import './behaviors/wx-group'
// import './behaviors/wx-hover'
// import './behaviors/wx-input-base'
// import './behaviors/wx-item'
// import './behaviors/wx-label-target'
// import './behaviors/wx-mask-Behavior'
// import './behaviors/wx-native'
// import './behaviors/wx-player'
// import './behaviors/wx-touchtrack'
// import './behaviors/wx-positioning-target'
//
// import './components/wx-action-sheet-cancel'
// import './components/wx-action-sheet'
// import './components/wx-action-sheet-item'
// import './components/wx-audio'
// import './components/wx-button'
// import './components/wx-canvas'
// import './components/wx-checkbox'
// import './components/wx-checkbox-Group'
// import './components/wx-form'
// import './components/wx-icon'
// import './components/wx-image'
// import './components/wx-input'
// import './components/wx-label'
// import './components/wx-loading'
// import './components/wx-map'
// import './components/wx-mask'
// import './components/wx-modal'
// import './components/wx-navigator'
// import './components/wx-picker'
// import './components/wx-picker-view'
// import './components/wx-picker-view-column'
// import './components/wx-progress'
// import './components/wx-radio'
// import './components/wx-radio-group'
// import './components/wx-scroll-view'
// import './components/wx-slider'
// import './components/wx-swiper'
// import './components/wx-swiper-item'
// import './components/wx-switch'
// import './components/wx-text'
// import './components/wx-textarea'
// import './components/wx-toast'
// import './components/wx-video'
// import './components/wx-view'
// import './components/wx-contact-button'
// import './components/wx-rich-text'
// import './components/wx-web-view'
// import ContactButton from './wx-contact-button'

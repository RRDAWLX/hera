/**
 * 样式相关工具
 * @module
 */

/**
 * 转换过渡样式描述对象。
 * @param {Object} params 过渡样式描述对象
 * @param {Object[]} [params.animates]
 * @param {String} [params.animates[0].type] 过渡属性类型，style、rotate、scale……
 * @param {String} [params.animates[0].args] 过渡属性值。
 * 如果 type 为 style，则 args[0] 为属性名，后续为属性值；
 * 如果 type 不是 style，则 args 中保存的是属性值。
 * @param {Object} [params.option]
 * @param {String} [params.option.transformOrigin]
 * @param {Object} [params.option.transition]
 * @param {Number} params.option.transition.duration 过渡毫秒数
 * @param {String} params.option.transition.timingFunction 过渡动画计时函数
 * @param {Number} params.option.transition.delay 过渡开始时的延迟毫秒数
 * @return {Object} {
 *  transformOrigin: String,
 *  transitionProperty?: String,
 *  transform: String,
 *  transition: String,
 *  style?: Object
 * }
 * @example
  animationToStyle({}) =>
  {
    "transformOrigin": "",
    "transform": "",
    "transition": ""
  }
 * @example
  animationToStyle({
    animates: [
      {
        type: 'style',
        args: ['width', '100px'],
      },
      {
        type: 'skew',
        args: ['30deg', 45],
      },
    ],
    option: {
      transformOrigin: '50% 50% 0',
      transition: {
        duration: 2,
        timingFunction: 'linear',
        delay: 1,
      },
    },
  }) =>
  {
    "style": {
      "width": "100px"
    },
    "transformOrigin": "50% 50% 0",
    "transform": "skew(30deg,45deg)",
    "transitionProperty": "transform,width",
    "transition": "2ms linear 1ms"
  }
 */
export function animationToStyle (params) {
  let animates = params.animates
  let opts = params.option || {}
  let transformOrigin = opts.transformOrigin
  let transition = opts.transition

  if (transition === undefined || animates === undefined) {
    return {
      transition: '',
      transformOrigin: '',
      transform: ''
    }
  }

  let transform = animates
    .filter(animate => animate.type !== 'style')
    .map(({ type, args }) => {
      switch (type) {
        case 'matrix':
          return `matrix(${args.join(',')})`

        case 'matrix3d':
          return `matrix3d(${args.join(',')})`

        case 'rotate':
          return `rotate(${addDegSuffix(args[0])})`

        case 'rotate3d':
          args[3] = addDegSuffix(args[3])
          return `rotate3d(${args.join(',')})`

        case 'rotateX':
          return `rotateX(${addDegSuffix(args[0])})`

        case 'rotateY':
          return `rotateY(${addDegSuffix(args[0])})`

        case 'rotateZ':
          return `rotateZ(${addDegSuffix(args[0])})`

        case 'scale':
          return `scale(${args.join(',')})`

        case 'scale3d':
          return `scale3d(${args.join(',')})`

        case 'scaleX':
          return `scaleX(${args[0]})`

        case 'scaleY':
          return `scaleY(${args[0]})`

        case 'scaleZ':
          return `scaleZ(${args[0]})`

        case 'translate':
          return `translate(${args.map(addPXSuffix).join(',')})`

        case 'translate3d':
          return `translate3d(${args.map(addPXSuffix).join(',')})`

        case 'translateX':
          return `translateX(${addPXSuffix(args[0])})`

        case 'translateY':
          return `translateY(${addPXSuffix(args[0])})`

        case 'translateZ':
          return `translateZ(${addPXSuffix(args[0])})`

        case 'skew':
          return `skew(${args.map(addDegSuffix).join(',')})`

        case 'skewX':
          return `skewX(${addDegSuffix(args[0])})`

        case 'skewY':
          return `skewY(${addDegSuffix(args[0])})`

        default:
          return ''
      }
    })
    .join(' ')

  let style = animates
    .filter(animate => animate.type === 'style')
    .reduce((style, { args }) => {
      style[args[0]] = args[1]
      return style
    }, {})

  let transitionProperty = ['transform'].concat(Object.keys(style)).join(',')

  let { duration, timingFunction, delay } = transition
  return {
    transition: `${duration}ms ${timingFunction} ${delay}ms`,
    transitionProperty,
    transformOrigin,
    transform,
    style
  }
}

/**
 * 如果入参是个数字，将一个数字转换为像素字符串。
 * @param {*} num 像素值
 * @return {*} 像素字符串
 * @private
 * @example
 * addDegSuffix(12) => '12px'
 */
function addPXSuffix (num) {
  return typeof num === 'number' ? `${num}px` : num
}

/**
 * 如果入参是个数字，将一个数字转换为角度字符串。
 * @param {*} num 角度值
 * @return {*} 角度字符串
 * @private
 * @example
 * addDegSuffix(30) => '30deg'
 */
function addDegSuffix (num) {
  return typeof num === 'number' ? `${num}deg` : num
}

export default {
  animationToStyle
}

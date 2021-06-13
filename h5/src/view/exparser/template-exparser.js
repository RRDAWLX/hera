/**
 * @module
 */

import Event from './event'

/**
 * 属性计算
 * @param {Element} ele
 * @param {Object} data 数据对象
 * @param {Object} methods
 * @param {Object} opt
 * @param {String[]} opt.callee 方法入参名列表
 * @param {String} opt.prop 属性名或方法名
 * @param {Boolean} opt.not 是否取逻辑非值
 * @return {*}
 * @private
 **/
function propCalculate (ele, data, methods, opt) {
  // 解析模板
  let res = ''

  if (opt.callee) {
    let args = opt.callee.map(key => data[key])

    res = Event.safeCallback(
      'TemplateExparser Method',
      methods[opt.prop],
      ele,
      args
    )

    if (res === undefined || res === null) {
      res = ''
    }
  } else {
    res = data[opt.prop]
  }

  return opt.not ? !res : res
}

/**
 * 模板解析器???
 **/
class TemplateExparser {
  /**
   * 根据模板解析生成的普通字符串和表达式字符串交替的字符串数组。
   * 索引偶数项为普通字符串，索引奇数项为表达式对象。
   * @type {(String[]|Object[])}
   * @example
   * [
   *   'str1',
   *   {
   *      not: true, // 是否为逻辑非表达式
   *      prop: 'propNameOrMethodName', // 表达式使用的属性名或方法名
   *      callee: ['prop1', 'prop2'], // 表达式中使用到的属性名
   *   }
   * ]
   **/
  _slices

  /**
   * 表达式用用到的方法
   * @type {Object.<String, Function>}
   **/
  _methods

  /**
   * 模板中使用到的属性名列表
   * {String[]}
   **/
  bindedProps

  /**
   * 模板字符串是否只是一个表达式，如 '{{ exp }}'
   * @type {Boolean}
   **/
  isSingleletiable

  /**
   * @param {String} tmplStr 模板字符串
   * @param {Object.<String, Function>} methods
   **/
  constructor (tmplStr, methods) {
    // 分割模板字符串，生成普通字符串和表达式字符串交替的字符串数组。
    // "str1 {{ exp1 }} str2 {{ exp2}}" =>
    // ["str1 ", " exp1 ", " str2 ", " exp2", ""]
    // 表达式 exp 只能是单个函数调用或属性引用
    let slices = tmplStr.split(/\{\{(.*?)\}\}/g)
    let boundPropList = []

    // 解析表达式字符串
    for (let idx = 0; idx < slices.length; idx++) {
      if (idx % 2) {
        // 匹配属性或方法：“prop”、“!prop”、“method(arg1)”、“!method(arg1, arg2)”……
        // 感觉这个解析正则有问题，不能匹配 ’func()‘ 这种情况。
        let methodSlices = slices[idx].match(
          /^(!?)([-_a-zA-Z0-9]+)(?:\((([-_a-zA-Z0-9]+)(,[-_a-zA-Z0-9]+)*)\))?$/
        ) || [false, '']
        let args = null

        if (methodSlices[3]) {
          args = methodSlices[3].split(',')

          args.forEach(arg => {
            if (!boundPropList.includes(arg)) {
              boundPropList.push(arg)
            }
          })
        } else if (!boundPropList.includes(methodSlices[2])) {
          boundPropList.push(methodSlices[2])
        }

        slices[idx] = {
          not: !!methodSlices[1], // 是否取逻辑非
          prop: methodSlices[2], // 方法名或属性名
          callee: args // 参数
        }
      }
    }

    this.bindedProps = boundPropList
    this.isSingleletiable =
      slices.length === 3 && slices[0] === '' && slices[2] === ''
    this._slices = slices
    this._methods = methods
  }

  /**
   * 解析模板返回结果
   * @param {Element} ele
   * @param {Object} data
   * @return {String} 返回 html 字符串？？？
   **/
  calculate (ele, data) {
    // 解析模板返回结果
    let slices = this._slices
    let value = ''

    if (this.isSingleletiable) {
      value = propCalculate(ele, data, this._methods, slices[1])
    } else {
      slices.forEach((slice, i) => {
        if (i % 2) {
          // 表达式部分
          value += propCalculate(ele, data, this._methods, slice)
        } else {
          value += slice
        }
      })
    }

    return value
  }
}

export default TemplateExparser

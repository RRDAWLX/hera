/**
 * 管理 data 与绑定元素的更新
 * @class
 */
class BoundProps {
  /** 创建 BoundProps 实例 */
  static create () {
    return new BoundProps()
  }

  /**
   *
   * @type {Object}
   */
  #bindings = Object.create(null)

  /**
   * 添加属性？？？
   * @param {Object} exp
   * @param {String[]} exp.bindedProps 属性名数组？
   * @param {Function} exp.calculate
   * @param {Element} targetElem
   * @param {Unknown} targetProp
   * @param {Function} updateFunc
   */
  add (exp, targetElem, targetProp, updateFunc) {
    let propDes = { exp, targetElem, targetProp, updateFunc }
    let _bindings = this.#bindings
    let bindedProps = exp.bindedProps

    for (let propName of bindedProps) {
      _bindings[propName] = _bindings[propName] || []
      _bindings[propName].push(propDes)
    }
  }

  /**
   * 更新变量 propName 相关联的元素 ele 属性？？？
   * @param {Element} ele
   * @param {Object} propData
   * @param {String} propName
   */
  update (ele, propData, propName) {
    let _binding = this.#bindings[propName]

    if (_binding) {
      for (let { exp, targetElem, targetProp, updateFunc } of _binding) {
        updateFunc(targetElem, targetProp, exp.calculate(ele, propData))
      }
    }
  }
}

export default BoundProps

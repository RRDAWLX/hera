import Event from './event'

// 生命周期方法名
const cycles = ['created', 'attached', 'detached']
let uid = 1

/**
 * Behavior
 */
class Behavior {
  /**
   * 已注册的 behavior
   * @type {Object.<String, Behavior>}
   */
  static list = Object.create(null)

  /** 创建 BoundProps 实例 */
  static create (opts) {
    return new Behavior(opts)
  }

  /**
   * behavior名称
   * @type {String}
   */
  is = ''
  /**
   * behavior 注册 ID
   * @type {Behavior[]}
   */
  #id = String(uid++)
  /** @type {String} */
  template = ''
  /** @type {Object} */
  properties = Object.create(null)
  /** @type {Object} */
  methods = Object.create(null)
  /**
   * @type {Object}
   * @example
   * {
   *   // 'event': 'method', 根元素上绑定的事件。
   *   'click': 'handleClick',
   *   // 'id.event': 'method', id 值为 “id” 的元素上绑定的事件。
   *   'middle.tap': 'handleMiddleTap',
   * }
   */
  listeners = Object.create(null)
  /** @type {Behavior[]} */
  ancestors = []

  /**
   * @param {Object} opts 参数选项
   * @param {String} [opts.is]
   * @param {String} [opts.template]
   * @param {(Behavior[]|String[])} [opts.behaviors]
   * @param {Object} [opts.properties]
   * @param {Object} [opts.listeners]
   * @param {Function} [opts.*] 各类生命周期方法和其他方法
   */
  constructor (opts) {
    this.is = opts.is || this.is
    Behavior.list[this.is] = this
    this.template = opts.template

    // 复制 opts.behaviors 中各 behavior 的 properties、methods、ancestors
    // opts.behaviors?.forEach?.(...) 编辑器暂不支持
    if (Array.isArray(opts.behaviors)) {
      opts.behaviors.forEach(behavior => {
        if (typeof behavior === 'string') {
          behavior = Behavior.list[behavior]
        }

        Object.assign(this.properties, behavior.properties)
        Object.assign(this.methods, behavior.methods)

        for (let ancestor of behavior.ancestors) {
          if (!this.ancestors.includes(ancestor)) {
            this.ancestors.push(ancestor)
          }
        }
      })
    }

    // 最后再将当前 behavior 放入 ancestors 中
    this.ancestors.push(this)
    // 复制 opts.properties
    Object.assign(this.properties, opts.properties)
    // 复制 opts.listeners
    Object.assign(this.listeners, opts.listeners)

    // 复制 opts 中的各类方法和生命周期方法。
    Object.entries(opts).forEach(([key, value]) => {
      if (typeof value === 'function') {
        if (cycles.includes(key)) {
          this[key] = value
        } else {
          this.methods[key] = value
        }
      }
    })
  }

  /**
   * 判断当前 behavior 是否已继承目标 behavior。
   * @param {String} behaviorName 目标 behavior 名
   * @return {Boolean}
   */
  hasBehavior (behaviorName) {
    return this.ancestors.some(behavior => behavior.is === behaviorName)
  }

  /**
   * 获取所有 listener
   * @return {Object}
   */
  getAllListeners () {
    let obj = Object.create(null)

    for (let { listeners } of this.ancestors) {
      for (let key in listeners) {
        if (obj[key]) {
          obj[key].push(listeners[key])
        } else {
          obj[key] = [listeners[key]]
        }
      }
    }
  }

  /**
   * 获取所有生命周期方法
   * @return {Object.<String, Event>}
   */
  getAllLifeTimeFuncs () {
    let obj = Object.create(null)

    for (let cycle of cycles) {
      let event = (obj[cycle] = new Event('Lifetime Method'))

      for (let behavior of this.ancestors) {
        if (behavior[cycle]) {
          event.add(behavior[cycle])
        }
      }
    }

    return obj
  }
}

export default Behavior

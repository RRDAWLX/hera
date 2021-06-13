import Event from './event'

/**
 * 监视器
 */
class Observer {
  static create (...args) {
    return new Observer(...args)
  }

  /**
   * 给以目标元素为根元素的树上的所有元素的 __subtreeObserversCount 属性加上指定值。
   * @param {Element} ele 目标元素
   * @param {Number} count 指定值
   */
  static updateSubtreeCaches (ele, count) {
    ele.__subtreeObserversCount += count

    for (let child of ele.childNodes) {
      this.updateSubtreeCaches(child, count)
    }
  }

  /**
   * 调用指定元素及其祖先元素上的所有 Observer ？？?
   * @param {Element} ele
   * @param {String} observerName __propObservers、__childObservers、__textObservers
   * @param {*} opt 回调函数入参
   **/
  static callObservers (ele, observerName, opt) {
    do {
      ele[observerName] && ele[observerName].call(ele, [opt])
      ele = ele.parentNode
    } while (ele && ele.__subtreeObserversCount)
  }

  /**
   * 回调函数
   * @type {Function}
   **/
  #cb = null

  /**
   * { funcArr: Event, id: Number, subtree?: Element }
   * @type {Object[]}
   **/
  #binded = []

  /**
   * @param {Function} cb 回调函数
   **/
  constructor (cb) {
    this.#cb = cb
  }

  /**
   *
   * @param {Object} opt
   * @param {Observer} opt.target
   **/
  #noSubtreeCb (opt) {
    if (opt.target === this) {
      this.#cb(opt)
    }
  }

  /**
   * ???
   * @param {Element} ele
   * @param {Object} [opt={}]
   * @param {Unknown} [opt.subtree]
   * @param {Unknown} [opt.properties]
   * @param {Unknown} [opt.childList]
   * @param {Unknown} [opt.characterData]
   **/
  observe (ele, opt = {}) {
    let count = 0
    let cb = opt.subtree ? this.#cb : this.#noSubtreeCb // 是否对子节点observe

    if (opt.properties) {
      if (!ele.__propObservers) {
        // element prop
        ele.__propObservers = new Event('Observer Callback')
      }

      this.#binded.push({
        funcArr: ele.__propObservers,
        id: ele.__propObservers.add(cb),
        subtree: opt.subtree ? ele : null,
      })
      count++
    }

    if (opt.childList) {
      if (!ele.__childObservers) {
        ele.__childObservers = new Event('Observer Callback')
      }

      this.#binded.push({
        funcArr: ele.__childObservers,
        id: ele.__childObservers.add(cb),
        subtree: opt.subtree ? ele : null
      })
      count++
    }

    if (opt.characterData) {
      if (!ele.__textObservers) {
        ele.__textObservers = new Event('Observer Callback')
      }

      this.#binded.push({
        funcArr: ele.__textObservers,
        id: ele.__textObservers.add(cb),
        subtree: opt.subtree ? ele : null
      })
      count++
    }

    if (opt.subtree) {
      Observer.updateSubtreeCaches(ele, count)
    }
  }

  /**
   * 清空当前 observer 的监视
   **/
  disconnect () {
    for (let { funcArr, id, subtree } of this.#binded) {
      funcArr.remove(id)

      if (subtree) {
        Observer.updateSubtreeCaches(subtree, -1)
      }
    }

    this.#binded = []
  }
}

export default Observer

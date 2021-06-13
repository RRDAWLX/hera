/**
 * 虚拟 dom 相关常量和枚举。
 * @module
 **/
export default {
  PATCH_TYPE: {
    NONE: 0,
    TEXT: 1,
    VNODE: 2,
    PROPS: 3,
    REORDER: 4,
    INSERT: 5,
    REMOVE: 6
  },
  WX_KEY: 'wxKey',
  ATTRIBUTE_NAME: ['class', 'style'],
  RPX_RATE: 20,
  // TODO: 与 view/common.js 中重复
  BASE_DEVICE_WIDTH: 750,
  INLINE_STYLE: ['placeholderStyle', 'hoverStyle', 'style']
}

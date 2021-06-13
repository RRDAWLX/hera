/**
 * 属性名格式转换。
 * @module
 **/

// TODO：公用 cache 可能错在 bug。
const cache = {}
const regexDict = {
  dashToCamel: /-[a-z]/g,
  camelToDash: /([A-Z])/g
}

/**
 * 将中划线式属性名转为驼峰式。
 * @param {String} str
 * @return {String}
 * @static
 * @example
 * dashToCamelCase('prop-name') => 'propName'
 **/
const dashToCamelCase = function (str) {
  if (cache[str]) {
    return cache[str]
  } else {
    if (str.indexOf('-') <= 0) {
      cache[str] = str
    } else {
      cache[str] = str.replace(regexDict.dashToCamel, function (match) {
        return match[1].toUpperCase()
      })
    }
    return cache[str]
  }
}

/**
 * 将驼峰式属性名转为中划线式。
 * @param {String} str
 * @return {String}
 * @static
 * @example
 * camelToDashCase('propName') => 'prop-name'
 **/
const camelToDashCase = function (str) {
  return (
    cache[str] ||
    (cache[str] = str.replace(regexDict.camelToDash, '-$1').toLowerCase())
  )
}

export default {
  dashToCamelCase,
  camelToDashCase
}

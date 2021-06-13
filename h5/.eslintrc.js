module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    es2021: true // 支持最新 es 语法和接口
  },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module' // 支持 es module 模式
  },
  globals: {
    HeraJSCore: 'readonly'
  },
  /*
  "off" 或 0 - 关闭规则
  "warn" 或 1 - 开启规则，使用警告级别的错误：warn (不会导致程序退出)
  "error" 或 2 - 开启规则，使用错误级别的错误：error (当被触发的时候，程序会退出)
  */
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'no-console': 'off',
    'linebreak-style': 'off',
    // 'no-warning-comments': 'error',
    'space-before-function-paren': ['error', 'always'],
    'space-before-blocks': ['error', 'always']
  }
}

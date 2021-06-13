// 逻辑层框架的入口文件 会整体在 ./template/service.html 中加载
import './common/globalDefined'

import './css/index.css'

// bridge 里面主要是不同平台的bridge的实现
import './common/servicebridge'

// reporter 里面主要是上报的封装
import './common/reporter'

// api 
// 1. 提供运行时的wx对象，封装了大量的bridge调用
// 2. 和bridge通信的入口
import './service/api'

// engine 逻辑层的engine， pageHolder appHolder
// 主要是 1. 暴露出来 App Page两个方法
// 2. 定义了几个钩子，比如onAppRoute onPullDownRefresh onShareAppMessage
// 备注： 最重要的是onAppRoute，负责处理页面
import './service/engine'

// amdEngine 是提供了amd模式的加载，主要是 给小程序打包的service集合业务代码使用
import './service/amdEngine'

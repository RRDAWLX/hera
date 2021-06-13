/**
 * Created by pengguanfa on 2017/10/25.
 * 扩展api配置
 */
window.HeraConf = {{= _.conf}} // eslint-disable-line
window.HeraConf && window.HeraConf.extApi && (window.HeraExtApiConf = window.HeraConf.extApi)

// 浏览器专用入口文件 - 仅用于 UMD 格式
import { Store, interceptor, JsonAdapter } from './store';
import browserImpl from './store.browser';

// 创建浏览器专用的 JsLiteRest 对象
const JsLiteRest = {
  async driver() {
    return await browserImpl.driver();
  },

  async create(data?: any, options?: import('./store').StoreOptions) {
    return await browserImpl.create(data, options);
  },

  // 直接暴露 Store 类和拦截器
  Store,
  interceptor,
  JsonAdapter,

  // 浏览器环境下的额外属性
  get lib() {
    return (browserImpl as any).lib;
  },

  // 导出便利函数
  createBrowserStore: async function(data?: any, options?: import('./store').StoreOptions) {
    return await browserImpl.create(data, options);
  }
};

export default JsLiteRest;
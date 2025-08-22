// 主入口文件，用于生成统一的类型定义
export * from './store';

// 根据环境导出不同的 JsLiteRest 实现
declare const JsLiteRest: {
  /** 获取底层存储驱动程序名称 */
  driver(): Promise<string>;
  /** 创建 Store 实例 */
  create(data?: any, options?: import('./store').StoreOptions): Promise<import('./store').Store>;
  /** Store 类 */
  Store: typeof import('./store').Store;
  /** 内置拦截器 */
  interceptor: {
    lite: import('./store').MiddlewareFunction;
  };
  /** 浏览器环境下的额外属性 */
  lib?: {
    localforage: any;
  };
};

export default JsLiteRest;

// 导出便利函数
/** 创建 Node.js 环境的 Store 实例 */
export declare function createNodeStore(data?: any, options?: import('./store').StoreOptions): Promise<import('./store').Store>;

/** 创建浏览器环境的 Store 实例 */
export declare function createBrowserStore(data?: any, options?: import('./store').StoreOptions): Promise<import('./store').Store>;
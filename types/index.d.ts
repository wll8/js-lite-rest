// TypeScript definitions for js-lite-rest

/**
 * Store 配置选项
 */
export interface StoreOptions {
  /** ID 键后缀，默认为 'Id' */
  idKeySuffix?: string;
  /** 保存路径，Node.js 中为文件路径，浏览器中为 localStorage key */
  savePath?: string;
  /** 加载数据的函数 */
  load?: (key: string) => Promise<any>;
  /** 保存数据的函数 */
  save?: (key: string, data: any) => Promise<void>;
  /** 自定义适配器 */
  adapter?: Adapter;
}

/**
 * 适配器接口
 */
export interface Adapter {
  /** GET 请求处理 */
  get(path: string, query?: any): Promise<any>;
  /** POST 请求处理 */
  post(path: string, data?: any): Promise<any>;
  /** PUT 请求处理 */
  put(path: string, data?: any): Promise<any>;
  /** DELETE 请求处理 */
  delete(path: string): Promise<any>;
  /** PATCH 请求处理 */
  patch?(path: string, data?: any): Promise<any>;
  /** HEAD 请求处理 */
  head?(path: string): Promise<any>;
  /** OPTIONS 请求处理 */
  options?(path: string): Promise<any>;
  /** 保存数据 */
  save?(): Promise<void>;
}

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  method: string;
  path: string;
  data?: any;
  query?: any;
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: (result?: any) => Promise<any>,
  options: StoreOptions
) => Promise<any>;

/**
 * JSON 适配器类
 */
export declare class JsonAdapter implements Adapter {
  constructor(data?: any, options?: StoreOptions);
  
  get(path: string, query?: any): Promise<any>;
  post(path: string, data?: any): Promise<any>;
  put(path: string, data?: any): Promise<any>;
  delete(path: string): Promise<any>;
  patch(path: string, data?: any): Promise<any>;
  head(path: string): Promise<any>;
  options(path: string): Promise<any>;
  save(): Promise<void>;
}

/**
 * Store 主类
 */
export declare class Store {
  constructor(data?: any, options?: StoreOptions);
  
  /** 静态方法用于异步创建 Store 实例 */
  static create(data?: any, options?: StoreOptions): Promise<Store>;
  
  /** 添加中间件 */
  use(middleware: MiddlewareFunction): Store;
  
  /** GET 请求 */
  get(path: string, query?: any): Promise<any>;
  
  /** POST 请求 */
  post(path: string, data?: any): Promise<any>;
  
  /** PUT 请求 */
  put(path: string, data?: any): Promise<any>;
  
  /** DELETE 请求 */
  delete(path: string): Promise<any>;
  
  /** PATCH 请求 */
  patch(path: string, data?: any): Promise<any>;
  
  /** HEAD 请求 */
  head(path: string): Promise<any>;
  
  /** OPTIONS 请求 */
  options(path: string): Promise<any>;
}

/** 创建 Node.js 环境的 Store 实例 */
declare function createNodeStore(data?: any, options?: StoreOptions): Promise<Store>;

/** 创建浏览器环境的 Store 实例 */
declare function createBrowserStore(data?: any, options?: StoreOptions): Promise<Store>;

// 默认导出（根据环境自动选择）
declare const createStore: typeof createNodeStore | typeof createBrowserStore;
export default createStore;

// 具名导出
export { createNodeStore, createBrowserStore };

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
  /** 是否覆盖已有数据，默认为 false（不覆盖） */
  overwrite?: boolean;
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
 * KV 模式 API 接口
 */
export interface KVApi {
  /** 获取值 */
  get(key: string, defaultValue?: any): Promise<any>;
  /** 设置值 */
  set(key: string, value: any): Promise<any>;
  /** 删除键 */
  delete(key: string): Promise<any>;
}

/**
 * Info 模式 API 接口
 */
export interface InfoApi {
  /** 获取所有表名（数组类型的键） */
  getTables(): Promise<string[]>;
  /** 获取存储空间占用大小（字节） */
  getStorageSize(): Promise<number>;
  /** 获取存储空间剩余大小（字节），文件存储返回 -1 */
  getStorageFreeSize(): Promise<number>;
}

/**
 * Store 主类
 */
export declare class Store {
  constructor(data?: any, options?: StoreOptions);
  
  /** 静态方法用于异步创建 Store 实例 */
  static create(data?: any, options?: StoreOptions): Promise<Store>;
  
  /** KV 模式 API */
  kv: KVApi;
  
  /** Info 模式 API */
  info: InfoApi;
  
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

/**
 * JsLiteRest 主对象接口
 */
export interface JsLiteRestInterface {
  /** 获取底层存储驱动程序名称 */
  driver(): Promise<string>;
  /** 创建 Store 实例 */
  create(data?: any, options?: StoreOptions): Promise<Store>;
  /** Store 类 */
  Store: typeof Store;
  /** 内置拦截器 */
  interceptor: {
    lite: MiddlewareFunction;
  };
}

/** 创建 Node.js 环境的 Store 实例 */
declare function createNodeStore(data?: any, options?: StoreOptions): Promise<Store>;

/** 创建浏览器环境的 Store 实例 */
declare function createBrowserStore(data?: any, options?: StoreOptions): Promise<Store>;

// 默认导出 JsLiteRest 对象
declare const JsLiteRest: JsLiteRestInterface;
export default JsLiteRest;

// 具名导出
export { createNodeStore, createBrowserStore, Store, JsonAdapter };

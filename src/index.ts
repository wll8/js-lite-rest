// Node.js 入口：构建为 dist/js-lite-rest.mjs / .cjs
// 浏览器请使用 browser 条件导出的 dist/js-lite-rest.browser.mjs 或 UMD 版本，
// 因此本入口静态引入 Node 实现（文件存储），不打包浏览器实现（localforage）。
// Store / interceptor / JsonAdapter 与运行环境无关，统一以同步形态导出。
import { Store, interceptor, JsonAdapter, DataSchema, StoreOptions } from './store';
import nodeImpl from './store.node';

const JsLiteRest = {
  async driver() {
    return nodeImpl.driver();
  },

  async create<T extends DataSchema = DataSchema>(
    data?: T | string,
    options?: Partial<StoreOptions>
  ) {
    return nodeImpl.create<T>(data, options);
  },

  Store,
  interceptor,
  JsonAdapter
};

export default JsLiteRest;

// 导出类型，方便用户使用
export type {
  DataSchema,
  Store,
  StoreOptions,
  QueryParams,
  Entity,
  Table,
  DatabaseSchema,
  ApiResponse,
  PaginatedResponse,
  MiddlewareFunction
} from './store';

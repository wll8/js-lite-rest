import { Store, StoreOptions, DataSchema, interceptor } from './store';

// 检测环境并动态选择实现
async function getJsLiteRest() {
  if (typeof window === 'undefined') {
    // Node.js 环境
    const nodeModule = await import('./store.node');
    return nodeModule.default;
  } else {
    // 浏览器环境
    const browserModule = await import('./store.browser');
    return browserModule.default;
  }
}

// 创建延迟加载的 JsLiteRest 对象
const JsLiteRest = {
  async driver() {
    const impl = await getJsLiteRest();
    return impl.driver();
  },

  async create<T extends DataSchema = DataSchema>(
    data?: T,
    options?: StoreOptions
  ): Promise<Store<T>> {
    const impl = await getJsLiteRest();
    return impl.create(data, options) as Promise<Store<T>>;
  },

  // 暴露 Store 类和拦截器（通过 getter 实现延迟加载）
  get Store() {
    return import('./store').then(m => m.Store);
  },

  get interceptor() {
    return Promise.resolve(interceptor);
  },

  // 浏览器环境下的额外属性（延迟加载）
  get lib() {
    if (typeof window !== 'undefined') {
      return getJsLiteRest().then(impl => (impl as any).lib);
    }
    return undefined;
  }
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
  MiddlewareFunction,
  interceptor
} from './store';


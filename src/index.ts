// 统一入口文件 - 自动检测环境并使用相应实现
export * from './store';

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

  async create(data?: any, options?: import('./store').StoreOptions) {
    const impl = await getJsLiteRest();
    return impl.create(data, options);
  },

  // 暴露 Store 类和拦截器（通过 getter 实现延迟加载）
  get Store() {
    return import('./store').then(m => m.Store);
  },

  get interceptor() {
    return import('./store').then(m => m.interceptor);
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

// 导出便利函数
export async function createNodeStore(data?: any, options?: import('./store').StoreOptions) {
  const nodeModule = await import('./store.node');
  return nodeModule.default.create(data, options);
}

export async function createBrowserStore(data?: any, options?: import('./store').StoreOptions) {
  const browserModule = await import('./store.browser');
  return browserModule.default.create(data, options);
}
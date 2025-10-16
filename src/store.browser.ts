import { Store, interceptor, StoreOptions, DataSchema } from './store';
import localforage from 'localforage';

async function load(key: string): Promise<any> {
  const data = await localforage.getItem(key);
  return data || {};
}

async function save(key: string, data: any): Promise<void> {
  await localforage.setItem(key, data);
}

 // 创建函数
async function create<T extends DataSchema = DataSchema>(
  data: T | string = {} as T,
  opt: Partial<StoreOptions> = {}
): Promise<Store<T>> {
  const mergedOpt = { load, save, ...opt };
  // 暂时使用 any 兼容 Store.create 的现有签名，稍后会在 Store 中同步更新联合类型
  const store = await Store.create<T>(data as any, mergedOpt);
  store.use(interceptor.lite);
  return store;
}

// 导出 JsLiteRest 对象，包含 create 方法和其他功能
const JsLiteRest = {
  async driver(): Promise<string> {
    return localforage.driver();
  },
  lib: {
    localforage,
  },
  create,
  Store,
  interceptor
};

export default JsLiteRest;
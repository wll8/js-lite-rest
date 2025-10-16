import { Store, interceptor, StoreOptions, DataSchema } from './store';
import fs from 'fs/promises';
import { existsSync } from 'fs';

async function load(key: string): Promise<any> {
  if (!existsSync(key)) {
    await fs.writeFile(key, '{}', 'utf-8');
  }
  const content = await fs.readFile(key, 'utf-8');
  return JSON.parse(content);
}

async function save(key: string, data: any): Promise<void> {
  await fs.writeFile(key, JSON.stringify(data, null, 2), 'utf-8');
}

// 创建函数
async function create<T extends DataSchema = DataSchema>(
  data: T | string = {} as T,
  opt: Partial<StoreOptions> = {}
): Promise<Store<T>> {
  const mergedOpt = { load, save, ...opt };
  // 暂以 any 兼容 Store.create 现有签名；稍后将把 Store.create 的 data 参数改为 T | string
  const store = await Store.create<T>(data as any, mergedOpt);
  store.use(interceptor.lite);
  return store;
}

// 导出 JsLiteRest 对象，包含 create 方法和其他功能
const JsLiteRest = {
  async driver(): Promise<string> {
    return `file`;
  },
  create,
  Store,
  interceptor
};

export default JsLiteRest;
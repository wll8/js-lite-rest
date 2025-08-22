import { Store, interceptor, StoreOptions } from './store';
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
async function create(data: any = {}, opt: Partial<StoreOptions> = {}): Promise<Store> {
  const mergedOpt = { load, save, ...opt };
  const store = await Store.create(data, mergedOpt);
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
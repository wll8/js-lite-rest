import { Store, interceptor, JsonAdapter, StoreOptions, DataSchema } from './store';
import fs from 'fs/promises';
import { existsSync } from 'fs';

async function load(key: string): Promise<any> {
  if (!existsSync(key)) {
    await fs.writeFile(key, '{}', 'utf-8');
  }
  const content = await fs.readFile(key, 'utf-8');
  return JSON.parse(content);
}

// 创建函数
async function create<T extends DataSchema = DataSchema>(
  data: T | string = {} as T,
  opt: Partial<StoreOptions> = {}
): Promise<Store<T>> {
  // 序列化缩进：默认紧凑，indent 为正数时启用
  const indent = typeof opt.indent === 'number' && opt.indent > 0 ? opt.indent : undefined;
  const mergedOpt = {
    load,
    save: (key: string, d: any) => fs.writeFile(key, JSON.stringify(d, null, indent), 'utf-8'),
    ...opt,
  };
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
  interceptor,
  JsonAdapter
};

export default JsLiteRest;
import { Store, interceptor, JsonAdapter, StoreOptions, DataSchema } from './store';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// 创建函数
async function create<T extends DataSchema = DataSchema>(
  data: T | string = {} as T,
  opt: Partial<StoreOptions> = {}
): Promise<Store<T>> {
  // 序列化缩进：默认紧凑，indent 为正数时启用
  const indent = typeof opt.indent === 'number' && opt.indent > 0 ? opt.indent : undefined;
  // 每实例独立的文件指纹缓存：save 后记忆 mtime+size，load 时未变化直接
  // 返回缓存引用，跳过读盘与 JSON.parse。放 create 闭包内，多实例互不影响；
  // 外部直写文件会导致指纹变化而正常重读
  const stampCache = new Map<string, { stamp: string; data: any }>();
  const readStamp = (stat: { mtimeMs: number; size: number }) => `${stat.mtimeMs}:${stat.size}`;

  const mergedOpt = {
    load: async (key: string) => {
      if (!existsSync(key)) {
        await fs.writeFile(key, '{}', 'utf-8');
      }
      const stat = await fs.stat(key);
      const stamp = readStamp(stat);
      const cached = stampCache.get(key);
      if (cached && cached.stamp === stamp) {
        return cached.data;
      }
      const parsed = JSON.parse(await fs.readFile(key, 'utf-8'));
      stampCache.set(key, { stamp, data: parsed });
      return parsed;
    },
    save: async (key: string, d: any) => {
      await fs.writeFile(key, JSON.stringify(d, null, indent), 'utf-8');
      // 落盘后更新指纹，使下一次 load 能命中缓存
      const stat = await fs.stat(key);
      stampCache.set(key, { stamp: readStamp(stat), data: d });
    },
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
import { Store } from './store.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';

async function load(key) {
  if (!existsSync(key)) {
    await fs.writeFile(key, '{}', 'utf-8');
  }
  const content = await fs.readFile(key, 'utf-8');
  return JSON.parse(content);
}

async function save(key, data) {
  await fs.writeFile(key, JSON.stringify(data, null, 2), 'utf-8');
}

class JsStore extends Store {
  constructor(data = {}, opt = {savePath: `js-store.json`, load, save}) {
    super(data, opt);
  }

  // 静态方法用于异步创建 JsStore 实例
  static async create(data = {}, opt = {savePath: `js-store.json`, load, save}) {
    const store = new JsStore(data, opt);
    await store._ensureInitialized();
    return store;
  }
}

export default JsStore; 
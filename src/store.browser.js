import { Store, JsonAdapter } from './store.js';

async function load(key) {
  return JSON.parse(window.localStorage.getItem(key) || '{}');
}

async function save(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

class JsStore extends Store {
  constructor(data = {}, opt = {savePath: `js-store`, load, save}) {
    super(data, opt);
  }

  // 静态方法用于异步创建 JsStore 实例
  static async create(data = {}, opt = {savePath: `js-store`, load, save}) {
    const store = new JsStore(data, opt);
    await store._ensureInitialized();
    return store;
  }
}


export default JsStore; 
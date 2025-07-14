import { Store, interceptor } from './store.js';

async function load(key) {
  return JSON.parse(window.localStorage.getItem(key) || '{}');
}

async function save(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

// 创建函数
async function create(data = {}, opt = {}) {
  const mergedOpt = { load, save, ...opt };
  const store = await Store.create(data, mergedOpt);
  store.use(interceptor.lite);
  return store
}

// 导出 JsLiteRest 对象，包含 create 方法和其他功能
const JsLiteRest = {
  create,
  Store,
  interceptor
};

export default JsLiteRest;
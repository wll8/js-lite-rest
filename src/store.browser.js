import { Store, interceptor } from './store.js';
import localforage from 'localforage';

async function load(key) {
  const data = await localforage.getItem(key);
  return data || {};
}

async function save(key, data) {
  await localforage.setItem(key, data);
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
  async driver(){
    return localforage.driver()
  },
  lib: {
    localforage,
  },
  create,
  Store,
  interceptor
};

export default JsLiteRest;
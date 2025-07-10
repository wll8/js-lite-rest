import { Store } from './store.js';

async function load(key) {
  return JSON.parse(window.localStorage.getItem(key) || '{}');
}

async function save(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

// 直接导出创建函数，更简洁
export default async function create(data = {}, opt = {}) {
  const mergedOpt = { load, save, ...opt };
  return await Store.create(data, mergedOpt);
}
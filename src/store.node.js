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

// 直接导出创建函数，更简洁
export default async function create(data = {}, opt = {}) {
  const mergedOpt = { load, save, ...opt };
  return await Store.create(data, mergedOpt);
}
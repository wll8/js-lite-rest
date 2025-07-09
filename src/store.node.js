import { Store, JsonAdapter } from './store.js';
import fs from 'fs';

function load(key) {
  if (!fs.existsSync(key)) {
    fs.writeFileSync(key, '{}', 'utf-8');
  }
  return JSON.parse(fs.readFileSync(key, 'utf-8'));
}

function save(key, data) {
  fs.writeFileSync(key, JSON.stringify(data, null, 2), 'utf-8');
}

class NodeStore extends Store {
  constructor(data = `js-store.json`, opt = {}) {
    if (typeof data === 'object' && data !== null) {
      super(data, opt);
    } else {
      super(data, { ...opt, adapter: new JsonAdapter(data, { ...opt, load, save }) });
    }
  }
}

export default NodeStore; 
import { Store } from './store.js';
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

class JsStore extends Store {
  constructor(data = {}, opt = {savePath: `js-store.json`, load, save}) {
    super(data, opt);
  }
}

export default JsStore; 
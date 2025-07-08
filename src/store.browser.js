import { Store, JsonAdapter } from './store.js';

function load(key) {
  return JSON.parse(window.localStorage.getItem(key) || '{}');
}

function save(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

class BrowserStore extends Store {
  constructor(key, opt = {}) {
    super(key, { ...opt, adapter: new JsonAdapter(key, { ...opt, load, save }) });
  }
}

export default BrowserStore; 
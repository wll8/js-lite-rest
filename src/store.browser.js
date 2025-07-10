import { Store, JsonAdapter } from './store.js';

function load(key) {
  return JSON.parse(window.localStorage.getItem(key) || '{}');
}

function save(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

class JsStore extends Store {
  constructor(data = {}, opt = {savePath: `js-store`, load, save}) {
    super(data, opt);
  }
}


export default JsStore; 
// js-store 主类实现

function compose(middlewares, core, opt) {
  return function (args) {
    let index = -1;
    function dispatch(i, _args) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middlewares[i];
      if (i === middlewares.length) fn = core;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(_args, (res) => dispatch(i + 1, _args), opt));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0, args);
  };
}

export class Store {
  constructor(data, opt = {}) {
    this.opt = opt;
    this.adapter = opt.adapter ? opt.adapter : new JsonAdapter(data);
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  async _request(method, ...args) {
    const core = async (_args) => {
      const [method, path, ...restArgs] = _args;
      if (method === 'get') {
        return await this.adapter.get(path, ...restArgs);
      } else if (method === 'post') {
        return await this.adapter.post(path, ...restArgs);
      } else if (method === 'put') {
        return await this.adapter.put(path, ...restArgs);
      } else if (method === 'delete') {
        return await this.adapter.delete(path, ...restArgs);
      }
    };
    const fn = compose(this.middlewares, core, this.opt);
    return fn([method, ...args]);
  }

  get(path, query) {
    return this._request('get', path, query);
  }
  post(path, data) {
    return this._request('post', path, data);
  }
  put(path, data) {
    return this._request('put', path, data);
  }
  delete(path) {
    return this._request('delete', path);
  }
}

// 简单的 json 适配器，支持内存、localStorage、Node 文件
export class JsonAdapter {
  constructor(data) {
    this.env = this.detectEnv();
    if (typeof data === 'object' && data !== null) {
      this.data = data;
      this.mode = 'memory';
    } else if (typeof data === 'string') {
      this.key = data;
      if (this.env === 'node') {
        this.mode = 'file';
        this.filePath = data;
        this.fs = require('fs');
        if (!this.fs.existsSync(this.filePath)) {
          this.fs.writeFileSync(this.filePath, '{}', 'utf-8');
        }
        this.data = JSON.parse(this.fs.readFileSync(this.filePath, 'utf-8'));
      } else {
        this.mode = 'localStorage';
        this.data = JSON.parse(window.localStorage.getItem(this.key) || '{}');
      }
    } else if (data == null) {
      // 默认 key
      if (this.env === 'node') {
        this.mode = 'file';
        this.filePath = 'js-store.json';
        this.fs = require('fs');
        if (!this.fs.existsSync(this.filePath)) {
          this.fs.writeFileSync(this.filePath, '{}', 'utf-8');
        }
        this.data = JSON.parse(this.fs.readFileSync(this.filePath, 'utf-8'));
      } else {
        this.mode = 'localStorage';
        this.key = 'js-store';
        this.data = JSON.parse(window.localStorage.getItem(this.key) || '{}');
      }
    }
  }

  detectEnv() {
    if (typeof window !== 'undefined' && window.localStorage) return 'browser';
    if (typeof process !== 'undefined' && process.versions && process.versions.node) return 'node';
    return 'unknown';
  }

  save() {
    if (this.mode === 'file') {
      this.fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } else if (this.mode === 'localStorage') {
      window.localStorage.setItem(this.key, JSON.stringify(this.data));
    }
  }

  parsePath(path) {
    // "book/1" => ['book', '1']
    return path.split('/').filter(Boolean);
  }

  get(path, query) {
    const segs = this.parsePath(path);
    let cur = this.data;
    for (let i = 0; i < segs.length; i++) {
      if (Array.isArray(cur) && !isNaN(Number(segs[i]))) {
        // 如果当前是数组，且 segs[i] 是数字，则查找 id
        cur = cur.find(item => String(item.id) === segs[i]);
      } else {
        cur = cur[segs[i]];
      }
      if (cur == null) return null;
    }
    if (query && typeof cur === 'object' && Array.isArray(cur)) {
      // 简单过滤
      return cur.filter(item => {
        return Object.keys(query).every(k => item[k] === query[k]);
      });
    }
    return cur;
  }

  post(path, data) {
    const segs = this.parsePath(path);
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      if (!cur[segs[i]]) cur[segs[i]] = {};
      cur = cur[segs[i]];
    }
    const key = segs[segs.length - 1];
    if (!cur[key]) cur[key] = [];
    if (!Array.isArray(cur[key])) throw new Error('只能向数组添加');
    data.id = cur[key].length ? (cur[key][cur[key].length - 1].id + 1) : 1;
    cur[key].push(data);
    this.save();
    return data;
  }

  put(path, data) {
    const segs = this.parsePath(path);
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      cur = cur[segs[i]];
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素更新');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    cur[idx] = { ...cur[idx], ...data };
    this.save();
    return cur[idx];
  }

  delete(path) {
    const segs = this.parsePath(path);
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      cur = cur[segs[i]];
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素删除');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    const del = cur.splice(idx, 1)[0];
    this.save();
    return del;
  }
} 
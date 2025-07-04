// js-store 主类实现

export class Store {
  constructor(data, opt = {}) {
    this.opt = opt;
    this.interceptor = opt.interceptor || {};
    this.adapter = null;
    // 适配器选择
    if (opt.adapter) {
      this.adapter = opt.adapter;
    } else {
      this.adapter = new JsonAdapter(data);
    }
  }

  async get(path, query) {
    if (this.interceptor.beforeGet) {
      await this.interceptor.beforeGet(path, query);
    }
    const result = await this.adapter.get(path, query);
    if (this.interceptor.afterGet) {
      await this.interceptor.afterGet(path, query, result);
    }
    return result;
  }

  // 预留 post/put/delete
  async post(path, data) {
    if (this.interceptor.beforePost) {
      await this.interceptor.beforePost(path, data);
    }
    const result = await this.adapter.post(path, data);
    if (this.interceptor.afterPost) {
      await this.interceptor.afterPost(path, data, result);
    }
    return result;
  }

  async put(path, data) {
    if (this.interceptor.beforePut) {
      await this.interceptor.beforePut(path, data);
    }
    const result = await this.adapter.put(path, data);
    if (this.interceptor.afterPut) {
      await this.interceptor.afterPut(path, data, result);
    }
    return result;
  }

  async delete(path) {
    if (this.interceptor.beforeDelete) {
      await this.interceptor.beforeDelete(path);
    }
    const result = await this.adapter.delete(path);
    if (this.interceptor.afterDelete) {
      await this.interceptor.afterDelete(path, result);
    }
    return result;
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
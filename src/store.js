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
    
    // 定义支持的 HTTP 方法映射
    this.methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    
    // 自动生成 HTTP 方法
    this.methods.forEach(method => {
      this[method] = (path, ...args) => this._request(method, path, ...args);
    });
  }

  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  async _request(method, path, ...args) {
    const core = async (_args) => {
      const [method, path, ...restArgs] = _args;
      
      // 检查方法是否支持
      if (!this.methods.includes(method)) {
        throw new Error(`不支持的 HTTP 方法: ${method}`);
      }
      
      // 动态调用适配器方法
      if (typeof this.adapter[method] === 'function') {
        return await this.adapter[method](path, ...restArgs);
      } else {
        throw new Error(`适配器不支持 ${method} 方法`);
      }
    };
    
    const fn = compose(this.middlewares, core, this.opt);
    return fn([method, path, ...args]);
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
        cur = cur.find(item => String(item.id) === segs[i]);
      } else {
        cur = cur[segs[i]];
      }
      if (cur == null) return null;
    }
    if (query && typeof cur === 'object' && Array.isArray(cur)) {
      // 分离分页参数、排序参数和过滤参数
      const { _page, _limit, _sort, _order, ...filterQuery } = query;
      
      // 先进行过滤
      let filteredData = cur;
      if (Object.keys(filterQuery).length > 0) {
        filteredData = cur.filter(item => {
          return Object.keys(filterQuery).every(k => {
            let value = filterQuery[k];
            // 支持点语法
            const getDeepValue = (obj, path) => {
              return path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
            };
            const itemValue = getDeepValue(item, k);
            // 兼容 querystring 场景：如果 value 不是数组但实际是多个值，也转为数组
            if (!Array.isArray(value) && typeof value !== 'undefined' && value !== null && typeof value !== 'object') {
              // 处理 '1,2' 这种字符串
              if (typeof value === 'string' && value.includes(',')) {
                value = value.split(',');
              }
            }
            if (Array.isArray(value)) {
              return value.some(v => itemValue == v); // 宽松比较
            } else {
              return itemValue == value; // 宽松比较
            }
          });
        });
      }
      
      // 再进行排序
      if (_sort) {
        const sortFields = Array.isArray(_sort) ? _sort : _sort.split(',');
        const orderFields = _order ? (Array.isArray(_order) ? _order : _order.split(',')) : [];
        
        filteredData.sort((a, b) => {
          for (let i = 0; i < sortFields.length; i++) {
            const field = sortFields[i].trim();
            const order = orderFields[i] ? orderFields[i].trim().toLowerCase() : 'asc';
            
            // 支持点语法获取深层字段
            const getDeepValue = (obj, path) => {
              return path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
            };
            
            const aValue = getDeepValue(a, field);
            const bValue = getDeepValue(b, field);
            
            // 处理 null/undefined 值
            if (aValue == null && bValue == null) continue;
            if (aValue == null) return order === 'asc' ? -1 : 1;
            if (bValue == null) return order === 'asc' ? 1 : -1;
            
            // 数值比较
            if (typeof aValue === 'number' && typeof bValue === 'number') {
              if (aValue !== bValue) {
                return order === 'asc' ? aValue - bValue : bValue - aValue;
              }
            } else {
              // 字符串比较
              const aStr = String(aValue);
              const bStr = String(bValue);
              if (aStr !== bStr) {
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
              }
            }
          }
          return 0;
        });
      }
      
      // 最后进行分页
      if (_page || _limit) {
        const page = parseInt(_page) || 1;
        const limit = parseInt(_limit) || 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return filteredData.slice(start, end);
      }
      
      return filteredData;
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

  patch(path, data) {
    const segs = this.parsePath(path);
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      cur = cur[segs[i]];
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素 patch');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    cur[idx] = { ...cur[idx], ...data };
    this.save();
    return cur[idx];
  }
} 
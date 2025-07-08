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
    // 嵌套资源 GET /posts/1/comments
    if (segs.length === 3) {
      const [parentTable, parentId, childTable] = segs;
      if (this.data && this.data[childTable] && Array.isArray(this.data[childTable])) {
        const parentIdKey = parentTable + 'Id';
        return this.data[childTable].filter(item => String(item[parentIdKey]) === parentId);
      }
    }
    let cur = this.data;
    for (let i = 0; i < segs.length; i++) {
      if (Array.isArray(cur) && !isNaN(Number(segs[i]))) {
        cur = cur.find(item => String(item.id) === segs[i]);
      } else {
        cur = cur[segs[i]];
      }
      if (cur == null) return null;
    }
    if (query && typeof cur === 'object') {
      // 分离参数
      const { _page, _limit, _sort, _order, _start, _end, _embed, _expand, ...filterQuery } = query;
      let filteredData = cur;
      let isSingleObject = false;
      if (filteredData && !Array.isArray(filteredData)) {
        filteredData = [filteredData];
        isSingleObject = true;
      }
      // 全文检索
      if (typeof filterQuery._q === 'string' && filterQuery._q.length > 0) {
        const q = filterQuery._q.toLowerCase();
        delete filterQuery._q;
        const matchAnyField = (obj) => {
          if (obj == null) return false;
          if (typeof obj === 'object') {
            return Object.values(obj).some(v => matchAnyField(v));
          }
          return String(obj).toLowerCase().includes(q);
        };
        filteredData = filteredData.filter(item => matchAnyField(item));
      }
      // 过滤
      if (Object.keys(filterQuery).length > 0) {
        filteredData = filteredData.filter(item => {
          return Object.keys(filterQuery).every(k => {
            let value = filterQuery[k];
            const getDeepValue = (obj, path) => path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
            const fieldMatch = k.match(/^(.+?)(_gte|_lte|_ne|_like)$/);
            const fieldName = fieldMatch ? fieldMatch[1] : k;
            const operator = fieldMatch ? fieldMatch[2] : null;
            const itemValue = getDeepValue(item, fieldName);
            if (!Array.isArray(value) && typeof value !== 'undefined' && value !== null && typeof value !== 'object') {
              if (typeof value === 'string' && value.includes(',')) value = value.split(',');
            }
            if (operator === '_gte') return itemValue >= value;
            if (operator === '_lte') return itemValue <= value;
            if (operator === '_ne') return itemValue != value;
            if (operator === '_like') {
              if (typeof value === 'string' && value.includes('|')) {
                const patterns = value.split('|');
                return patterns.some(pattern => new RegExp(pattern, 'i').test(String(itemValue)));
              } else {
                return new RegExp(value, 'i').test(String(itemValue));
              }
            }
            if (Array.isArray(value)) return value.some(v => itemValue == v);
            return itemValue == value;
          });
        });
      }
      // _embed
      if (_embed && this.data) {
        const embedFields = Array.isArray(_embed) ? _embed : String(_embed).split(',');
        for (const embedField of embedFields) {
          const childArr = this.data[embedField];
          if (!Array.isArray(childArr)) continue;
          filteredData.forEach(item => {
            if (!item) return;
            const idKey = item.id;
            item[embedField] = childArr.filter(child => child[`${segs[0]}Id`] == idKey);
          });
        }
      }
      // _expand
      if (_expand && this.data) {
        const expandFields = Array.isArray(_expand) ? _expand : String(_expand).split(',');
        for (const expandField of expandFields) {
          const parentArr = this.data[expandField];
          if (!Array.isArray(parentArr)) continue;
          filteredData.forEach(item => {
            if (!item) return;
            const parent = parentArr.find(parent => parent.id == item[`${expandField}Id`]);
            if (parent) item[expandField] = parent;
          });
        }
      }
      // 只对数组做分页/排序/截取
      if (!isSingleObject) {
        // 排序
        if (_sort) {
          const sortFields = Array.isArray(_sort) ? _sort : _sort.split(',');
          const orderFields = _order ? (Array.isArray(_order) ? _order : _order.split(',')) : [];
          filteredData.sort((a, b) => {
            for (let i = 0; i < sortFields.length; i++) {
              const field = sortFields[i].trim();
              const order = orderFields[i] ? orderFields[i].trim().toLowerCase() : 'asc';
              const getDeepValue = (obj, path) => path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
              const aValue = getDeepValue(a, field);
              const bValue = getDeepValue(b, field);
              if (aValue == null && bValue == null) continue;
              if (aValue == null) return order === 'asc' ? -1 : 1;
              if (bValue == null) return order === 'asc' ? 1 : -1;
              if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (aValue !== bValue) return order === 'asc' ? aValue - bValue : bValue - aValue;
              } else {
                const aStr = String(aValue);
                const bStr = String(bValue);
                if (aStr !== bStr) return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
              }
            }
            return 0;
          });
        }
        // 截取
        if (_start !== undefined || _end !== undefined) {
          let start = _start !== undefined ? parseInt(_start) : 0;
          const end = _end !== undefined ? parseInt(_end) : undefined;
          if (start < 0) start = 0;
          if (_limit && _start !== undefined) {
            const limit = parseInt(_limit);
            filteredData = filteredData.slice(start, start + limit);
          } else {
            filteredData = filteredData.slice(start, end);
          }
        } else if (_page || _limit) {
          const page = parseInt(_page) || 1;
          const limit = parseInt(_limit) || 10;
          const start = (page - 1) * limit;
          const end = start + limit;
          filteredData = filteredData.slice(start, end);
        }
      }
      // 还原单对象
      if (isSingleObject) {
        return filteredData[0];
      }
      return filteredData;
    }
    return cur;
  }

  post(path, data) {
    const segs = this.parsePath(path);
    // 批量创建 /posts，body为数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      return data.map(item => {
        if (item.id !== undefined) return null;
        const newItem = { ...item };
        newItem.id = arr.length ? (arr[arr.length - 1].id + 1) : 1;
        arr.push(newItem);
        this.save();
        return newItem;
      });
    }
    // 嵌套资源 POST /posts/1/comments
    if (segs.length === 3) {
      const [parentTable, parentId, childTable] = segs;
      if (this.data && this.data[childTable] && Array.isArray(this.data[childTable])) {
        const parentIdKey = parentTable + 'Id';
        const newData = { ...data, [parentIdKey]: isNaN(Number(parentId)) ? parentId : Number(parentId) };
        // 自动分配 id
        const arr = this.data[childTable];
        newData.id = arr.length ? (arr[arr.length - 1].id + 1) : 1;
        arr.push(newData);
        this.save();
        return newData;
      }
    }
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
    // 批量全量修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      return data.map(item => {
        if (item.id === undefined) return null;
        const idx = arr.findIndex(x => String(x.id) === String(item.id));
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...item };
        this.save();
        return arr[idx];
      });
    }
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

  delete(path, query) {
    const segs = this.parsePath(path);
    // 批量删除 /posts?id=1&id=2
    if (segs.length === 1 && query && query.id && this.data && Array.isArray(this.data[segs[0]])) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      const arr = this.data[segs[0]];
      const result = ids.map(id => {
        const idx = arr.findIndex(item => String(item.id) === String(id));
        if (idx === -1) return null;
        const del = arr.splice(idx, 1)[0];
        this.save();
        return del;
      });
      return result;
    }
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
    // 批量部分修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      return data.map(item => {
        if (item.id === undefined) return null;
        const idx = arr.findIndex(x => String(x.id) === String(item.id));
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...item };
        this.save();
        return arr[idx];
      });
    }
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
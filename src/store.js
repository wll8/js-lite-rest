
function genId() {
  const currentId = getTimestampPlusId();
  return currentId.toString(36).toUpperCase();
}

function getTimestampPlusId(start = +new Date(2025, 4, 5)) {
  const currentTime = Date.now() - start;
  const lastId = globalThis[`lastId_${start}`];
  
  if (lastId === undefined) {
    // 首次调用，直接使用时间戳
    globalThis[`lastId_${start}`] = currentTime;
    return currentTime;
  } else {
    // 确保新ID既不小于当前时间戳，也大于上一个ID
    const nextId = Math.max(currentTime, lastId + 1);
    globalThis[`lastId_${start}`] = nextId;
    return nextId;
  }
}

function getBaseOpt(opt = {}) {
  const newOpt = {
    idKeySuffix: 'Id',
    savePath: typeof window === 'undefined' ? `js-lite-rest.json` : `js-lite-rest`,
    overwrite: false, // 默认不覆盖已有数据
    ...opt,
  }
  return newOpt
}

// HTTP 状态码常量
const HTTP_STATUS = {
  OK: { code: 200, message: '成功' },
  CREATED: { code: 201, message: '已创建' },
  NO_CONTENT: { code: 204, message: '无内容' },
  BAD_REQUEST: { code: 400, message: '请求无效' },
  SEE_OTHER: { code: 303, message: '部分成功' },
  NOT_FOUND: { code: 404, message: '未找到' },
  INTERNAL_SERVER_ERROR: { code: 500, message: '服务器内部错误' }
};

// 创建标准响应格式
function createResponse(code, data, message) {
  let realCode = code, realMessage = message;
  if (realMessage == null && typeof code === 'object' && code.code) {
    realMessage = code.message;
  }
  const codeNum = typeof realCode === 'object' ? realCode.code : realCode;
  return {
    code: codeNum,
    success: codeNum >= 200 && codeNum < 300,
    data,
    message: realMessage
  };
}

// 创建错误响应
function createErrorResponse(code, message, data = null) {
  const response = createResponse(code, data, message);
  response.success = false;
  const errorMessage = Array.isArray(message)
    ? (message.find(m => typeof m === 'string' && m) || response.message || 'Request failed')
    : (typeof message === 'string' && message) ? message : (response.message || 'Request failed');
  const errorObj = new Error(errorMessage);
  Object.assign(errorObj, response);
  return errorObj;
}

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
        return Promise.resolve(fn(_args, () => dispatch(i + 1, _args), opt));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0, args);
  };
}

export class Store {
  constructor(data = {}, opt = {}) {
    this.opt = getBaseOpt(opt);
    this.middlewares = [];

    // 定义支持的 HTTP 方法映射
    this.methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

    // 自动生成 HTTP 方法
    this.methods.forEach(method => {
      this[method] = (path, ...args) => this._request(method, path, ...args);
    });

    // 初始化 kv 模式 API
    this.kv = {
      get: (key, defaultValue) => this._kvGet(key, defaultValue),
      set: (key, value) => this._kvSet(key, value),
      delete: (key) => this._kvDelete(key)
    };

    // 初始化 info 模式 API
    this.info = {
      getTables: () => this._infoGetTables(),
      getStorageSize: () => this._infoGetStorageSize(),
      getStorageFreeSize: () => this._infoGetStorageFreeSize()
    };

    // 初始化数据和适配器
    this._initPromise = this._initialize(data, opt);
  }

  // 静态方法用于异步创建 Store 实例
  static async create(data = {}, opt = {}) {
    const store = new Store(data, opt);
    await store._ensureInitialized();
    return store;
  }

  async _initialize(data = {}, opt = {}) {
    let shouldSaveInitialData = false;
    let finalData = data;

    if(typeof data === `string`) {
      this.opt.savePath = data;
      // 异步加载数据
      if (this.opt.load) {
        finalData = await this.opt.load(this.opt.savePath);
      } else {
        throw new Error('load 方法未定义');
      }
    } else {
      // 传入数据对象时的处理
      // 当有 savePath（包括默认值）、有 load 函数且不覆盖时，才进行数据合并
      if (this.opt.savePath && this.opt.load && !this.opt.overwrite) {
        // 如果有 savePath、load 函数且不覆盖，则需要合并数据
        try {
          const existingData = await this.opt.load(this.opt.savePath);
          // 合并数据：存在的 key 不覆盖，新的 key 添加
          finalData = this._mergeData(existingData, data);
        } catch (error) {
          // 如果加载失败（如文件不存在），使用传入的数据
          finalData = data;
        }
      }
      // 传入数据对象时，需要进行初始保存
      shouldSaveInitialData = true;
    }

    // 即使是直接传入数据对象，也要等待一个微任务，确保初始化的一致性
    await Promise.resolve();
    this.opt.adapter = this.opt.adapter || new JsonAdapter(finalData, this.opt);

    // 如果传入的是数据对象且有 save 函数，进行初始保存
    if (shouldSaveInitialData && this.opt.save && this.opt.savePath) {
      await this.opt.adapter.save();
    }

    return this;
  }

  // 确保初始化完成的辅助方法
  async _ensureInitialized() {
    if (this._initPromise) {
      await this._initPromise;
      this._initPromise = null;
    }
  }

  // 合并数据的辅助方法：existing 数据优先，新数据中不存在的 key 才会被添加
  _mergeData(existingData, newData) {
    const result = { ...existingData };
    
    // 遍历新数据的每个 key
    for (const key in newData) {
      if (newData.hasOwnProperty(key)) {
        if (!result.hasOwnProperty(key)) {
          // 如果现有数据中没有这个 key，则添加
          result[key] = newData[key];
        }
        // 如果现有数据中已有这个 key，则保持现有数据不变（不覆盖）
      }
    }
    
    return result;
  }

  use(middleware) {
    // 只支持函数格式的中间件：function(args, next, opt) { ... }
    // 如果拦截器中抛出错误，会进入 .catch 中处理
    if (typeof middleware === 'function') {
      this.middlewares.push(middleware);
    } else {
      throw new Error('中间件必须是一个函数');
    }
    return this;
  }

  // kv 模式的辅助方法
  async _kvGet(key, defaultValue) {
    await this._ensureInitialized();
    
    const getDeepValue = (obj, path) => {
      return path.split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);
    };
    
    const value = getDeepValue(this.opt.adapter.data, key);
    return value !== undefined ? value : defaultValue;
  }

  async _kvSet(key, value) {
    await this._ensureInitialized();
    
    const setDeepValue = (obj, path, val) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((o, k) => {
        if (!(k in o) || typeof o[k] !== 'object' || o[k] === null) {
          o[k] = {};
        }
        return o[k];
      }, obj);
      target[lastKey] = val;
    };
    
    setDeepValue(this.opt.adapter.data, key, value);
    await this.opt.adapter.save();
    return value;
  }

  async _kvDelete(key) {
    await this._ensureInitialized();
    
    const deleteDeepValue = (obj, path) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);
      
      if (target && typeof target === 'object') {
        const deleted = target[lastKey];
        delete target[lastKey];
        return deleted;
      }
      return undefined;
    };
    
    const deleted = deleteDeepValue(this.opt.adapter.data, key);
    await this.opt.adapter.save();
    return deleted;
  }

  // info 模式的辅助方法
  async _infoGetTables() {
    await this._ensureInitialized();
    
    const data = this.opt.adapter.data;
    const tables = [];
    
    for (const key in data) {
      if (data.hasOwnProperty(key) && Array.isArray(data[key])) {
        tables.push(key);
      }
    }
    
    return tables;
  }


  async _infoGetStorageSize() {
    await this._ensureInitialized();
    
    // 在浏览器环境下，尝试获取更准确的存储大小
    if (typeof window !== 'undefined') {
      // 如果有 storage API，尝试获取实际存储使用量
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          return estimate.usage || 0;
        } catch (error) {
          // 如果获取失败，继续使用数据大小计算
        }
      }
      
      // 如果使用 localStorage，计算当前项目的存储大小
      if (typeof localStorage !== 'undefined' && this.opt.savePath) {
        try {
          const storedData = localStorage.getItem(this.opt.savePath);
          if (storedData) {
            return new Blob([storedData]).size;
          }
        } catch (error) {
          // 如果获取失败，继续使用数据大小计算
        }
      }
    }
    
    // 默认方式：计算内存中数据的 JSON 字符串大小
    const data = this.opt.adapter.data;
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  async _infoGetStorageFreeSize() {
    await this._ensureInitialized();
    
    // 判断当前环境和存储类型
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          return estimate.quota - estimate.usage;
        } catch (error) {
          // 如果 API 不可用，返回 -1
          return -1;
        }
      }
      
      // 如果没有 storage API，尝试使用传统方法检测 localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          // localStorage 总容量通常是 5-10MB，这里使用通用的 5MB
          const totalCapacity = 5 * 1024 * 1024; // 5MB in bytes
          let usedSize = 0;
          
          // 计算已使用的 localStorage 空间
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              usedSize += new Blob([localStorage[key]]).size + key.length;
            }
          }
          
          return Math.max(0, totalCapacity - usedSize);
        } catch (error) {
          return -1;
        }
      }
      
      return -1;
    } else {
      // Node.js 环境，文件存储方式返回 -1
      return -1;
    }
  }

  async _request(method, path, ...args) {
    // 确保初始化完成
    await this._ensureInitialized();

    try {
      const core = async (_args) => {
        const [method, path, ...restArgs] = _args;

        // 检查方法是否支持
        if (!this.methods.includes(method)) {
          throw createErrorResponse(HTTP_STATUS.BAD_REQUEST, `不支持的 HTTP 方法: ${method}`);
        }

        // 动态调用适配器方法
        if (typeof this.opt.adapter[method] === 'function') {
          const result = await this.opt.adapter[method](path, ...restArgs);

          if (result && typeof result === 'object' && result.data !== undefined && result.error !== undefined) {
            const errors = result.error;
            const hasErrors = Array.isArray(errors) && errors.some(err => err !== null);
            if (hasErrors) {
              // 有错误时，返回失败状态，状态码303，包含数据和错误
              return Promise.reject(createErrorResponse(HTTP_STATUS.SEE_OTHER, errors, result.data));
            } else {
              // 全部成功
              const statusCode = method.toLowerCase() === 'post' ? HTTP_STATUS.CREATED : HTTP_STATUS.OK;
              return createResponse(statusCode, result.data);
            }
          }

          // 根据方法类型确定状态码
          let statusCode;
          switch (method.toLowerCase()) {
            case 'post':
              statusCode = HTTP_STATUS.CREATED;
              break;
            case 'delete':
              statusCode = result === null ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.OK;
              break;
            case 'get':
              statusCode = result === null ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.OK;
              break;
            case 'put':
            case 'patch':
              statusCode = result === null ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.OK;
              break;
            default:
              statusCode = HTTP_STATUS.OK;
          }

          return createResponse(statusCode, result);
        } else {
          throw createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, `适配器不支持 ${method} 方法`);
        }
      };

      const fn = compose(this.middlewares, core, this.opt);
      return await fn([method, path, ...args]);
    } catch (error) {
      if (error && error.success !== undefined) {
        throw error;
      }
      // 否则包装为标准错误响应
      throw createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, (error && error.message) || error || 'Unknown error');
    }
  }
}

// 简单的 json 适配器，支持内存、localStorage、Node 文件
export class JsonAdapter {
  constructor(data = {}, opt = {}) {
    this.opt = opt;
    this.data = data;
  }

  getRelationKey(table) {
    return table + this.opt.idKeySuffix;
  }

  async save() {
    if (this.opt.save) {
      await this.opt.save(this.opt.savePath, this.data);
    }
  }

  parsePath(path) {
    // "book/1" => ['book', '1']
    // "books[1].comments" => ['books', '[1]', 'comments']
    if (!path) return [];
    
    // 处理数组索引语法：books[1].comments
    if (path.includes('[') && path.includes(']')) {
      const segments = [];
      let current = '';
      let inBrackets = false;
      
      for (let i = 0; i < path.length; i++) {
        const char = path[i];
        
        if (char === '[') {
          if (current) {
            segments.push(current);
            current = '';
          }
          current = '[';
          inBrackets = true;
        } else if (char === ']') {
          current += ']';
          segments.push(current);
          current = '';
          inBrackets = false;
        } else if (char === '.' && !inBrackets) {
          if (current) {
            segments.push(current);
            current = '';
          }
        } else if (char === '/' && !inBrackets) {
          if (current) {
            segments.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }
      
      if (current) {
        segments.push(current);
      }
      
      return segments.filter(Boolean);
    }
    
    return path.split('/').filter(Boolean);
  }

  get(path, query) {
    const segs = this.parsePath(path);
    
    // 如果 path 为空、undefined 或只有 /，返回所有数据
    if (!path || path === '' || path === '/' || segs.length === 0) {
      return this.data;
    }
    
    // 嵌套资源 GET /posts/1/comments
    if (segs.length === 3) {
      const [parentTable, parentId, childTable] = segs;
      if (this.data && this.data[childTable] && Array.isArray(this.data[childTable])) {
        const parentIdKey = this.getRelationKey(parentTable);
        return this.data[childTable].filter(item => String(item[parentIdKey]) === parentId);
      }
    }
    let cur = this.data;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      
      // 处理数组索引 [1]
      if (seg.startsWith('[') && seg.endsWith(']')) {
        const index = parseInt(seg.slice(1, -1));
        if (Array.isArray(cur) && index >= 0 && index < cur.length) {
          cur = cur[index];
        } else {
          return null;
        }
      } else if (Array.isArray(cur)) {
        cur = cur.find(item => String(item.id) === seg);
      } else {
        cur = cur[seg];
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
            if (operator === '_ne') {
              // _ne 支持数组：如果 value 是数组，则 itemValue 不能等于数组中的任何一个值
              if (Array.isArray(value)) {
                return !value.some(v => itemValue == v);
              }
              return itemValue != value;
            }
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
            item[embedField] = childArr.filter(child => child[this.getRelationKey(segs[0])] == idKey);
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
            const parent = parentArr.find(parent => parent.id == item[this.getRelationKey(expandField)]);
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
        
        // 检查是否需要分页
        const hasPagination = _page !== undefined || _limit !== undefined;
        
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
        } else if (hasPagination) {
          // 分页处理：设置默认值
          const page = parseInt(_page) || 1;
          const limit = parseInt(_limit) || 10;
          const totalCount = filteredData.length;
          const start = (page - 1) * limit;
          const end = start + limit;
          const paginatedData = filteredData.slice(start, end);
          
          // 返回分页格式的数据，继续正常的处理流程
          filteredData = {
            count: totalCount,
            list: paginatedData
          };
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

  async post(path, data) {
    const segs = this.parsePath(path);
    // 批量创建 /posts，body为数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results = [];
      const errors = [];
      let hasErrors = false;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id !== undefined) {
          results.push(null);
          errors.push('不能指定 id，id 会自动生成');
          hasErrors = true;
          continue;
        }
        try {
          const newItem = { ...item };
          newItem.id = genId();
          arr.push(newItem);
          results.push(newItem);
          errors.push(null);
        } catch (error) {
          results.push(null);
          errors.push(error.message || '创建失败');
          hasErrors = true;
        }
      }

      await this.save();

      // JsonAdapter 批量操作返回 {data, error}
      if (hasErrors) {
        return { data: results, error: errors };
      }

      return results;
    }
    // 嵌套资源 POST /posts/1/comments
    if (segs.length === 3 && Array.isArray(this.data[segs[2]])) {
      const [parentTable, parentId, childTable] = segs;
      const parentIdKey = this.getRelationKey(parentTable);
      const newData = { ...data, [parentIdKey]: isNaN(Number(parentId)) ? parentId : Number(parentId) };
      // 自动分配 id
      const arr = this.data[childTable];
      newData.id = genId();
      arr.push(newData);
      await this.save();
      return newData;
    }
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      
      // 处理数组索引 [1]
      if (seg.startsWith('[') && seg.endsWith(']')) {
        const index = parseInt(seg.slice(1, -1));
        if (Array.isArray(cur) && index >= 0 && index < cur.length) {
          cur = cur[index];
        } else {
          throw new Error(`数组索引 ${index} 超出范围`);
        }
      } else {
        if (!cur[seg]) cur[seg] = {};
        cur = cur[seg];
      }
    }
    const key = segs[segs.length - 1];
    if (!cur[key]) cur[key] = [];
    if (!Array.isArray(cur[key])) throw new Error('只能向数组添加');
    data.id = genId();
    cur[key].push(data);
    await this.save();
    return data;
  }

  async put(path, data) {
    const segs = this.parsePath(path);
    // 批量全量修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results = [];
      const errors = [];
      let hasErrors = false;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === undefined) {
          results.push(null);
          errors.push('缺少 id 字段');
          hasErrors = true;
          continue;
        }
        const idx = arr.findIndex(x => String(x.id) === String(item.id));
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${item.id} 的记录`);
          hasErrors = true;
          continue;
        }
        arr[idx] = { ...arr[idx], ...item };
        results.push(arr[idx]);
        errors.push(null);
      }

      await this.save();

      // JsonAdapter 批量操作返回 {data, error}
      if (hasErrors) {
        return { data: results, error: errors };
      }

      return results;
    }
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      
      // 处理数组索引 [1]
      if (seg.startsWith('[') && seg.endsWith(']')) {
        const index = parseInt(seg.slice(1, -1));
        if (Array.isArray(cur) && index >= 0 && index < cur.length) {
          cur = cur[index];
        } else {
          return null;
        }
      } else {
        cur = cur[seg];
      }
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素更新');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    cur[idx] = { ...cur[idx], ...data };
    await this.save();
    return cur[idx];
  }

  async delete(path, query) {
    const segs = this.parsePath(path);
    // 批量删除 /posts?id=1&id=2
    if (segs.length === 1 && query && query.id && this.data && Array.isArray(this.data[segs[0]])) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      const arr = this.data[segs[0]];
      const results = [];
      const errors = [];
      let hasErrors = false;

      for (const id of ids) {
        const idx = arr.findIndex(item => String(item.id) === String(id));
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${id} 的记录`);
          hasErrors = true;
          continue;
        }
        const del = arr.splice(idx, 1)[0];
        results.push(del);
        errors.push(null);
      }

      await this.save();

      // JsonAdapter 批量操作返回 {data, error}
      if (hasErrors) {
        return { data: results, error: errors };
      }

      return results;
    }
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      
      // 处理数组索引 [1]
      if (seg.startsWith('[') && seg.endsWith(']')) {
        const index = parseInt(seg.slice(1, -1));
        if (Array.isArray(cur) && index >= 0 && index < cur.length) {
          cur = cur[index];
        } else {
          return null;
        }
      } else {
        cur = cur[seg];
      }
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素删除');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    const del = cur.splice(idx, 1)[0];
    await this.save();
    return del;
  }

  async patch(path, data) {
    const segs = this.parsePath(path);
    // 批量部分修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results = [];
      const errors = [];
      let hasErrors = false;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === undefined) {
          results.push(null);
          errors.push('缺少 id 字段');
          hasErrors = true;
          continue;
        }
        const idx = arr.findIndex(x => String(x.id) === String(item.id));
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${item.id} 的记录`);
          hasErrors = true;
          continue;
        }
        arr[idx] = { ...arr[idx], ...item };
        results.push(arr[idx]);
        errors.push(null);
      }

      await this.save();

      // JsonAdapter 批量操作返回 {data, error}
      if (hasErrors) {
        return { data: results, error: errors };
      }

      return results;
    }
    let cur = this.data;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      
      // 处理数组索引 [1]
      if (seg.startsWith('[') && seg.endsWith(']')) {
        const index = parseInt(seg.slice(1, -1));
        if (Array.isArray(cur) && index >= 0 && index < cur.length) {
          cur = cur[index];
        } else {
          return null;
        }
      } else {
        cur = cur[seg];
      }
      if (cur == null) return null;
    }
    const key = segs[segs.length - 1];
    if (!Array.isArray(cur)) throw new Error('只能对数组元素 patch');
    const idx = cur.findIndex(item => String(item.id) === key);
    if (idx === -1) return null;
    cur[idx] = { ...cur[idx], ...data };
    await this.save();
    return cur[idx];
  }
}

// 内置拦截器：lite
const lite = async (args, next) => {
  try {
    const result = await next();
    if (result && typeof result === 'object' && result.success !== undefined) {
      if (result.success) {
        return result.data;
      } else {
        throw result.message;
      }
    }
    return result;
  } catch (error) {
    // 处理错误情况
    if (error && error.success !== undefined) {
      throw error;
    }
    // 其他错误
    throw error.message || error;
  }
};

// 导出拦截器对象
export const interceptor = {
  lite
};
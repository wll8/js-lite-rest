// TypeScript interfaces

// 基础数据类型，支持索引签名
export interface DataSchema {
  [key: string]: any;
}

// 查询参数类型定义
export interface QueryParams {
  // 分页
  _page?: number | string;
  _limit?: number | string;
  
  // 排序
  _sort?: string | string[];
  _order?: string | string[];
  
  // 截取
  _start?: number | string;
  _end?: number | string;
  
  // 关联
  _embed?: string | string[];
  _expand?: string | string[];
  
  // 全文搜索
  _q?: string;
  
  // 基础过滤和运算符
  [key: string]: any;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  count: number;
  list: T[];
}

// HTTP 状态码类型
export interface HttpStatus {
  code: number;
  message: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  data: T;
  message?: string;
}

// 错误响应类型
export interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
}

export interface StoreOptions {
  idKeySuffix?: string;
  savePath?: string;
  overwrite?: boolean;
  // Node 文件序列化缩进：默认紧凑；设置正数（如 2）恢复缩进格式
  indent?: number;
  load?: (key: string) => Promise<any>;
  save?: (key: string, data: any) => Promise<void>;
  adapter?: Adapter;
}

export interface Adapter<T = any> {
  data: T;
  get(path: string, query?: QueryParams): Promise<any>;
  post(path: string, data?: any): Promise<any>;
  put(path: string, data?: any): Promise<any>;
  delete(path: string, query?: QueryParams): Promise<any>;
  patch(path: string, data?: any): Promise<any>;
  head?(path: string): Promise<any>;
  options?(path: string): Promise<any>;
  save(): Promise<void>;
  // 写操作前从存储重读最新数据，避免多标签页/多进程并发写入时丢失更新
  // 返回 false 表示未真实加载（如存在待落盘修改被跳过）；不返回或返回其他值视为已加载
  reload?(): Promise<boolean | void>;
}

export interface KVApi {
  get<T = any>(key: string, defaultValue?: T): Promise<T>;
  set<T = any>(key: string, value: T): Promise<T>;
  delete<T = any>(key: string): Promise<T>;
}

export interface InfoApi {
  getTables(): Promise<string[]>;
  getStorageSize(): Promise<number>;
  getStorageFreeSize(): Promise<number>;
}

export type MiddlewareFunction<T = any> = (
  args: any[],
  next: () => Promise<any>,
  opt: StoreOptions
) => Promise<any>;

// 实体类型，带有 id 字段
export interface Entity {
  id: string | number;
}

// 表类型，包含实体的数组
export type Table<T extends Entity = Entity> = T[];

// 数据库模式类型，映射表名到表
export type DatabaseSchema<T extends DataSchema = DataSchema> = {
  [K in keyof T]: T[K] extends Entity[] ? T[K] : T[K];
};

// 查询结果类型
export type QueryResult<T> = T[] | PaginatedResponse<T> | T | null;

// CRUD 操作的返回类型
export type CreateResult<T> = T;
export type ReadResult<T> = QueryResult<T>;
export type UpdateResult<T> = T;
export type DeleteResult<T> = T;

// 批量操作结果类型
export interface BatchResult<T> {
  data: (T | null)[];
  error: (string | null)[];
}

// 路径类型，用于类型安全的路径访问
export type Path<T> = string & { __pathBrand: T };

// 表名类型
export type TableNames<T extends DataSchema> = keyof T;

// 字段名类型
export type FieldNames<T> = keyof T;

// 排序方向类型
export type SortDirection = 'asc' | 'desc';

// 排序配置类型
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// 分页配置类型
export interface PaginationConfig {
  page: number;
  limit: number;
}

// 深拷贝：优先 structuredClone（快、无字符串中间态），
// 含函数/Symbol 等不可克隆值或环境不支持时回落 JSON 方式（丢弃非常规值）
function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // 回落到 JSON 方式
    }
  }
  return JSON.parse(JSON.stringify(value));
}

function genId(): string {
  const currentId = getTimestampPlusId();
  // 追加 4 位 36 进制随机分量，避免跨进程同一毫秒内生成重复 ID
  const random = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0');
  return `${currentId.toString(36).toUpperCase()}${random.toUpperCase()}`;
}

function getTimestampPlusId(start: number = +new Date(2025, 4, 5)): number {
  const currentTime = Date.now() - start;
  const lastId = (globalThis as any)[`lastId_${start}`];
  
  if (lastId === undefined) {
    // 首次调用，直接使用时间戳
    (globalThis as any)[`lastId_${start}`] = currentTime;
    return currentTime;
  } else {
    // 确保新ID既不小于当前时间戳，也大于上一个ID
    const nextId = Math.max(currentTime, lastId + 1);
    (globalThis as any)[`lastId_${start}`] = nextId;
    return nextId;
  }
}

function getBaseOpt(opt: Partial<StoreOptions> = {}): StoreOptions {
  const newOpt: StoreOptions = {
    idKeySuffix: 'Id',
    savePath: typeof window === 'undefined' ? `js-lite-rest.json` : `js-lite-rest`,
    overwrite: false, // 默认不覆盖已有数据
    ...opt,
  }
  return newOpt
}

// HTTP 状态码常量
const HTTP_STATUS: Record<string, HttpStatus> = {
  OK: { code: 200, message: '成功' },
  CREATED: { code: 201, message: '已创建' },
  NO_CONTENT: { code: 204, message: '无内容' },
  BAD_REQUEST: { code: 400, message: '请求无效' },
  MULTI_STATUS: { code: 207, message: '部分成功' },
  NOT_FOUND: { code: 404, message: '未找到' },
  INTERNAL_SERVER_ERROR: { code: 500, message: '服务器内部错误' }
};

// 创建标准响应格式
function createResponse(code: HttpStatus | number, data?: any, message?: string): ApiResponse {
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
function createErrorResponse(code: HttpStatus | number, message?: string | string[], data: any = null): Error & ApiResponse {
  const response = createResponse(code, data, message as string);
  response.success = false;
  const errorMessage = Array.isArray(message)
    ? (message.find(m => typeof m === 'string' && m) || response.message || 'Request failed')
    : (typeof message === 'string' && message) ? message : (response.message || 'Request failed');
  const errorObj = new Error(errorMessage) as Error & ApiResponse;
  Object.assign(errorObj, response);
  return errorObj;
}

function compose(middlewares: MiddlewareFunction[], core: MiddlewareFunction, opt: StoreOptions) {
  return function (args: any[]) {
    let index = -1;
    function dispatch(i: number, _args: any[]): Promise<any> {
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

export class Store<T extends DataSchema = DataSchema> {
  opt: StoreOptions;
  middlewares: MiddlewareFunction<T>[];
  methods: string[];
  kv: KVApi;
  info: InfoApi;
  private _initPromise: Promise<Store<T>> | null;
  private _changeListeners: Array<(info?: { source: string }) => void>;
  // 实例级写队列：串行化所有写操作，避免并发写交错导致丢失更新
  private _writeQueue: Promise<void>;
  // 写队列排队计数：任务收尾时为 1 表示队列即将排空，执行统一落盘
  private _pendingCount = 0;

  // HTTP 方法的类型声明
  get!: (path?: string, query?: QueryParams) => Promise<any>;
  post!: (path: string, data?: any) => Promise<any>;
  put!: (path: string, data?: any) => Promise<any>;
  delete!: (path: string, query?: QueryParams) => Promise<any>;
  patch!: (path: string, data?: any) => Promise<any>;
  head?: (path: string) => Promise<any>;
  options?: (path: string) => Promise<any>;

  constructor(data: T | string = {} as T, opt: Partial<StoreOptions> = {}) {
    this.opt = getBaseOpt(opt);
    this.middlewares = [];
    this._changeListeners = [];
    this._writeQueue = Promise.resolve();

    // 定义支持的 HTTP 方法映射
    this.methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

    // 自动生成 HTTP 方法
    this.methods.forEach(method => {
      (this as any)[method] = (path: string, ...args: any[]) => this._request(method, path, ...args);
    });

    // 初始化 kv 模式 API
    this.kv = {
      get: <K = any>(key: string, defaultValue?: K) => this._kvGet(key, defaultValue),
      set: <K = any>(key: string, value: K) => this._kvSet(key, value),
      delete: <K = any>(key: string) => this._kvDelete(key)
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
  static async create<T extends DataSchema = DataSchema>(
    data: T | string = {} as T,
    opt: Partial<StoreOptions> = {}
  ): Promise<Store<T>> {
    const store = new Store<T>(data, opt);
    await store._ensureInitialized();
    return store;
  }

  async _initialize(data: T | string = {} as T, opt: Partial<StoreOptions> = {}): Promise<Store<T>> {
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
    this.opt.adapter = this.opt.adapter || new JsonAdapter<T>(finalData as T, this.opt);

    // 写队列接管持久化时机：由排空时统一 flush，并发批量写合并为一次落盘
    if (this.opt.adapter instanceof JsonAdapter) {
      this.opt.adapter._autoPersist = false;
    }

    // 如果传入的是数据对象且有 save 函数，进行初始保存
    if (shouldSaveInitialData && this.opt.save && this.opt.savePath) {
      await this.opt.adapter.save();
    }

    return this;
  }

  // 确保初始化完成的辅助方法
  async _ensureInitialized(): Promise<void> {
    if (this._initPromise) {
      await this._initPromise;
      this._initPromise = null;
    }
  }

  // 将任务加入写队列串行执行：同一实例的写操作按发起顺序依次完成，
  // 保证"重读→修改→保存"全程不被其他写操作或外部同步打断。
  // 注意：任务内不要调用本实例的其他写方法（会排队等待自身，造成死锁）。
  private _enqueue<R>(task: () => Promise<R>): Promise<R> {
    this._pendingCount++;
    const run = this._writeQueue.then(async () => {
      try {
        const result = await task();
        // 队列排空时统一落盘：同一事件循环内的并发写合并为一次 I/O
        if (this._pendingCount === 1) {
          await this._flushDirty();
        }
        return result;
      } catch (error) {
        // 任务失败也检查排空：拒尾任务不能搁浅同批已成功请求的落盘
        if (this._pendingCount === 1) {
          await this._flushDirty().catch(() => {});
        }
        throw error;
      } finally {
        this._pendingCount--;
      }
    });
    // 队尾只追踪完成状态：前序任务失败不阻塞后续任务
    this._writeQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  // 将待落盘修改写入存储：仅在适配器支持 flush（受管 JsonAdapter）时生效
  private async _flushDirty(): Promise<void> {
    const adapter = this.opt.adapter as any;
    if (typeof adapter?.flush !== 'function') return;
    await adapter.flush();
  }

  // 请求适配器持久化：受管 JsonAdapter 仅标脏，其他适配器直接 save
  private async _persistAdapter(): Promise<void> {
    const adapter: any = this.opt.adapter;
    if (typeof adapter?.persist === 'function') {
      await adapter.persist();
    } else {
      await adapter?.save();
    }
  }

  // 合并数据的辅助方法：existing 数据优先，新数据中不存在的 key 才会被添加
  _mergeData(existingData: any, newData: any): any {
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

  use(middleware: MiddlewareFunction<T>): Store<T> {
    // 只支持函数格式的中间件：function(args, next, opt) { ... }
    // 如果拦截器中抛出错误，会进入 .catch 中处理
    if (typeof middleware === 'function') {
      this.middlewares.push(middleware);
    } else {
      throw new Error('中间件必须是一个函数');
    }
    return this;
  }

  // 监听外部数据变更（如其他标签页写入存储），返回取消监听函数
  onChange(callback: (info?: { source: string }) => void): () => void {
    if (typeof callback !== 'function') {
      throw new Error('onChange 参数必须是一个函数');
    }
    this._changeListeners.push(callback);
    return () => {
      const index = this._changeListeners.indexOf(callback);
      if (index > -1) {
        this._changeListeners.splice(index, 1);
      }
    };
  }

  // 外部数据变更后刷新内存副本并通知监听器（供多标签页同步机制调用）
  async _syncFromExternal(): Promise<boolean> {
    await this._ensureInitialized();
    const adapter = this.opt.adapter as any;
    if (typeof adapter?.reload !== 'function') return false;
    // 重读进入写队列排队执行，避免打断进行中的写操作（如已修改内存但尚未保存）
    // reload 返回 false 表示未真实加载（如存在待落盘修改被跳过），此时不通知监听器；
    // 返回 undefined 的自定义适配器视为已加载，保持原有通知行为
    const loaded = await this._enqueue(() => adapter.reload());
    if (loaded === false) return false;
    const info = { source: 'external' };
    this._changeListeners.forEach((callback) => {
      try {
        callback(info);
      } catch {
        // 单个监听器异常不影响其他监听器
      }
    });
    return true;
  }

  // kv 模式的辅助方法
  async _kvGet(key: string, defaultValue?: any): Promise<any> {
    await this._ensureInitialized();
    
    const getDeepValue = (obj: any, path: string): any => {
      return path.split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);
    };
    
    const value = getDeepValue(this.opt.adapter!.data, key);
    if (value === undefined) return defaultValue;
    // 返回深拷贝，与 get 保持一致，避免修改返回值污染库数据
    return deepClone(value);
  }

  async _kvSet(key: string, value: any): Promise<any> {
    await this._ensureInitialized();
    return this._enqueue(async () => {
      await (this.opt.adapter as any)?.reload?.();

      const setDeepValue = (obj: any, path: string, val: any): void => {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((o, k) => {
          if (!(k in o) || typeof o[k] !== 'object' || o[k] === null) {
            o[k] = {};
          }
          return o[k];
        }, obj);
        target[lastKey] = val;
      };

      setDeepValue(this.opt.adapter!.data, key, value);
      await this._persistAdapter();
      return value;
    });
  }

  async _kvDelete(key: string): Promise<any> {
    await this._ensureInitialized();
    return this._enqueue(async () => {
      await (this.opt.adapter as any)?.reload?.();

      const deleteDeepValue = (obj: any, path: string): any => {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);

        if (target && typeof target === 'object') {
          const deleted = target[lastKey];
          delete target[lastKey];
          return deleted;
        }
        return undefined;
      };

      const deleted = deleteDeepValue(this.opt.adapter!.data, key);
      await this._persistAdapter();
      return deleted;
    });
  }

  // info 模式的辅助方法
  async _infoGetTables(): Promise<string[]> {
    await this._ensureInitialized();
    
    const data = this.opt.adapter!.data;
    const tables: string[] = [];
    
    for (const key in data) {
      if (data.hasOwnProperty(key) && Array.isArray(data[key])) {
        tables.push(key);
      }
    }
    
    return tables;
  }

  async _infoGetStorageSize(): Promise<number> {
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
    const data = this.opt.adapter!.data;
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  async _infoGetStorageFreeSize(): Promise<number> {
    await this._ensureInitialized();
    
    // 判断当前环境和存储类型
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          return (estimate.quota || 0) - (estimate.usage || 0);
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

  async _request(method: string, path: string, ...args: any[]): Promise<any> {
    // 确保初始化完成
    await this._ensureInitialized();

    try {
      const core: MiddlewareFunction = async (_args: any[]) => {
        const [method, path, ...restArgs] = _args;

        // 检查方法是否支持
        if (!this.methods.includes(method)) {
          throw createErrorResponse(HTTP_STATUS.BAD_REQUEST, `不支持的 HTTP 方法: ${method}`);
        }

        // 写操作前重读最新数据，避免多标签页/多进程下覆盖外部修改
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
          await (this.opt.adapter as any)?.reload?.();
        }

        // 动态调用适配器方法
        if (typeof (this.opt.adapter as any)[method] === 'function') {
          const result = await (this.opt.adapter as any)[method](path, ...restArgs);

          if (result && typeof result === 'object' && result.data !== undefined && result.error !== undefined) {
            const errors = result.error;
            const hasErrors = Array.isArray(errors) && errors.some((err: any) => err !== null);
            if (hasErrors) {
              // 有错误时，返回失败状态，状态码207（Multi-Status，批量部分成功），包含数据和错误
              return Promise.reject(createErrorResponse(HTTP_STATUS.MULTI_STATUS, errors, result.data));
            } else {
              // 全部成功
              const statusCode = method.toLowerCase() === 'post' ? HTTP_STATUS.CREATED : HTTP_STATUS.OK;
              return createResponse(statusCode, result.data);
            }
          }

          // 根据方法类型确定状态码
          let statusCode: HttpStatus;
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
      const run = () => fn([method, path, ...args]);

      // 写操作进入实例级写队列串行执行：从写前重读到保存全程互斥，避免并发写交错丢失更新
      const isWrite = ['post', 'put', 'patch', 'delete'].includes(method);
      return await (isWrite ? this._enqueue(run) : run());
    } catch (error: any) {
      if (error && error.success !== undefined) {
        throw error;
      }
      // 否则包装为标准错误响应
      throw createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, (error && error.message) || error || 'Unknown error');
    }
  }
}

// 简单的 json 适配器，支持内存、localStorage、Node 文件
export class JsonAdapter<T extends DataSchema = DataSchema> implements Adapter<T> {
  opt: StoreOptions;
  data: T;
  // 待落盘标志与自动落盘开关：独立使用 JsonAdapter 时直接落盘；
  // 经 Store 创建后由写队列接管持久化时机（排空时统一 flush）
  _dirty = false;
  _autoPersist = true;
  // 顶层表 id 索引：表名 -> (String(id) -> 记录引用)；reload 整体失效，惰性重建
  _idIndex: Map<string, Map<string, any>> = new Map();

  constructor(data: T = {} as T, opt: StoreOptions = {}) {
    this.opt = opt;
    this.data = data;
  }

  getRelationKey(table: string): string {
    return table + (this.opt.idKeySuffix || 'Id');
  }

  // 顶层表的 id 索引：惰性构建，重复 id 取第一个（与 findIndex 语义一致）
  private getTopIndex(table: string): Map<string, any> | null {
    const arr = this.data[table];
    if (!Array.isArray(arr)) return null;
    let index = this._idIndex.get(table);
    if (!index) {
      index = new Map();
      for (const item of arr) {
        const key = String(item?.id);
        if (!index.has(key)) index.set(key, item);
      }
      this._idIndex.set(table, index);
    }
    return index;
  }

  // 顶层表按 id 查记录：索引命中 O(1)，非顶层/未建索引回退线性查找
  private findItemById(table: string, id: string): any {
    const arr = this.data[table];
    if (!Array.isArray(arr)) return undefined;
    const index = this.getTopIndex(table);
    if (index) {
      const key = String(id);
      return index.has(key) ? index.get(key) : undefined;
    }
    return arr.find((item: any) => String(item.id) === String(id));
  }

  // 数组中按 id 定位下标：顶层表走索引（引用反查位置），嵌套数组回退线性查找
  private findIndexById(table: string, arr: any[], id: any): number {
    if (arr === this.data[table]) {
      const index = this.getTopIndex(table);
      if (index) {
        const item = index.get(String(id));
        return item ? arr.indexOf(item) : -1;
      }
    }
    return arr.findIndex((item: any) => String(item.id) === String(id));
  }

  // 顶层表记录变更后同步索引（未构建时不动作，留待惰性重建）
  private indexSet(table: string, item: any): void {
    const index = this._idIndex.get(table);
    if (index) index.set(String(item?.id), item);
  }

  // 删除记录后刷新索引键：数组中仍有同 id 记录则重指第一个（与 findIndex 语义一致），否则删键
  private indexRefresh(table: string, id: any): void {
    const index = this._idIndex.get(table);
    if (!index) return;
    const key = String(id);
    const arr = this.data[table];
    if (!Array.isArray(arr)) return;
    const next = arr.find((item: any) => String(item?.id) === key);
    if (next !== undefined) {
      index.set(key, next);
    } else {
      index.delete(key);
    }
  }

  async save(): Promise<void> {
    if (this.opt.save) {
      await this.opt.save(this.opt.savePath!, this.data);
    }
  }

  // 写方法内的持久化入口：自动模式直接落盘（独立使用 JsonAdapter），受管模式仅标脏
  async persist(): Promise<void> {
    if (this._autoPersist) {
      await this.save();
      return;
    }
    this._dirty = true;
  }

  // Store 在写队列排空时调用：有待落盘修改才真正落盘
  async flush(): Promise<void> {
    if (!this._dirty) return;
    this._dirty = false;
    try {
      await this.save();
    } catch (error) {
      // 落盘失败恢复标志，由后续写任务的排空检查重试
      this._dirty = true;
      throw error;
    }
  }

  // 写前重读：从存储加载最新数据替换内存副本，避免覆盖其他标签页/进程的修改
  // 返回是否真实加载：守卫跳过/加载失败返回 false；加载成功返回 true（含同引用缓存命中）
  async reload(): Promise<boolean> {
    // 存在待落盘修改时跳过重读：此时存储落后于内存，重读会冲掉未保存的写入
    if (this._dirty) return false;
    if (!this.opt.load || !this.opt.savePath) return false;
    try {
      const latest = await this.opt.load(this.opt.savePath);
      if (latest != null && typeof latest === 'object') {
        // 同引用（如 Node 指纹缓存命中）时索引仍然有效，无需清空重建
        if (latest !== this.data) {
          this.data = latest;
          // 内存数据整体替换，已构建的 id 索引全部失效
          this._idIndex.clear();
        }
        return true;
      }
    } catch {
      // 存储不可读时保留当前内存数据，不中断写操作
    }
    return false;
  }

  parsePath(path: string): string[] {
    // "book/1" => ['book', '1']
    // "books[1].comments" => ['books', '[1]', 'comments']
    if (!path) return [];
    
    // 处理数组索引语法：books[1].comments
    if (path.includes('[') && path.includes(']')) {
      const segments: string[] = [];
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

  // 对外出口：返回深拷贝，避免调用方修改查询结果污染库数据
  async get(path: string, query?: any): Promise<any> {
    const result = await this.getRaw(path, query);
    if (result == null) return result;
    return deepClone(result);
  }

  async getRaw(path: string, query?: any): Promise<any> {
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
        return this.data[childTable].filter((item: any) => String(item[parentIdKey]) === parentId);
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
        // 顶层表按 id 走索引，嵌套数组保持线性查找
        if (cur === this.data[segs[0]]) {
          const hit = this.findItemById(segs[0], seg);
          cur = hit === undefined ? null : hit;
        } else {
          cur = cur.find((item: any) => String(item.id) === seg);
        }
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
        filteredData = [filteredData] as any;
        isSingleObject = true;
      }

      // 如果有 _expand 或 _embed 参数，创建数据副本以避免修改原始数据
      const needsDataCopy = _embed || _expand;
      if (needsDataCopy && filteredData) {
        filteredData = deepClone(filteredData);
      }
      // 全文检索
      if (typeof filterQuery._q === 'string' && filterQuery._q.length > 0) {
        const q = filterQuery._q.toLowerCase();
        delete filterQuery._q;
        const matchAnyField = (obj: any): boolean => {
          if (obj == null) return false;
          if (typeof obj === 'object') {
            return Object.values(obj).some(v => matchAnyField(v));
          }
          return String(obj).toLowerCase().includes(q);
        };
        filteredData = filteredData.filter((item: any) => matchAnyField(item));
      }
      // 过滤
      if (Object.keys(filterQuery).length > 0) {
        filteredData = filteredData.filter((item: any) => {
          return Object.keys(filterQuery).every(k => {
            let value = filterQuery[k];
            const getDeepValue = (obj: any, path: string): any => path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
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
          filteredData.forEach((item: any) => {
            if (!item) return;
            const idKey = item.id;
            item[embedField] = childArr.filter((child: any) => child[this.getRelationKey(segs[0])] == idKey);
          });
        }
      }
      // _expand
      if (_expand && this.data) {
        const expandFields = Array.isArray(_expand) ? _expand : String(_expand).split(',');
        for (const expandField of expandFields) {
          const parentArr = this.data[expandField];
          if (!Array.isArray(parentArr)) continue;
          filteredData.forEach((item: any) => {
            if (!item) return;
            const parent = parentArr.find((parent: any) => parent.id == item[this.getRelationKey(expandField)]);
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
          filteredData.sort((a: any, b: any) => {
            for (let i = 0; i < sortFields.length; i++) {
              const field = sortFields[i].trim();
              const order = orderFields[i] ? orderFields[i].trim().toLowerCase() : 'asc';
              const getDeepValue = (obj: any, path: string): any => path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
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
          } as any;
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

  async post(path: string, data?: any): Promise<any> {
    const segs = this.parsePath(path);
    // 批量创建 /posts，body为数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results: any[] = [];
      const errors: any[] = [];
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
          this.indexSet(segs[0], newItem);
          results.push(newItem);
          errors.push(null);
        } catch (error: any) {
          results.push(null);
          errors.push(error.message || '创建失败');
          hasErrors = true;
        }
      }

      await this.persist();

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
      this.indexSet(segs[2], newData);
      await this.persist();
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
        if (!cur[seg]) (cur as any)[seg] = {};
        cur = (cur as any)[seg];
      }
    }
    const key = segs[segs.length - 1];
    if (!cur[key]) (cur as any)[key] = [];
    if (!Array.isArray((cur as any)[key])) throw new Error('只能向数组添加');
    data.id = genId();
    cur[key].push(data);
    // 嵌套数组不维护顶层表索引（cur[key] 与顶层表同名数组为同一引用时才维护）
    if (cur[key] === this.data[key]) this.indexSet(key, data);
    await this.persist();
    return data;
  }

  async put(path: string, data?: any): Promise<any> {
    const segs = this.parsePath(path);
    // 批量全量修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results: any[] = [];
      const errors: any[] = [];
      let hasErrors = false;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === undefined) {
          results.push(null);
          errors.push('缺少 id 字段');
          hasErrors = true;
          continue;
        }
        const idx = this.findIndexById(segs[0], arr, item.id);
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${item.id} 的记录`);
          hasErrors = true;
          continue;
        }
        // 修改以 body 定位 id 找到记录，但保留记录原 id（含类型表示），id 不可被修改
        arr[idx] = { ...arr[idx], ...item, id: arr[idx].id };
        this.indexSet(segs[0], arr[idx]);
        results.push(arr[idx]);
        errors.push(null);
      }

      await this.persist();

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
    const idx = this.findIndexById(segs[0], cur, key);
    if (idx === -1) return null;
    // 修改忽略传入的 id：记录 id 以路径为准，避免关联引用（xxxId）静默断裂
    cur[idx] = { ...cur[idx], ...data, id: cur[idx].id };
    // 嵌套数组不维护顶层表索引
    if (cur === this.data[segs[0]]) {
      this.indexSet(segs[0], cur[idx]);
    }
    await this.persist();
    return cur[idx];
  }

  async delete(path: string, query?: any): Promise<any> {
    const segs = this.parsePath(path);
    // 批量删除 /posts?id=1&id=2
    if (segs.length === 1 && query && query.id && this.data && Array.isArray(this.data[segs[0]])) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      const arr = this.data[segs[0]];
      const results: any[] = [];
      const errors: any[] = [];
      let hasErrors = false;

      for (const id of ids) {
        const idx = this.findIndexById(segs[0], arr, id);
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${id} 的记录`);
          hasErrors = true;
          continue;
        }
        const del = arr.splice(idx, 1)[0];
        this.indexRefresh(segs[0], del.id);
        results.push(del);
        errors.push(null);
      }

      await this.persist();

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
    const idx = this.findIndexById(segs[0], cur, key);
    if (idx === -1) return null;
    const del = cur.splice(idx, 1)[0];
    // 嵌套数组不维护顶层表索引
    if (cur === this.data[segs[0]]) this.indexRefresh(segs[0], del.id);
    await this.persist();
    return del;
  }

  async patch(path: string, data?: any): Promise<any> {
    const segs = this.parsePath(path);
    // 批量部分修改 /posts，body为带id数组
    if (segs.length === 1 && Array.isArray(data) && this.data && Array.isArray(this.data[segs[0]])) {
      const arr = this.data[segs[0]];
      const results: any[] = [];
      const errors: any[] = [];
      let hasErrors = false;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === undefined) {
          results.push(null);
          errors.push('缺少 id 字段');
          hasErrors = true;
          continue;
        }
        const idx = this.findIndexById(segs[0], arr, item.id);
        if (idx === -1) {
          results.push(null);
          errors.push(`未找到 id 为 ${item.id} 的记录`);
          hasErrors = true;
          continue;
        }
        // 修改以 body 定位 id 找到记录，但保留记录原 id（含类型表示），id 不可被修改
        arr[idx] = { ...arr[idx], ...item, id: arr[idx].id };
        this.indexSet(segs[0], arr[idx]);
        results.push(arr[idx]);
        errors.push(null);
      }

      await this.persist();

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
    const idx = this.findIndexById(segs[0], cur, key);
    if (idx === -1) return null;
    // 修改忽略传入的 id：记录 id 以路径为准，避免关联引用（xxxId）静默断裂
    cur[idx] = { ...cur[idx], ...data, id: cur[idx].id };
    // 嵌套数组不维护顶层表索引
    if (cur === this.data[segs[0]]) {
      this.indexSet(segs[0], cur[idx]);
    }
    await this.persist();
    return cur[idx];
  }
}

// 内置拦截器：lite
const lite: MiddlewareFunction = async (args: any[], next: () => Promise<any>) => {
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
  } catch (error: any) {
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
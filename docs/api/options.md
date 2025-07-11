# 配置选项

js-lite-rest 提供了丰富的配置选项，让你可以自定义 Store 的行为以适应不同的使用场景。

## StoreOptions 接口

```typescript
interface StoreOptions {
  idKeySuffix?: string;
  savePath?: string;
  load?: (key: string) => Promise<any>;
  save?: (key: string, data: any) => Promise<void>;
  adapter?: Adapter;
}
```

## 配置选项详解

### idKeySuffix

**类型**: `string`  
**默认值**: `'Id'`

用于确定关联字段的后缀。这个配置影响嵌套资源和关联查询的工作方式。

```javascript
// 默认配置
const store = await createStore({}, {
  idKeySuffix: 'Id'
});

// 数据结构示例
const data = {
  users: [{ id: 1, name: 'Alice' }],
  posts: [{ id: 1, title: '文章', userId: 1 }], // userId 关联到 users
  comments: [{ id: 1, content: '评论', postId: 1 }] // postId 关联到 posts
};

// 自定义后缀
const store = await createStore({}, {
  idKeySuffix: '_id'
});

// 对应的数据结构
const data = {
  users: [{ id: 1, name: 'Alice' }],
  posts: [{ id: 1, title: '文章', user_id: 1 }], // user_id 关联到 users
  comments: [{ id: 1, content: '评论', post_id: 1 }] // post_id 关联到 posts
};
```

### savePath

**类型**: `string`  
**默认值**: Node.js 中为 `'js-lite-rest.json'`，浏览器中为 `'js-lite-rest'`

指定数据保存的路径或键名。

#### Node.js 环境

```javascript
// 使用默认路径
const store = await createStore();
// 数据保存到 './js-lite-rest.json'

// 自定义文件路径
const store = await createStore({}, {
  savePath: './data/my-app.json'
});

// 绝对路径
const store = await createStore({}, {
  savePath: '/var/data/app-data.json'
});

// 相对路径
const store = await createStore({}, {
  savePath: '../shared/data.json'
});
```

#### 浏览器环境

```javascript
// 使用默认 localStorage 键
const store = await createStore();
// 数据保存到 localStorage['js-lite-rest']

// 自定义 localStorage 键
const store = await createStore({}, {
  savePath: 'my-app-data'
});

// 命名空间
const store = await createStore({}, {
  savePath: 'myapp:user:123:data'
});
```

### load

**类型**: `(key: string) => Promise<any>`

自定义数据加载函数。当提供此函数时，Store 将使用它来加载数据而不是默认的加载方式。

#### 基本用法

```javascript
const store = await createStore({}, {
  async load(key) {
    console.log('加载数据:', key);
    
    // 从自定义存储加载
    const data = await myCustomStorage.get(key);
    return JSON.parse(data);
  }
});
```

#### 实际示例

```javascript
// Redis 存储
const store = await createStore({}, {
  async load(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Redis 加载失败，使用默认数据:', error.message);
      return {};
    }
  }
});

// IndexedDB 存储
const store = await createStore({}, {
  async load(key) {
    const db = await openIndexedDB();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const result = await store.get(key);
    return result ? result.data : {};
  }
});

// HTTP API 加载
const store = await createStore({}, {
  async load(key) {
    const response = await fetch(`/api/data/${key}`);
    if (response.ok) {
      return await response.json();
    }
    return {};
  }
});

// 文件系统（Node.js）
const store = await createStore({}, {
  async load(key) {
    try {
      const data = await fs.readFile(key, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回空对象
        return {};
      }
      throw error;
    }
  }
});
```

### save

**类型**: `(key: string, data: any) => Promise<void>`

自定义数据保存函数。当提供此函数时，Store 将使用它来保存数据而不是默认的保存方式。

#### 基本用法

```javascript
const store = await createStore({}, {
  async save(key, data) {
    console.log('保存数据:', key, data);
    
    // 保存到自定义存储
    await myCustomStorage.set(key, JSON.stringify(data));
  }
});
```

#### 实际示例

```javascript
// Redis 存储
const store = await createStore({}, {
  async save(key, data) {
    await redis.set(key, JSON.stringify(data));
    // 可选：设置过期时间
    await redis.expire(key, 3600); // 1小时过期
  }
});

// IndexedDB 存储
const store = await createStore({}, {
  async save(key, data) {
    const db = await openIndexedDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    await store.put({ id: key, data, timestamp: Date.now() });
  }
});

// HTTP API 保存
const store = await createStore({}, {
  async save(key, data) {
    await fetch(`/api/data/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
});

// 压缩保存（Node.js）
const store = await createStore({}, {
  async save(key, data) {
    const compressed = await gzip(JSON.stringify(data));
    await fs.writeFile(key + '.gz', compressed);
  }
});

// 备份保存
const store = await createStore({}, {
  async save(key, data) {
    const jsonData = JSON.stringify(data, null, 2);
    
    // 主存储
    await fs.writeFile(key, jsonData);
    
    // 备份存储
    const backupPath = key.replace('.json', `.backup.${Date.now()}.json`);
    await fs.writeFile(backupPath, jsonData);
    
    // 清理旧备份（保留最近5个）
    await cleanupOldBackups(key);
  }
});
```

### adapter

**类型**: `Adapter`

自定义适配器实例。适配器负责实际的数据操作逻辑。

#### Adapter 接口

```typescript
interface Adapter {
  get(path: string, query?: any): Promise<any>;
  post(path: string, data: any): Promise<any>;
  put(path: string, data: any): Promise<any>;
  patch(path: string, data: any): Promise<any>;
  delete(path: string, query?: any): Promise<any>;
  head?(path: string, query?: any): Promise<any>;
  options?(path: string, query?: any): Promise<any>;
}
```

#### 自定义适配器示例

```javascript
// HTTP API 适配器
class HttpAdapter {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async get(path, query) {
    const url = new URL(`${this.baseURL}/${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const response = await fetch(url);
    return response.json();
  }
  
  async post(path, data) {
    const response = await fetch(`${this.baseURL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async put(path, data) {
    const response = await fetch(`${this.baseURL}/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async patch(path, data) {
    const response = await fetch(`${this.baseURL}/${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async delete(path, query) {
    const url = new URL(`${this.baseURL}/${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const response = await fetch(url, { method: 'DELETE' });
    return response.json();
  }
}

// 使用自定义适配器
const store = await createStore({}, {
  adapter: new HttpAdapter('https://api.example.com')
});

// 数据库适配器
class DatabaseAdapter {
  constructor(db) {
    this.db = db;
  }
  
  async get(path, query) {
    const [table, id] = path.split('/');
    
    if (id) {
      // 获取单条记录
      return await this.db.collection(table).doc(id).get();
    } else {
      // 获取列表
      let queryRef = this.db.collection(table);
      
      if (query) {
        // 应用查询条件
        Object.entries(query).forEach(([key, value]) => {
          if (key.endsWith('_gte')) {
            queryRef = queryRef.where(key.slice(0, -4), '>=', value);
          } else if (key.endsWith('_lte')) {
            queryRef = queryRef.where(key.slice(0, -4), '<=', value);
          } else {
            queryRef = queryRef.where(key, '==', value);
          }
        });
      }
      
      const snapshot = await queryRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }
  
  async post(path, data) {
    const docRef = await this.db.collection(path).add(data);
    return { id: docRef.id, ...data };
  }
  
  // ... 其他方法
}

// 使用数据库适配器
const store = await createStore({}, {
  adapter: new DatabaseAdapter(firestore)
});
```

## 配置组合示例

### 开发环境配置

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

const store = await createStore({}, {
  savePath: isDevelopment ? './dev-data.json' : './prod-data.json',
  
  async load(key) {
    if (isDevelopment) {
      console.log('🔄 加载开发数据:', key);
    }
    
    try {
      const data = await fs.readFile(key, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (isDevelopment) {
        console.warn('⚠️ 文件不存在，使用默认数据');
      }
      return {};
    }
  },
  
  async save(key, data) {
    if (isDevelopment) {
      console.log('💾 保存开发数据:', key);
      // 开发环境格式化 JSON
      await fs.writeFile(key, JSON.stringify(data, null, 2));
    } else {
      // 生产环境压缩 JSON
      await fs.writeFile(key, JSON.stringify(data));
    }
  }
});
```

### 多环境配置

```javascript
const configs = {
  development: {
    savePath: './dev-data.json',
    async load(key) {
      console.log('Dev: 加载数据');
      return JSON.parse(await fs.readFile(key, 'utf-8'));
    },
    async save(key, data) {
      console.log('Dev: 保存数据');
      await fs.writeFile(key, JSON.stringify(data, null, 2));
    }
  },
  
  production: {
    savePath: process.env.DATA_PATH || './data.json',
    async load(key) {
      return JSON.parse(await fs.readFile(key, 'utf-8'));
    },
    async save(key, data) {
      await fs.writeFile(key, JSON.stringify(data));
    }
  },
  
  test: {
    savePath: ':memory:',
    async load() {
      return {}; // 测试环境使用空数据
    },
    async save() {
      // 测试环境不保存数据
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const store = await createStore({}, configs[env]);
```

### 高可用配置

```javascript
const store = await createStore({}, {
  async load(key) {
    // 尝试多个数据源
    const sources = [
      () => redis.get(key),
      () => fs.readFile(key + '.backup', 'utf-8'),
      () => fetch(`/api/backup/${key}`).then(r => r.text())
    ];
    
    for (const source of sources) {
      try {
        const data = await source();
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.warn('数据源失败，尝试下一个:', error.message);
      }
    }
    
    return {}; // 所有数据源都失败
  },
  
  async save(key, data) {
    const jsonData = JSON.stringify(data);
    
    // 并行保存到多个位置
    await Promise.allSettled([
      redis.set(key, jsonData),
      fs.writeFile(key + '.backup', jsonData),
      fetch(`/api/backup/${key}`, {
        method: 'PUT',
        body: jsonData
      })
    ]);
  }
});
```

## 最佳实践

### 1. 环境检测

```javascript
const isNode = typeof window === 'undefined';
const isBrowser = typeof window !== 'undefined';

const store = await createStore({}, {
  savePath: isNode ? './data.json' : 'app-data',
  // 其他环境特定配置
});
```

### 2. 错误处理

```javascript
const store = await createStore({}, {
  async load(key) {
    try {
      return await primaryLoad(key);
    } catch (error) {
      console.warn('主加载失败，使用备用方案:', error.message);
      return await fallbackLoad(key);
    }
  },
  
  async save(key, data) {
    try {
      await primarySave(key, data);
    } catch (error) {
      console.error('保存失败:', error.message);
      // 可以选择抛出错误或使用备用保存方案
      throw error;
    }
  }
});
```

### 3. 性能优化

```javascript
// 使用缓存减少 I/O 操作
const cache = new Map();

const store = await createStore({}, {
  async load(key) {
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const data = await actualLoad(key);
    cache.set(key, data);
    return data;
  },
  
  async save(key, data) {
    cache.set(key, data);
    await actualSave(key, data);
  }
});
```

### 4. 配置验证

```javascript
function validateConfig(options) {
  if (options.savePath && typeof options.savePath !== 'string') {
    throw new Error('savePath 必须是字符串');
  }
  
  if (options.load && typeof options.load !== 'function') {
    throw new Error('load 必须是函数');
  }
  
  if (options.save && typeof options.save !== 'function') {
    throw new Error('save 必须是函数');
  }
}

const options = { /* 配置选项 */ };
validateConfig(options);
const store = await createStore({}, options);
```

## 相关链接

- [创建 Store](/api/create-store) - 了解如何使用这些配置选项
- [中间件](/api/middleware) - 扩展 Store 功能
- [CRUD 操作](/api/crud) - 基本的数据操作

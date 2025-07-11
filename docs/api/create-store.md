# 创建 Store

`createStore` 是 js-lite-rest 的核心函数，用于创建 Store 实例。

## 语法

```javascript
createStore(data?, options?)
```

## 参数

### data (可选)

**类型**: `Object | string`

初始数据或数据文件路径。

#### 作为对象传入

```javascript
const store = await createStore({
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  posts: [
    { id: 1, title: '第一篇文章', userId: 1 },
    { id: 2, title: '第二篇文章', userId: 2 }
  ]
});
```

#### 作为文件路径传入

```javascript
// Node.js 环境
const store = await createStore('./data.json');

// 浏览器环境
const store = await createStore('my-app-data');
```

### options (可选)

**类型**: `StoreOptions`

配置选项对象。

```javascript
const store = await createStore({}, {
  idKeySuffix: 'Id',
  savePath: 'custom-path',
  load: customLoadFunction,
  save: customSaveFunction,
  adapter: customAdapter
});
```

## 配置选项

### idKeySuffix

**类型**: `string`  
**默认值**: `'Id'`

ID 键的后缀，用于关联查询。

```javascript
const store = await createStore({}, {
  idKeySuffix: 'Id'  // posts 表中的 userId 字段会关联到 users 表
});
```

### savePath

**类型**: `string`  
**默认值**: Node.js 中为 `'js-lite-rest.json'`，浏览器中为 `'js-lite-rest'`

数据保存路径。

```javascript
// Node.js 环境
const store = await createStore({}, {
  savePath: './data/my-data.json'
});

// 浏览器环境
const store = await createStore({}, {
  savePath: 'my-app-storage-key'
});
```

### load

**类型**: `(key: string) => Promise<any>`

自定义数据加载函数。

```javascript
const store = await createStore({}, {
  async load(key) {
    // 从自定义存储加载数据
    const data = await myStorage.get(key);
    return JSON.parse(data);
  }
});
```

### save

**类型**: `(key: string, data: any) => Promise<void>`

自定义数据保存函数。

```javascript
const store = await createStore({}, {
  async save(key, data) {
    // 保存到自定义存储
    await myStorage.set(key, JSON.stringify(data));
  }
});
```

### adapter

**类型**: `Adapter`

自定义适配器实例。

```javascript
class CustomAdapter {
  async get(path, query) {
    // 自定义获取逻辑
  }
  
  async post(path, data) {
    // 自定义创建逻辑
  }
  
  // ... 其他方法
}

const store = await createStore({}, {
  adapter: new CustomAdapter()
});
```

## 返回值

**类型**: `Promise<Store>`

返回一个 Promise，解析为 Store 实例。

## 使用示例

### 基本用法

```javascript
// 创建空的 store
const store = await createStore();

// 创建带初始数据的 store
const store = await createStore({
  users: [],
  posts: []
});
```

### Node.js 环境

```javascript
import createStore from 'js-lite-rest';

// 使用默认文件路径
const store = await createStore({
  users: [{ id: 1, name: 'Alice' }]
});

// 使用自定义文件路径
const store = await createStore({}, {
  savePath: './data/users.json'
});

// 从现有文件加载
const store = await createStore('./existing-data.json');
```

### 浏览器环境

```javascript
// 使用默认 localStorage key
const store = await createStore();

// 使用自定义 localStorage key
const store = await createStore({}, {
  savePath: 'my-app-data'
});

// 带初始数据
const store = await createStore({
  settings: { theme: 'dark' },
  users: []
});
```

### 自定义存储

```javascript
// Redis 存储示例
const store = await createStore({}, {
  async load(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : {};
  },
  
  async save(key, data) {
    await redis.set(key, JSON.stringify(data));
  }
});

// IndexedDB 存储示例
const store = await createStore({}, {
  async load(key) {
    const db = await openDB();
    const data = await db.get('store', key);
    return data || {};
  },
  
  async save(key, data) {
    const db = await openDB();
    await db.put('store', data, key);
  }
});
```

## 错误处理

```javascript
try {
  const store = await createStore('./non-existent.json');
} catch (error) {
  console.error('创建 store 失败:', error.message);
}

// 自定义错误处理
const store = await createStore({}, {
  async load(key) {
    try {
      return await someStorage.get(key);
    } catch (error) {
      console.warn('加载失败，使用默认数据:', error.message);
      return {};
    }
  }
});
```

## 最佳实践

### 1. 数据结构设计

```javascript
const store = await createStore({
  // 使用复数形式的表名
  users: [],
  posts: [],
  comments: [],
  
  // 包含 id 字段
  categories: [
    { id: 1, name: '技术' },
    { id: 2, name: '生活' }
  ]
});
```

### 2. 关联字段命名

```javascript
const store = await createStore({
  posts: [
    { id: 1, title: '文章标题', userId: 1 }, // 使用 userId 关联用户
    { id: 2, title: '另一篇文章', categoryId: 1 } // 使用 categoryId 关联分类
  ]
}, {
  idKeySuffix: 'Id' // 确保后缀匹配
});
```

### 3. 环境检测

```javascript
const isNode = typeof window === 'undefined';

const store = await createStore({}, {
  savePath: isNode ? './data.json' : 'app-data',
  // 其他环境特定配置
});
```

### 4. 错误恢复

```javascript
const store = await createStore({}, {
  async load(key) {
    try {
      return await primaryStorage.get(key);
    } catch (error) {
      // 主存储失败，尝试备份存储
      return await backupStorage.get(key);
    }
  }
});
```

## 相关链接

- [CRUD 操作](/api/crud) - 学习基本的数据操作
- [配置选项](/api/options) - 详细的配置参数说明
- [中间件](/api/middleware) - 扩展 Store 功能

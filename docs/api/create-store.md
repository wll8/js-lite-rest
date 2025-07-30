# 创建 Store

`Store.create()` 是 js-lite-rest 的核心静态方法，用于创建 Store 实例。

## 语法

```javascript
JsLiteRest.create(data?, options?)
```

## 参数

### data (可选)

**类型**: `Object | string`

初始数据或数据文件路径。

#### 作为对象传入

```javascript
import JsLiteRest from 'js-lite-rest/browser'; // 浏览器环境
// import JsLiteRest from 'js-lite-rest'; // Node.js 环境

const store = await JsLiteRest.create({
  users: [
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' }
  ],
  posts: [
    { id: 'post1', title: '第一篇文章', usersId: 'user1' },
    { id: 'post2', title: '第二篇文章', usersId: 'user2' }
  ]
});
```

#### 作为文件路径传入

```javascript
// Node.js 环境 - 文件路径
import JsLiteRest from 'js-lite-rest';
const store = await JsLiteRest.create('./data.json');

// 浏览器环境 - 存储键名
import JsLiteRest from 'js-lite-rest/browser';
const store = await JsLiteRest.create('my-app-data');
```

### options (可选)

**类型**: `StoreOptions`

配置选项对象。

```javascript
const store = await JsLiteRest.create({}, {
  idKeySuffix: 'Id',
  savePath: 'custom-path',  // 数据存储路径
  overwrite: false,         // 是否覆盖现有数据
  adapter: customAdapter
});
```

## 配置选项

### idKeySuffix

**类型**: `string`  
**默认值**: `'Id'`

ID 键的后缀，用于关联查询。

```javascript
const store = await JsLiteRest.create({}, {
  idKeySuffix: 'Id'  // posts 表中的 usersId 字段会关联到 users 表
});
```

### savePath

**类型**: `string`  
**默认值**: Node.js 中为 `'js-lite-rest.json'`，浏览器中为 `'js-lite-rest'`

数据存储路径。在 Node.js 中作为文件路径，在浏览器中作为存储键名。

```javascript
// Node.js 环境
const store = await JsLiteRest.create({}, {
  savePath: './data/my-data.json'
});

// 浏览器环境
const store = await JsLiteRest.create({}, {
  savePath: 'my-app-storage-key'
});
```

### overwrite

**类型**: `boolean`  
**默认值**: `false`

是否覆盖现有数据。设为 `true` 时，初始数据会完全替换存储中的数据；设为 `false` 时，会合并数据。

```javascript
const store = await JsLiteRest.create({ users: [] }, {
  overwrite: true  // 完全替换现有数据
});
```

### adapter

**类型**: `Adapter`

自定义适配器实例。当提供自定义适配器时，将使用它来处理所有数据操作。


## 返回值

**类型**: `Promise<Store>`

返回一个 Promise，解析为 Store 实例。

## 使用示例

### 基本用法

```javascript
import JsLiteRest from 'js-lite-rest/browser'; // 浏览器环境
// import JsLiteRest from 'js-lite-rest'; // Node.js 环境

// 创建空的 store
const store = await JsLiteRest.create();

// 创建带初始数据的 store
const store = await JsLiteRest.create({
  users: [],
  posts: []
});
```

### Node.js 环境

```javascript
import JsLiteRest from 'js-lite-rest';

// 使用默认文件路径
const store = await JsLiteRest.create({
  users: [{ id: 'user1', name: 'Alice' }]
});

// 使用自定义文件路径
const store = await JsLiteRest.create({}, {
  savePath: './data/users.json'
});

// 从现有文件加载
const store = await JsLiteRest.create('./existing-data.json');
```

### 浏览器环境

```javascript
import JsLiteRest from 'js-lite-rest/browser';

// 使用默认存储键名
const store = await JsLiteRest.create();

// 使用自定义存储键名
const store = await JsLiteRest.create({}, {
  savePath: 'my-app-data'
});

// 带初始数据
const store = await JsLiteRest.create({
  settings: { theme: 'dark' },
  users: []
});
```

### 自定义适配器

```javascript
// 自定义内存适配器示例
class MemoryAdapter {
  constructor() {
    this.data = {};
  }
  
  async get(path, query) {
    // 实现获取逻辑
    const [resource, id] = path.split('/');
    if (id) {
      return this.data[resource]?.find(item => item.id === id);
    }
    return this.data[resource] || [];
  }
  
  async post(path, data) {
    // 实现创建逻辑
    const resource = path.split('/')[0];
    if (!this.data[resource]) this.data[resource] = [];
    
    const item = { ...data, id: this.generateId() };
    this.data[resource].push(item);
    return item;
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

const store = await JsLiteRest.create({}, {
  adapter: new MemoryAdapter()
});
```

### CDN 使用

```javascript
// UMD 版本
<script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js"></script>
<script>
  // 使用全局变量 JsLiteRest
  (async () => {
    const store = await JsLiteRest.create({
      users: [{ id: 'user1', name: 'Alice' }]
    });
    
    const users = await store.get('users');
    console.log(users);
  })();
</script>
```

## 错误处理

```javascript
try {
  const store = await JsLiteRest.create('./non-existent.json');
} catch (error) {
  console.error('创建 store 失败:', error.message);
  
  // js-lite-rest 的错误格式
  if (error.code) {
    console.log('错误代码:', error.code);
    console.log('错误消息:', error.message);
    console.log('成功状态:', error.success); // false
  }
}

// 处理数据加载错误
try {
  const store = await JsLiteRest.create('corrupted-data');
} catch (error) {
  console.warn('数据损坏，使用默认数据');
  const store = await JsLiteRest.create({
    users: [],
    posts: []
  });
}
```

# Info API

Info API 提供了获取存储信息的功能，包括表列表、存储模式、存储空间占用等信息。

## 概述

Info API 通过 `store.info` 对象提供以下方法：

- `getTables()` - 获取所有表名（数组类型的键）
- `getStorageSize()` - 获取存储空间占用大小
- `getStorageFreeSize()` - 获取存储空间剩余大小

此外，`JsLiteRest` 对象还提供：

- `JsLiteRest.driver()` - 获取底层存储驱动程序名称

## 方法详解

### getTables()

获取所有数组类型的表名。

```javascript
const store = await JsLiteRest.create({
  users: [{ id: 1, name: 'Alice' }],
  posts: [{ id: 1, title: 'Hello' }],
  config: { theme: 'dark' }, // 非数组类型，不会被包含
  tags: [] // 空数组也会被包含
});

const tables = await store.info.getTables();
console.log(tables); // ['users', 'posts', 'tags']
```

**返回值**: `Promise<string[]>` - 所有数组类型的键名列表

### getStorageSize()

获取当前存储空间的占用大小（字节）。

```javascript
const size = await store.info.getStorageSize();
console.log(`存储占用: ${size} 字节`);
console.log(`存储占用: ${(size / 1024).toFixed(2)} KB`);
```

**返回值**: `Promise<number>` - 存储占用大小（字节）

**说明**: 
- 计算基于 JSON 序列化后的字符串大小
- 使用 UTF-8 编码计算字节数
- 包括所有存储的数据

### getStorageFreeSize()

获取存储空间的剩余大小（字节）。

```javascript
const freeSize = await store.info.getStorageFreeSize();

if (freeSize === -1) {
  console.log('无法确定剩余空间（文件存储模式）');
} else {
  console.log(`剩余空间: ${freeSize} 字节`);
}
```

**返回值**: `Promise<number>` - 剩余存储空间（字节），如果无法确定则返回 -1

**说明**:
- **文件存储**: 始终返回 -1（无法准确估算磁盘剩余空间）
- **localStorage**: 返回估算的剩余空间（总容量约 5MB）
- **IndexedDB**: 尝试使用 `navigator.storage.estimate()` API，失败时返回 -1
- **远程存储**: 返回 -1（无法确定远程存储的容量）

## 完整示例

```javascript
import JsLiteRest from 'js-lite-rest';

async function displayStorageInfo() {
  const store = await JsLiteRest.create({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ],
    posts: [
      { id: 1, title: 'Hello World', content: 'This is my first post' }
    ],
    config: {
      theme: 'dark',
      language: 'zh'
    }
  });

  // 获取所有表名
  const tables = await store.info.getTables();
  console.log('数据表:', tables); // ['users', 'posts']

  // 获取存储大小
  const storageSize = await store.info.getStorageSize();
  console.log(`存储占用: ${(storageSize / 1024).toFixed(2)} KB`);

  // 获取剩余空间
  const freeSize = await store.info.getStorageFreeSize();
  if (freeSize === -1) {
    console.log('剩余空间: 无法确定');
  } else {
    console.log(`剩余空间: ${(freeSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

displayStorageInfo();
```

## 使用场景

### 1. 存储监控

```javascript
async function monitorStorage() {
  const store = await JsLiteRest.create();
  
  setInterval(async () => {
    const size = await store.info.getStorageSize();
    const freeSize = await store.info.getStorageFreeSize();
    
    console.log(`存储使用情况: ${(size / 1024).toFixed(2)} KB`);
    
    if (freeSize !== -1 && freeSize < 1024 * 1024) { // 小于 1MB
      console.warn('存储空间不足！');
    }
  }, 5000);
}
```

### 2. 数据表管理

```javascript
async function manageDataTables() {
  const store = await JsLiteRest.create();
  
  // 获取所有表
  const tables = await store.info.getTables();
  
  // 检查特定表是否存在
  if (tables.includes('users')) {
    console.log('用户表已存在');
  } else {
    // 初始化用户表
    await store.post('users', []);
  }
}
```

### 3. 环境适配

```javascript
async function adaptToEnvironment() {
  const store = await JsLiteRest.create();
  const driver = await JsLiteRest.driver();
  
  switch (driver) {
    case 'asyncStorage':
      console.log('运行在浏览器环境，使用 IndexedDB 存储');
      break;
    case 'webSQLStorage':
      console.log('运行在浏览器环境，使用 WebSQL 存储（已废弃）');
      break;
    case 'localStorageWrapper':
      console.log('运行在浏览器环境，使用 localStorage 存储');
      break;
    case 'file':
      console.log('运行在 Node.js 环境，使用文件存储');
      break;
    default:
      console.log(`使用自定义存储驱动: ${driver}`);
      break;
  }
}
```

## JsLiteRest.driver()

获取底层存储驱动程序的名称，这是一个静态方法，可以直接通过 `JsLiteRest` 对象调用。

```javascript
const driver = await JsLiteRest.driver();
console.log(driver);
```

**返回值**: `Promise<string>` - 底层存储驱动程序名称

**不同环境下的返回值**:

- **Node.js 环境**:
  - 通过 `js-lite-rest` 或 `js-lite-rest/node` 导入时，返回 `'file'`

- **浏览器环境**:
  - 通过 `js-lite-rest/browser` 导入时，返回 localforage 的当前驱动程序名称，可能的值包括：
    - `'asyncStorage'` - IndexedDB 存储（localforage 的默认首选驱动）
    - `'webSQLStorage'` - WebSQL 存储（已废弃，但某些旧浏览器仍支持）
    - `'localStorageWrapper'` - localStorage 存储的包装器

**示例**:

```javascript
async function checkDriver() {
  const driver = await JsLiteRest.driver();
  
  console.log(`底层驱动: ${driver}`);
  
  // 在浏览器环境中，可以根据驱动决定不同的行为
  if (driver === 'asyncStorage') {
    console.log('使用 IndexedDB，支持大容量存储');
  } else if (driver === 'localStorageWrapper') {
    console.log('使用 localStorage，注意存储容量限制');
  } else if (driver === 'webSQLStorage') {
    console.log('使用 WebSQL，已废弃但仍可用');
  } else if (driver === 'file') {
    console.log('使用文件存储，适合 Node.js 环境');
  }
}
```

## 注意事项

1. **存储大小计算**: 基于 JSON 序列化，实际存储大小可能因编码和压缩而有所不同
2. **剩余空间估算**: 不同存储模式的精确度不同，仅供参考
3. **性能影响**: 频繁调用这些 API 可能影响性能，建议适度使用
4. **浏览器兼容性**: `getStorageFreeSize()` 在较旧的浏览器中可能返回 -1

## 相关 API

- [创建 Store](/api/create-store) - 了解 Store 的创建和配置
- [CRUD 操作](/api/crud) - 学习基本的数据操作
- [KV 模式](/api/kv) - 了解键值对操作模式
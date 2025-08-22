# 优化数据获取

js-lite-rest 优化了 `get()` 方法，现在支持无参数调用来获取所有存储的数据，提供了更便捷的数据访问方式。

## 概述

优化后的 `get()` 方法支持以下调用方式来获取完整的数据集：

- `store.get()` - 获取所有数据
- `store.get('')` - 获取所有数据（等同于无参数调用）
- `store.get('/')` - 获取所有数据（等同于无参数调用）

## 基本用法

### 获取所有数据

```javascript
import JsLiteRest from 'js-lite-rest';

const store = await JsLiteRest.create({
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  posts: [
    { id: 1, title: 'Hello World', content: 'My first post' },
    { id: 2, title: 'JavaScript Tips', content: 'Some useful tips' }
  ],
  config: {
    theme: 'dark',
    language: 'zh'
  }
});

// 所有以下调用都返回相同的完整数据集
const allData1 = await store.get();
const allData2 = await store.get('');
const allData3 = await store.get('/');

console.log(allData1);
// {
//   users: [
//     { id: 1, name: 'Alice', email: 'alice@example.com' },
//     { id: 2, name: 'Bob', email: 'bob@example.com' }
//   ],
//   posts: [
//     { id: 1, title: 'Hello World', content: 'My first post' },
//     { id: 2, title: 'JavaScript Tips', content: 'Some useful tips' }
//   ],
//   config: {
//     theme: 'dark',
//     language: 'zh'
//   }
// }
```

### 等价性验证

```javascript
// 验证三种调用方式返回相同的结果
const data1 = await store.get();
const data2 = await store.get('');
const data3 = await store.get('/');

console.log(JSON.stringify(data1) === JSON.stringify(data2)); // true
console.log(JSON.stringify(data1) === JSON.stringify(data3)); // true
```

## 使用场景

### 1. 数据备份

```javascript
async function backupData() {
  const store = await JsLiteRest.create('my-app-data.json');
  
  // 获取所有数据进行备份
  const allData = await store.get();
  
  // 保存到备份文件
  const backupStore = await JsLiteRest.create(allData, {
    savePath: `backup-${Date.now()}.json`
  });
  
  console.log('数据备份完成');
}
```

### 2. 数据迁移

```javascript
async function migrateData() {
  // 从旧存储获取所有数据
  const oldStore = await JsLiteRest.create('old-data.json');
  const allData = await oldStore.get();
  
  // 创建新存储并迁移数据
  const newStore = await JsLiteRest.create(allData, {
    savePath: 'new-data.json'
  });
  
  console.log('数据迁移完成');
}
```

### 3. 数据分析

```javascript
async function analyzeData() {
  const store = await JsLiteRest.create();
  const allData = await store.get();
  
  // 统计各类数据的数量
  const stats = {};
  for (const [key, value] of Object.entries(allData)) {
    if (Array.isArray(value)) {
      stats[key] = {
        type: 'array',
        count: value.length
      };
    } else {
      stats[key] = {
        type: typeof value,
        hasSubKeys: typeof value === 'object' && value !== null ? Object.keys(value).length : 0
      };
    }
  }
  
  console.log('数据统计:', stats);
}
```

### 4. 数据同步

```javascript
async function syncData() {
  const localStore = await JsLiteRest.create('local-data.json');
  const allLocalData = await localStore.get();
  
  // 上传到远程服务器
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allLocalData)
  });
  
  if (response.ok) {
    console.log('数据同步成功');
  }
}
```

### 5. 调试和开发

```javascript
async function debugData() {
  const store = await JsLiteRest.create();
  
  // 在开发环境中快速查看所有数据
  if (process.env.NODE_ENV === 'development') {
    const allData = await store.get();
    console.log('当前存储的所有数据:', JSON.stringify(allData, null, 2));
  }
}
```

## 性能考虑

### 1. 内存使用

获取所有数据会将完整数据集加载到内存中，对于大型数据集需要注意内存使用：

```javascript
// 对于大型数据集，考虑分批获取
async function getLargeDataSafely() {
  const store = await JsLiteRest.create();
  
  // 先检查数据大小
  const size = await store.info.getStorageSize();
  
  if (size > 10 * 1024 * 1024) { // 大于 10MB
    console.warn('数据集较大，建议分批获取');
    
    // 分表获取
    const tables = await store.info.getTables();
    const result = {};
    
    for (const table of tables) {
      result[table] = await store.get(table);
    }
    
    return result;
  } else {
    return await store.get();
  }
}
```

### 2. 网络传输

在浏览器环境中，避免频繁获取所有数据：

```javascript
// 推荐：缓存完整数据，按需更新
class DataManager {
  constructor(store) {
    this.store = store;
    this.cache = null;
    this.lastUpdate = null;
  }
  
  async getAllData(forceRefresh = false) {
    if (!this.cache || forceRefresh || this.isStale()) {
      this.cache = await this.store.get();
      this.lastUpdate = Date.now();
    }
    return this.cache;
  }
  
  isStale() {
    return this.lastUpdate && (Date.now() - this.lastUpdate > 60000); // 1分钟过期
  }
  
  invalidateCache() {
    this.cache = null;
  }
}
```

## 与其他 API 的对比

| 调用方式 | 返回结果 | 使用场景 |
|---------|---------|---------|
| `store.get()` | 所有数据 | 数据备份、迁移、分析 |
| `store.get('users')` | users 表数据 | 获取特定表的所有记录 |
| `store.get('users/1')` | 特定用户 | 获取单条记录 |
| `store.get('users', {name: 'Alice'})` | 过滤结果 | 条件查询 |

## 注意事项

1. **数据完整性**: `get()` 返回的是数据的深拷贝，修改返回的对象不会影响存储中的原始数据
2. **内存消耗**: 大型数据集可能消耗大量内存，需要根据实际情况选择合适的获取策略
3. **性能影响**: 频繁调用 `get()` 可能影响性能，建议实现适当的缓存机制
4. **数据敏感性**: 在生产环境中谨慎使用，避免意外暴露敏感数据

## 实际应用示例

### 配置管理系统

```javascript
class ConfigManager {
  constructor(store) {
    this.store = store;
  }
  
  async exportConfig() {
    const allData = await this.store.get();
    
    // 过滤敏感信息
    const safeData = { ...allData };
    delete safeData.secrets;
    delete safeData.tokens;
    
    return JSON.stringify(safeData, null, 2);
  }
  
  async importConfig(configData) {
    const parsed = JSON.parse(configData);
    
    // 创建新存储实例进行导入
    const tempStore = await JsLiteRest.create(parsed);
    
    // 验证配置有效性
    if (await this.validateConfig(tempStore)) {
      // 替换当前配置
      const newStore = await JsLiteRest.create(parsed, {
        savePath: this.store.opt.savePath,
        overwrite: true
      });
      this.store = newStore;
      return true;
    }
    
    return false;
  }
  
  async validateConfig(store) {
    try {
      const data = await store.get();
      // 执行配置验证逻辑
      return data.version && data.settings && data.users;
    } catch (error) {
      return false;
    }
  }
}
```

## 相关 API

- [CRUD 操作](/api/crud) - 了解基本的数据操作
- [查询过滤](/api/query) - 学习条件查询和过滤
- [Info API](/api/info) - 获取存储信息和统计数据
- [KV 模式](/api/kv) - 键值对操作模式
# API 文档

欢迎使用 js-lite-rest API 文档！这里提供了完整的 API 参考和使用指南。

## 快速开始

### 安装

```bash
npm install js-lite-rest
```

### 基本使用

```javascript
import JsLiteRest from 'js-lite-rest';

// 创建 store 实例
const store = await JsLiteRest.create({
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
});

// 基本 CRUD 操作
const users = await store.get('users');           // 获取所有用户
const user = await store.get('users/1');          // 获取特定用户
const newUser = await store.post('users', { name: 'Charlie' }); // 创建用户
await store.put('users/1', { name: 'Alice Smith' }); // 更新用户
await store.delete('users/1');                    // 删除用户
```

### 浏览器使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>js-lite-rest 示例</title>
    <script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.umd.js"></script>
</head>
<body>
    <script>
        async function main() {
            // 在浏览器中使用 localStorage 存储
            const store = await JsLiteRest.create();
            
            // 添加数据
            await store.post('users', { name: 'Alice', email: 'alice@example.com' });
            
            // 查询数据
            const users = await store.get('users');
            console.log('用户列表:', users);
        }
        
        main();
    </script>
</body>
</html>
```

## 核心概念

### Store 实例

Store 是 js-lite-rest 的核心，它提供了所有的数据操作方法。

```javascript
// 使用初始数据创建 store
const store = await JsLiteRest.create({
  users: [],
  posts: []
});

// 使用配置选项创建 store
const store = await JsLiteRest.create({}, {
  savePath: 'my-data.json',
  idKeySuffix: 'Id'
});
```

### HTTP 方法映射

js-lite-rest 提供了标准的 HTTP 方法映射：

| HTTP 方法 | Store 方法 | 说明 |
|-----------|------------|------|
| GET | `store.get()` | 获取数据 |
| POST | `store.post()` | 创建数据 |
| PUT | `store.put()` | 完整更新数据 |
| PATCH | `store.patch()` | 部分更新数据 |
| DELETE | `store.delete()` | 删除数据 |

### 路径规则

js-lite-rest 使用类似 RESTful API 的路径规则：

```javascript
// 集合操作
await store.get('users');           // 获取所有用户
await store.post('users', data);    // 创建新用户

// 资源操作
await store.get('users/1');         // 获取 ID 为 1 的用户
await store.put('users/1', data);   // 更新 ID 为 1 的用户
await store.delete('users/1');      // 删除 ID 为 1 的用户

// 嵌套资源
await store.get('posts/1/comments'); // 获取文章 1 的所有评论
await store.post('posts/1/comments', data); // 为文章 1 添加评论
```

## 环境支持

### Node.js 环境

在 Node.js 中，数据默认保存到文件系统：

```javascript
import JsLiteRest from 'js-lite-rest';

const store = await JsLiteRest.create({
  users: []
}, {
  savePath: './data/users.json' // 自定义保存路径
});
```

### 浏览器环境

在浏览器中，数据默认保存到 localStorage：

```javascript
// 使用默认的 localStorage key
const store = await JsLiteRest.create();

// 使用自定义的 localStorage key
const store = await JsLiteRest.create({}, {
  savePath: 'my-app-data'
});
```

## 数据持久化

js-lite-rest 支持多种数据持久化方式：

### 自动持久化

默认情况下，所有数据修改操作都会自动持久化：

```javascript
const store = await JsLiteRest.create();

// 这些操作会自动保存到存储中
await store.post('users', { name: 'Alice' });
await store.put('users/1', { name: 'Alice Smith' });
await store.delete('users/1');
```

### 自定义存储

你可以提供自定义的加载和保存函数：

```javascript
const store = await JsLiteRest.create({}, {
  async load(key) {
    // 自定义加载逻辑
    return JSON.parse(await someStorage.get(key));
  },
  async save(key, data) {
    // 自定义保存逻辑
    await someStorage.set(key, JSON.stringify(data));
  }
});
```

## 错误处理

js-lite-rest 提供了清晰的错误信息：

```javascript
try {
  await store.get('users/999'); // 不存在的资源
} catch (error) {
  console.error('操作失败:', error.message);
}

try {
  await store.post('users', {}); // 无效数据
} catch (error) {
  console.error('验证失败:', error.message);
}
```

## 性能考虑

### 批量操作

对于大量数据操作，建议使用批量方法：

```javascript
// 批量创建
const users = [
  { name: 'Alice' },
  { name: 'Bob' },
  { name: 'Charlie' }
];
await store.post('users', users);

// 批量更新
const updates = [
  { id: 1, name: 'Alice Smith' },
  { id: 2, name: 'Bob Jones' }
];
await store.put('users', updates);

// 批量删除
await store.delete('users', ['user1', 'user2', 'user3']);
```

### 查询优化

使用合适的查询参数来减少数据传输：

```javascript
// 使用分页
await store.get('users', { _page: 1, _limit: 10 });

// 使用过滤条件
await store.get('users', { status: 'active', age_gte: 18 });

// 排除多个值
await store.get('users', { role_ne: ['admin', 'guest', 'test'] });

// 获取所有数据
const allData = await store.get(); // 等同于 store.get('') 和 store.get('/')
```

## 下一步

### 基础功能
- [创建 Store](/api/create-store) - 了解如何创建和配置 Store 实例
- [CRUD 操作](/api/crud) - 掌握基本的增删改查操作
- [查询过滤](/api/query) - 学习高级查询功能

### 高级功能
- [优化数据获取](/api/enhanced-get) - 获取完整数据集的新方法
- [_ne 数组支持](/api/array-ne-operator) - 使用数组排除多个值
- [关系操作](/api/relations) - 处理关联数据
- [嵌套数组](/api/nested-arrays) - 管理数组项中的数组

### 专用模式
- [KV 模式](/api/kv) - 键值对操作模式
- [Info API](/api/info) - 获取存储信息和统计数据

### 扩展功能
- [中间件](/api/middleware) - 扩展功能和自定义逻辑


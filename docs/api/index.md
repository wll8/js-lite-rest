# API 文档

欢迎使用 js-lite-rest API 文档！这里提供了完整的 API 参考和使用指南。

## 快速开始

### 安装

```bash
npm install js-lite-rest
```

### 基本使用

```javascript
import createStore from 'js-lite-rest';

// 创建 store 实例
const store = await createStore({
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
    <script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js"></script>
</head>
<body>
    <script>
        async function main() {
            // 在浏览器中使用 localStorage 存储
            const store = await createStore();
            
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
const store = await createStore({
  users: [],
  posts: []
});

// 使用配置选项创建 store
const store = await createStore({}, {
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
import createStore from 'js-lite-rest';

const store = await createStore({
  users: []
}, {
  savePath: './data/users.json' // 自定义保存路径
});
```

### 浏览器环境

在浏览器中，数据默认保存到 localStorage：

```javascript
// 使用默认的 localStorage key
const store = await createStore();

// 使用自定义的 localStorage key
const store = await createStore({}, {
  savePath: 'my-app-data'
});
```

## 数据持久化

js-lite-rest 支持多种数据持久化方式：

### 自动持久化

默认情况下，所有数据修改操作都会自动持久化：

```javascript
const store = await createStore();

// 这些操作会自动保存到存储中
await store.post('users', { name: 'Alice' });
await store.put('users/1', { name: 'Alice Smith' });
await store.delete('users/1');
```

### 自定义存储

你可以提供自定义的加载和保存函数：

```javascript
const store = await createStore({}, {
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
await store.delete('users', { id: [1, 2, 3] });
```

### 查询优化

使用合适的查询参数来减少数据传输：

```javascript
// 使用分页
await store.get('users', { _page: 1, _limit: 10 });

// 使用字段选择
await store.get('users', { _select: ['id', 'name'] });

// 使用过滤条件
await store.get('users', { status: 'active', age_gte: 18 });
```

## 下一步

- [创建 Store](/api/create-store) - 了解如何创建和配置 Store 实例
- [CRUD 操作](/api/crud) - 掌握基本的增删改查操作
- [查询过滤](/api/query) - 学习高级查询功能
- [关系操作](/api/relations) - 处理关联数据
- [中间件](/api/middleware) - 扩展功能和自定义逻辑
- [配置选项](/api/options) - 详细的配置参数说明

## 在线体验

想要立即体验 js-lite-rest？访问我们的[在线示例](/demo/)，或者在当前页面的浏览器控制台中直接使用：

```javascript
// js-lite-rest 已全局加载，可直接使用
const store = await createStore({ users: [] });
console.log('Store 创建成功！', store);
```

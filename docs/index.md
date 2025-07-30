---
layout: home

hero:
  name: "js-lite-rest"
  text: "纯前端 RESTful 风格增删改查库"
  tagline: 轻量级、零依赖、跨平台的数据存储解决方案
  actions:
    - theme: brand
      text: 快速开始
      link: /api/
    - theme: alt
      text: 在线演示
      link: https://wll8.github.io/js-lite-rest/html-demo/
    - theme: alt
      text: GitHub
      link: https://github.com/wll8/js-lite-rest

features:
  - icon: 🚀
    title: 轻量级
    details: 零依赖，压缩后仅几KB，不会增加项目负担
  - icon: 🌐
    title: 跨平台
    details: 同时支持 Node.js 和浏览器环境，一套代码多端运行
  - icon: 📦
    title: 多种存储
    details: 支持内存、文件系统、localStorage 等多种存储方式
  - icon: 🔄
    title: RESTful API
    details: 提供标准的 HTTP 风格 CRUD 操作接口，学习成本低
  - icon: 🎯
    title: TypeScript 支持
    details: 完整的类型定义，提供优秀的开发体验
  - icon: 🔧
    title: 可扩展
    details: 支持中间件和自定义适配器，满足各种定制需求
  - icon: ⚡
    title: 高性能
    details: 异步操作设计，支持批量操作，性能表现优异
  - icon: 🔗
    title: 关联查询
    details: 支持嵌套资源和关联数据查询，处理复杂数据关系
  - icon: 📝
    title: 丰富查询
    details: 支持过滤、排序、分页、全文搜索等高级查询功能
---

## 快速体验

在浏览器控制台中直接体验 js-lite-rest：

```javascript
// 引入 js-lite-rest (如果通过 CDN 引入，则为全局变量 JsLiteRest)
import JsLiteRest from 'js-lite-rest/browser';

// 创建 store 实例，注意必须使用 Store.create() 方法
const store = await JsLiteRest.create({
  users: [
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' }
  ]
});

// 获取所有用户
const users = await store.get('users');
console.log('所有用户:', users);

// 添加新用户（ID 会自动生成）
const newUser = await store.post('users', { name: 'Charlie', email: 'charlie@example.com' });
console.log('新用户:', newUser);

// 查询用户
const filteredUsers = await store.get('users', { name_like: 'A' });
console.log('名字包含A的用户:', filteredUsers);
```

## 安装使用

### NPM 安装

```bash
# 使用 npm
npm install js-lite-rest

# 使用 pnpm
pnpm add js-lite-rest

# 使用 yarn
yarn add js-lite-rest
```

### 环境特定导入

```javascript
// Node.js 环境
import JsLiteRest from 'js-lite-rest';
// 或者显式指定 Node.js 版本
import JsLiteRest from 'js-lite-rest/node';

// 浏览器环境 (ES Module)
import JsLiteRest from 'js-lite-rest/browser';

// 浏览器环境 (CommonJS，如果支持)
const JsLiteRest = require('js-lite-rest');
```

### CDN 引入

```html
<!-- UMD 版本，直接通过 script 标签引入 -->
<script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js"></script>
<script>
  // 使用全局变量 JsLiteRest
  const store = await JsLiteRest.create();
</script>

<!-- ES Module 版本 -->
<script type="module">
  import JsLiteRest from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.esm.js';
  const store = await JsLiteRest.create();
</script>
```

## 主要特性

### 🎯 简单易用

```javascript
// 创建 store - 注意必须使用异步的 create() 方法
const store = await JsLiteRest.create();

// CRUD 操作
await store.post('users', { name: 'Alice' });         // 创建，ID 自动生成
const users = await store.get('users');               // 读取所有
const user = await store.get('users/abc123');         // 读取单个
await store.put('users/abc123', { name: 'Bob' });     // 完全更新
await store.patch('users/abc123', { age: 25 });       // 部分更新
await store.delete('users/abc123');                   // 删除
```

### 🔍 强大查询

```javascript
// 过滤查询
await store.get('users', { age_gte: 18, city: '北京' });

// 排序分页
await store.get('users', { 
  _sort: 'age', 
  _order: 'desc', 
  _page: 1, 
  _limit: 10 
});

// 全文搜索
await store.get('users', { _q: '张三' });

// 复杂查询组合
await store.get('users', {
  age_gte: 18,
  city_like: '北京',
  _sort: 'createdAt',
  _order: 'desc'
});
```

### 🔗 关联操作

```javascript
// 嵌套资源
await store.get('posts/1/comments');
await store.post('posts/1/comments', { content: '很好的文章！' });

// 关联嵌入
await store.get('posts', { _embed: 'comments' });
await store.get('comments', { _expand: 'post' });
```

### 🛠️ 中间件支持

```javascript
// 添加日志中间件
store.use(async (args, next, opt) => {
  const [method, path, data] = args;
  console.log(`请求: ${method.toUpperCase()} ${path}`, data);
  
  const result = await next();
  
  console.log('响应:', result);
  return result;
});

// 添加验证中间件
store.use(async (args, next, opt) => {
  const [method, path, data] = args;
  
  if (method === 'post' && path === 'users') {
    if (!data.name) {
      throw { code: 400, success: false, message: 'name 是必填字段' };
    }
    if (!data.email) {
      throw { code: 400, success: false, message: 'email 是必填字段' };
    }
  }
  
  return next();
});

// 添加时间戳中间件
store.use(async (args, next, opt) => {
  const [method, path, data] = args;
  
  if (method === 'post' && data) {
    data.createdAt = new Date().toISOString();
  }
  if (method === 'put' && data) {
    data.updatedAt = new Date().toISOString();
  }
  
  return next();
});
```

### 📦 批量操作

```javascript
// 批量创建
const users = await store.post('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);

// 批量更新
await store.put('users', [
  { id: 'user1', name: 'Alice Updated' },
  { id: 'user2', name: 'Bob Updated' }
]);

// 批量删除
await store.delete('users', ['user1', 'user2']);

// 部分成功处理
try {
  await store.post('users', [
    { name: 'Valid User' },
    { /* 缺少必填字段 */ }
  ]);
} catch (error) {
  // error.data 包含成功的记录
  // error.error 包含失败的记录和错误信息
}
```

### 🗄️ 数据持久化

```javascript
// 浏览器环境 - 自动使用 IndexedDB/localStorage
const browserStore = await JsLiteRest.create(initialData, {
  savePath: 'my-app-data'  // 数据库名称
});

// Node.js 环境 - 自动使用文件系统
const nodeStore = await JsLiteRest.create(initialData, {
  savePath: 'my-app-data.json'  // 文件路径
});

// 内存模式 - 不持久化
const memoryStore = await JsLiteRest.create(initialData, {
  adapter: 'memory'
});
```

## 使用场景

- **原型开发**: 快速搭建前端原型，无需后端支持
- **单机应用**: 桌面应用或移动应用的本地数据存储
- **测试环境**: 为前端测试提供模拟数据服务
- **学习演示**: 教学和演示 RESTful API 概念
- **离线应用**: 支持离线数据操作的 PWA 应用
- **Mock 服务**: 前端开发时的数据模拟
- **小型工具**: 不需要复杂后端的小型管理工具

## 性能特点

- **轻量级**: 零依赖，gzip 压缩后仅 ~8KB
- **异步优先**: 所有操作均为异步，不阻塞主线程
- **高效查询**: 内建索引和优化算法，支持复杂查询
- **批量支持**: 原生支持批量操作，减少调用次数
- **内存友好**: 智能数据管理，避免内存泄漏

## 兼容性

- **Node.js**: >= 14.0.0
- **浏览器**: 
  - Chrome >= 63
  - Firefox >= 67
  - Safari >= 13
  - Edge >= 79
- **环境**: 支持 ES2020+ 语法

## 生态系统

| 项目 | 状态 | 描述 |
|------|------|------|
| [js-lite-rest](https://github.com/wll8/js-lite-rest) | ✅ 稳定 | 核心库 |
| - | 🚧 开发中 | 命令行工具 |
| - | 📋 计划中 | 可视化管理界面 |

## 在线演示

您可以通过以下链接体验 js-lite-rest 的各种功能：

- [基础 CRUD 操作](https://wll8.github.io/js-lite-rest/html-demo/basic-crud.html) - 展示增删改查基本功能
- [博客系统示例](https://wll8.github.io/js-lite-rest/html-demo/blog-system.html) - 完整的博客管理系统
- [查询功能演示](https://wll8.github.io/js-lite-rest/html-demo/query-features.html) - 各种查询和过滤功能
- [中间件使用](https://wll8.github.io/js-lite-rest/html-demo/middleware.html) - 中间件的使用方法
- [性能测试](https://wll8.github.io/js-lite-rest/html-demo/performance.html) - 性能基准测试

---

<div class="text-center mt-8">
  <p class="text-gray-600">
    开始探索 js-lite-rest 的强大功能吧！
  </p>
  <div class="flex justify-center space-x-4 mt-4">
    <a href="/api/" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">查看文档</a>
    <a href="https://wll8.github.io/js-lite-rest/html-demo/" target="_blank" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">在线示例</a>
    <a href="https://github.com/wll8/js-lite-rest" class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">GitHub</a>
  </div>
</div>


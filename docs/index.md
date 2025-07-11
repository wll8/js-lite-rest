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
      text: 在线示例
      link: /demo/
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
// 全局已加载 js-lite-rest，可直接使用
const store = await createStore({
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
});

// 获取所有用户
const users = await store.get('users');
console.log('所有用户:', users);

// 添加新用户
const newUser = await store.post('users', { name: 'Charlie', email: 'charlie@example.com' });
console.log('新用户:', newUser);

// 查询用户
const filteredUsers = await store.get('users', { name_like: 'A' });
console.log('名字包含A的用户:', filteredUsers);
```

## 安装使用

### NPM 安装

```bash
npm install js-lite-rest
```

### CDN 引入

```html
<!-- UMD 版本 -->
<script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js"></script>

<!-- ES Module 版本 -->
<script type="module">
  import createStore from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.esm.js';
</script>
```

## 主要特性

### 🎯 简单易用

```javascript
// 创建 store
const store = await createStore();

// CRUD 操作
await store.post('users', { name: 'Alice' });    // 创建
const users = await store.get('users');          // 读取
await store.put('users/1', { name: 'Bob' });     // 更新
await store.delete('users/1');                   // 删除
```

### 🔍 强大查询

```javascript
// 过滤查询
await store.get('users', { age_gte: 18, city: '北京' });

// 排序分页
await store.get('users', { _sort: 'age', _order: 'desc', _page: 1, _limit: 10 });

// 全文搜索
await store.get('users', { _q: '张三' });
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
store.use(async (args, next) => {
  console.log('请求:', args);
  const result = await next();
  console.log('响应:', result);
  return result;
});

// 添加验证中间件
store.use(async (args, next) => {
  const [method, path, data] = args;
  if (method === 'post' && !data.name) {
    throw new Error('name 是必填字段');
  }
  return next();
});
```

## 使用场景

- **原型开发**: 快速搭建前端原型，无需后端支持
- **单机应用**: 桌面应用或移动应用的本地数据存储
- **测试环境**: 为前端测试提供模拟数据服务
- **学习演示**: 教学和演示 RESTful API 概念
- **离线应用**: 支持离线数据操作的 PWA 应用

## 生态系统

| 项目 | 状态 | 描述 |
|------|------|------|
| [js-lite-rest](https://github.com/wll8/js-lite-rest) | ✅ 稳定 | 核心库 |
| [js-lite-rest-cli](https://github.com/wll8/js-lite-rest-cli) | 🚧 开发中 | 命令行工具 |
| [js-lite-rest-ui](https://github.com/wll8/js-lite-rest-ui) | 📋 计划中 | 可视化管理界面 |

---

<div class="text-center mt-8">
  <p class="text-gray-600">
    开始探索 js-lite-rest 的强大功能吧！
  </p>
  <div class="flex justify-center space-x-4 mt-4">
    <a href="/api/" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">查看文档</a>
    <a href="/demo/" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">在线示例</a>
    <a href="https://github.com/wll8/js-lite-rest" class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">GitHub</a>
  </div>
</div>


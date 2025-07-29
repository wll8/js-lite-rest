# js-lite-rest

[![npm version](https://badge.fury.io/js/js-lite-rest.svg)](https://badge.fury.io/js/js-lite-rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

纯前端 RESTful 风格增删改查库，适用于单机应用和原型开发。无需后端服务器，即可实现完整的数据 CRUD 操作。

**📚 [文档地址](https://wll8.github.io/js-lite-rest/) | 🎮 [在线示例](https://wll8.github.io/js-lite-rest/html-demo/)**

> [English Documentation](./README.en.md)

## ✨ 特性

- 🚀 **轻量级**：零依赖，压缩后仅几KB
- 🌐 **跨平台**：同时支持 Node.js 和浏览器环境
- 📦 **多种存储**：支持内存、文件系统、localStorage 存储
- 🔄 **RESTful API**：提供标准的 HTTP 风格 CRUD 操作接口
- 🎯 **TypeScript 支持**：完整的类型定义，开发体验更佳
- 🔧 **可扩展**：支持中间件和自定义适配器
- ⚡ **异步操作**：所有操作都是异步的，性能更好
- 🔗 **关联查询**：支持嵌套资源和关联数据查询
- 📝 **批量操作**：支持批量增删改查操作

## 📦 安装

```bash
npm install js-lite-rest
```

或者使用其他包管理器：

```bash
yarn add js-lite-rest
pnpm add js-lite-rest
```

### CDN 引入

```html
<!-- ES Module -->
<script type="module">
  import createStore from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.esm.js';
</script>

<!-- UMD (全局变量) -->
<script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js"></script>
```

## 🚀 快速开始

### Node.js 环境

```js
import createStore from 'js-lite-rest';

// 创建 store 实例，数据将保存到文件
const store = await createStore({
  books: [
    { id: 1, title: 'JavaScript 权威指南', author: 'David Flanagan' },
    { id: 2, title: 'Node.js 实战', author: 'Mike Cantelon' }
  ]
});

// 查询所有书籍
const books = await store.get('books');
console.log(books); // 返回所有书籍

// 获取特定书籍
const book = await store.get('books/1');
console.log(book); // { id: 1, title: 'JavaScript 权威指南', author: 'David Flanagan' }

// 添加新书籍（自动生成 ID）
const newBook = await store.post('books', { title: 'Vue.js 实战', author: 'John Doe' });
console.log(newBook); // { id: 3, title: 'Vue.js 实战', author: 'John Doe' }

// 更新书籍
await store.put('books/1', { title: 'JavaScript 高级程序设计', author: 'Nicholas C. Zakas' });

// 部分更新
await store.patch('books/1', { author: 'Nicholas Zakas' });

// 删除书籍
await store.delete('books/2');
```

### 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
  <title>js-lite-rest 示例</title>
  <script type="module">
    import createStore from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.esm.js';

    // 在浏览器中使用 localStorage 存储
    const store = await createStore();

    // 添加用户数据
    await store.post('users', { name: 'Alice', email: 'alice@example.com' });
    await store.post('users', { name: 'Bob', email: 'bob@example.com' });

    // 查询所有用户
    const users = await store.get('users');
    console.log('所有用户:', users);

    // 查询特定用户
    const user = await store.get('users/1');
    console.log('用户 1:', user);
  </script>
</head>
<body>
  <h1>js-lite-rest 浏览器示例</h1>
  <p>打开控制台查看输出结果</p>
</body>
</html>
```


## 📖 API 文档

### createStore(data?, options?)

创建一个新的 store 实例。

#### 参数

**data** (可选)
- **类型**: `string | object | null`
- **默认值**: `{}`

数据源配置：
- **字符串**:
  - Node.js 环境：作为 JSON 文件路径
  - 浏览器环境：作为 localStorage 的 key
- **对象**: 直接使用该对象作为初始数据
- **null**: 使用自定义适配器（需在 options 中配置）
- **未传入**: 使用默认存储位置
  - 浏览器：localStorage key 为 `js-lite-rest`
  - Node.js：当前目录下的 `js-lite-rest.json` 文件

**options** (可选)
- **类型**: `StoreOptions`

配置选项：
- `idKeySuffix`: ID 键后缀，默认为 `'Id'`
- `savePath`: 自定义保存路径
- `load`: 自定义加载函数
- `save`: 自定义保存函数
- `adapter`: 自定义适配器

### Store 实例方法

#### GET 操作

```js
// 获取所有记录
await store.get('users');

// 获取特定记录
await store.get('users/1');

// 嵌套资源查询
await store.get('posts/1/comments');
```

#### POST 操作

```js
// 添加单条记录
await store.post('users', { name: 'Alice', email: 'alice@example.com' });

// 批量添加
await store.post('users', [
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);

// 嵌套资源添加
await store.post('posts/1/comments', { content: '很好的文章！' });
```

#### PUT 操作

```js
// 完全替换记录
await store.put('users/1', { name: 'Alice Smith', email: 'alice.smith@example.com' });

// 批量更新
await store.put('users', [
  { id: 1, name: 'Alice Updated' },
  { id: 2, name: 'Bob Updated' }
]);
```

#### PATCH 操作

```js
// 部分更新记录
await store.patch('users/1', { name: 'Alice Johnson' });
```

#### DELETE 操作

```js
// 删除单条记录
await store.delete('users/1');

// 批量删除
await store.delete('users', { id: [1, 2, 3] });
```

## 🔧 高级用法

### 中间件

使用中间件可以在请求前后执行自定义逻辑：

```js
const store = await createStore();

// 添加日志中间件
store.use(async (args, next, opt) => {
  const [method, path] = args;
  console.log(`${method.toUpperCase()} ${path}`);

  const result = await next();
  console.log('结果:', result);

  return result;
});

// 添加验证中间件
store.use(async (args, next, opt) => {
  const [method, path, data] = args;

  if (method === 'post' && path === 'users') {
    if (!data.email) {
      throw new Error('邮箱是必填项');
    }
  }

  return next();
});
```

### 自定义适配器

```js
// 创建自定义适配器
class CustomAdapter {
  constructor(config) {
    this.config = config;
  }

  async get(path) {
    // 自定义获取逻辑
  }

  async post(path, data) {
    // 自定义创建逻辑
  }

  // ... 其他方法
}

// 使用自定义适配器
const store = await createStore(null, {
  adapter: new CustomAdapter({ /* 配置 */ })
});
```

### 关联数据

支持嵌套资源和关联查询：

```js
const store = await createStore({
  posts: [
    { id: 1, title: '第一篇文章', authorId: 1 },
    { id: 2, title: '第二篇文章', authorId: 2 }
  ],
  comments: [
    { id: 1, content: '很好的文章！', postId: 1 },
    { id: 2, content: '我也这么认为', postId: 1 }
  ]
});

// 获取文章的所有评论
const comments = await store.get('posts/1/comments');
console.log(comments); // 返回 postId 为 1 的所有评论
```

## 🛠️ 开发

### 环境要求

- Node.js 20+
- pnpm 10+

### 开发脚本

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build

# 开发文档
pnpm docs:dev

# 构建文档
pnpm docs:build
```

### 技术栈

- **构建工具**: Rollup
- **测试框架**: Mocha + Chai
- **代码规范**: @antfu/eslint-config
- **文档**: VitePress
- **包管理**: pnpm

## 📋 待办事项

- [x] JSON 适配器
- [x] 浏览器支持
- [x] 中间件系统
- [x] Node.js 支持
- [x] TypeScript 类型定义
- [x] 批量操作
- [x] 嵌套资源
- [ ] SQLite 适配器
- [ ] 数据验证
- [ ] 查询过滤器

## 🔗 相关项目

- [Dexie](https://github.com/dexie/Dexie.js) - 现代浏览器 IndexedDB 包装器
- [PouchDB](https://pouchdb.com/) - 浏览器和 Node.js 的数据库
- [JSStore](https://jsstore.net/) - 类 SQL 的 IndexedDB 包装器
- [Lovefield](https://github.com/google/lovefield) - Google 的关系型数据库库

## 📄 许可证

[MIT](./LICENSE) © [xw](https://github.com/wll8)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request
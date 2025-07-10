# js-lite-rest

[![npm version](https://badge.fury.io/js/js-lite-rest.svg)](https://badge.fury.io/js/js-lite-rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一套 ECMAScript 类似于 json-server 的 RESTful 接口，像 BS 风格那样操作本地轻量数据的应用场景，例如做一个单机的客户端管理应用程序。通过 `store.get("book/1")` 获取图书详情，但无需 SQL 支持。

## 特性

- 🚀 **轻量级**：无依赖，体积小
- 🌐 **跨平台**：同时支持 Node.js 和浏览器环境
- 📦 **多种存储**：支持内存、文件、localStorage 存储
- 🔄 **RESTful API**：提供类似 HTTP 的 CRUD 操作接口
- 🎯 **TypeScript 支持**：完整的类型定义
- 🔧 **可扩展**：支持中间件和自定义适配器
- ⚡ **异步操作**：所有操作都是异步的，性能更好

## 安装

```bash
npm install js-lite-rest
```

或者使用其他包管理器：

```bash
yarn add js-lite-rest
pnpm add js-lite-rest
```

## 快速开始

### Node.js 环境

```js
import createStore from 'js-lite-rest';

// 创建 store 实例
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

// 添加新书籍
await store.post('books', { title: 'Vue.js 实战', author: 'John Doe' });

// 更新书籍
await store.put('books/1', { title: 'JavaScript 高级程序设计', author: 'Nicholas C. Zakas' });

// 删除书籍
await store.delete('books/2');
```

### 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import createStore from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.esm.js';

    // 在浏览器中使用 localStorage 存储
    const store = await createStore();

    // 添加数据
    await store.post('users', { name: 'Alice', email: 'alice@example.com' });

    // 查询数据
    const users = await store.get('users');
    console.log(users);
  </script>
</head>
<body>
</body>
</html>
```


## 参数

### Store(data, opt)

data 数据源。
  如果传入字符串：
    在 nodejs 作为 json 文件路径。
    在浏览器环境作为 localStorage 的 key。
  如果传入 json 对象：
    则直接操作该 json 对象。
  如果不传入任何内容：
    在浏览器环境下会使用 localStorage 存储数据，存储的 key 为 `js-lite-rest`。
    在 node 环境下会在启动目录创建 js-lite-rest.json 的数据。
  如果传入 null：
    则表示自定义数据源，在 opt 选项中进行详细定义，例如将操作转发到 sql 或 http 接口。

opt 配置选项。
  传入拦截器：
    可以对数据进行前置、后置等操作。
  传入适配器，data 为 null 时可用：
    支持适配器：
      json(data) - 默认适配器，将数据转为 json，可在 node 和浏览器中使用。参数和 Store 中的 data 一样。
      sqlLite(dbUrl) - 转换请求为 sqlLite 数据库语句。

## todo
  - [ ] feat: json 适配器
  - [ ] feat: 浏览器支持
  - [ ] feat: 拦截器
  - [ ] feat: nodejs 支持
  - [ ] feat: sqlLite 适配器

## 开发环境

- vitest 测试框架
- rollup 适用于 cmd umd esm 的库
- antfu/eslint-config
- pnpm 10
- nodejs 20


## 相似项目

- [Dexie](https://github.com/dexie/Dexie.js) - 浏览器数据库
- https://pouchdb.com/
- https://jsstore.net/
- https://github.com/google/lovefield
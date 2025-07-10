# js-store

一套 ecma js 类似于 json-server 的 RESTful 接口，像 BS 风格那样操作操作本地轻量数据的应用场景，例如做一个单机的客户端管理应用程序。通过 `store.get("book/1")` 获取图书详情，但无需 sql 支持。

## 使用

``` js
const jsonObject = {
  book: [],
}

const store = new Store(jsonObject)

// 查询数据
await store.get("book", {
  title: "css",
})

// 获取详情
await store.get("book/1")
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
    在浏览器环境下会使用 localStorage 存储数据，存储的 key 为 `js-store`。
    在 node 环境下会在启动目录创建 js-store.json 的数据。
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
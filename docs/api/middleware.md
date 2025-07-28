# 中间件

js-lite-rest 提供了强大的中间件系统，允许你在请求前后执行自定义逻辑，实现日志记录、数据验证、权限控制、缓存等功能。

## 基本概念

中间件是一个异步函数，接收请求参数、下一个中间件函数和配置选项，可以在请求执行前后进行处理。

### 中间件签名

```javascript
async function middleware(args, next, opt) {
  // args: [method, path, data, query] - 请求参数
  // next: () => Promise<any> - 调用下一个中间件或核心逻辑
  // opt: StoreOptions - Store 配置选项
  
  // 前置处理
  console.log('请求开始');
  
  // 调用下一个中间件
  const result = await next();
  
  // 后置处理
  console.log('请求完成');
  
  return result;
}
```

## 添加中间件

### 使用 use() 方法

```javascript
const store = await createStore();

// 添加日志中间件
store.use(async (args, next) => {
  const [method, path] = args;
  console.log(`${method.toUpperCase()} ${path}`);
  return next();
});

// 添加多个中间件
store.use(middleware1);
store.use(middleware2);
store.use(middleware3);
```

### 中间件执行顺序

中间件按照添加顺序执行，形成洋葱模型：

```javascript
store.use(async (args, next) => {
  console.log('中间件 1 - 前置');
  const result = await next();
  console.log('中间件 1 - 后置');
  return result;
});

store.use(async (args, next) => {
  console.log('中间件 2 - 前置');
  const result = await next();
  console.log('中间件 2 - 后置');
  return result;
});

// 执行 store.get('users') 时的输出：
// 中间件 1 - 前置
// 中间件 2 - 前置
// [核心逻辑执行]
// 中间件 2 - 后置
// 中间件 1 - 后置
```

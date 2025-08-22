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
const store = await JsLiteRest.create();

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

## 内置拦截器

js-lite-rest 提供了一些内置的拦截器，可以直接使用：

### lite 拦截器

`lite` 拦截器将 HTTP 风格的响应对象转换为纯数据格式，简化使用。

```javascript
import { interceptor } from 'js-lite-rest';

const store = await JsLiteRest.create();

// 使用 lite 拦截器
store.use(interceptor.lite);

// 现在所有操作都会返回纯数据，而不是包含 success、code 等字段的响应对象
const users = await store.get('users'); // 直接返回用户数组
const newUser = await store.post('users', { name: 'Alice' }); // 直接返回新创建的用户对象
```

**作用对比**:

```javascript
// 不使用 lite 拦截器时
const response = await store.get('users');
console.log(response);
// {
//   success: true,
//   code: 200,
//   data: [{ id: 1, name: 'Alice' }],
//   message: '成功'
// }

// 使用 lite 拦截器后
const users = await store.get('users');
console.log(users);
// [{ id: 1, name: 'Alice' }]
```

**错误处理**:

使用 `lite` 拦截器时，错误会直接抛出，而不是返回错误响应对象：

```javascript
store.use(interceptor.lite);

try {
  const user = await store.get('users/999'); // 不存在的用户
} catch (error) {
  console.log(error); // 直接是错误信息字符串
}
```

## 高级中间件示例

### 权限验证中间件

```javascript
function createAuthMiddleware(requiredRole = 'user') {
  return async (args, next, opt) => {
    const [method, path] = args;
    
    // 检查当前用户权限
    const currentUser = opt.currentUser;
    if (!currentUser) {
      throw new Error('未登录');
    }
    
    if (method !== 'get' && currentUser.role !== requiredRole) {
      throw new Error('权限不足');
    }
    
    return await next();
  };
}

// 使用
store.use(createAuthMiddleware('admin'));
```

### 数据加密中间件

```javascript
const encryptionMiddleware = async (args, next, opt) => {
  const [method, path, data] = args;
  
  // 对写入的敏感数据进行加密
  if ((method === 'post' || method === 'put') && path === 'users' && data) {
    if (data.password) {
      args[2] = { ...data, password: encrypt(data.password) };
    }
  }
  
  const result = await next(args);
  
  // 对读取的敏感数据进行解密
  if (method === 'get' && path.startsWith('users')) {
    if (Array.isArray(result)) {
      return result.map(user => ({
        ...user,
        password: user.password ? decrypt(user.password) : undefined
      }));
    } else if (result && result.password) {
      return { ...result, password: decrypt(result.password) };
    }
  }
  
  return result;
};
```

### 缓存中间件

```javascript
function createCacheMiddleware(ttl = 60000) { // 默认缓存1分钟
  const cache = new Map();
  
  return async (args, next) => {
    const [method, path, data] = args;
    const cacheKey = `${method}:${path}:${JSON.stringify(data || {})}`;
    
    // 只缓存 GET 请求
    if (method === 'get') {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log('从缓存返回:', cacheKey);
        return cached.data;
      }
    }
    
    const result = await next();
    
    // 缓存 GET 请求的结果
    if (method === 'get') {
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    } else {
      // 写操作时清理相关缓存
      for (const key of cache.keys()) {
        if (key.includes(path.split('/')[0])) {
          cache.delete(key);
        }
      }
    }
    
    return result;
  };
}

store.use(createCacheMiddleware(30000)); // 缓存30秒
```

## 最佳实践

### 1. 中间件顺序

将中间件按功能类型分组，注意执行顺序：

```javascript
// 1. 认证和权限 (优先级最高)
store.use(authMiddleware);

// 2. 数据验证
store.use(validationMiddleware);

// 3. 数据转换
store.use(transformMiddleware);

// 4. 缓存 (接近底层)
store.use(cacheMiddleware);

// 5. 日志 (通常最后)
store.use(loggingMiddleware);
```

### 2. 错误处理

在中间件中正确处理错误：

```javascript
const errorHandlingMiddleware = async (args, next) => {
  try {
    return await next();
  } catch (error) {
    // 记录错误
    console.error('操作失败:', error);
    
    // 根据需要转换错误格式
    if (error.code === 404) {
      throw new Error('资源不存在');
    }
    
    // 重新抛出错误
    throw error;
  }
};
```

### 3. 性能考虑

避免在中间件中进行重复或昂贵的操作：

```javascript
// ❌ 不好的做法 - 每次都重新验证
const badMiddleware = async (args, next) => {
  const isValid = await expensiveValidation(args);
  if (!isValid) throw new Error('验证失败');
  return next();
};

// ✅ 好的做法 - 使用缓存
const cache = new Map();
const goodMiddleware = async (args, next) => {
  const key = JSON.stringify(args);
  if (!cache.has(key)) {
    cache.set(key, await expensiveValidation(args));
  }
  
  if (!cache.get(key)) throw new Error('验证失败');
  return next();
};
```

## 相关 API

- [CRUD 操作](/api/crud) - 了解基本的数据操作
- [创建 Store](/api/create-store) - Store 的创建和配置
- [错误处理](/api/error-handling) - 错误处理最佳实践

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

## 常用中间件示例

### 日志中间件

```javascript
// 基础日志中间件
store.use(async (args, next) => {
  const [method, path] = args;
  const startTime = Date.now();
  
  console.log(`🔄 ${method.toUpperCase()} ${path} - 开始`);
  
  try {
    const result = await next();
    const duration = Date.now() - startTime;
    console.log(`✅ ${method.toUpperCase()} ${path} - 成功 (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${method.toUpperCase()} ${path} - 失败: ${error.message} (${duration}ms)`);
    throw error;
  }
});

// 详细日志中间件
store.use(async (args, next) => {
  const [method, path, data, query] = args;
  
  console.log('请求详情:', {
    method: method.toUpperCase(),
    path,
    data,
    query,
    timestamp: new Date().toISOString()
  });
  
  const result = await next();
  
  console.log('响应详情:', {
    result,
    timestamp: new Date().toISOString()
  });
  
  return result;
});
```

### 数据验证中间件

```javascript
// 用户数据验证
store.use(async (args, next) => {
  const [method, path, data] = args;
  
  if (method === 'post' && path === 'users') {
    // 必填字段验证
    if (!data.name || !data.email) {
      throw new Error('姓名和邮箱是必填项');
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('邮箱格式不正确');
    }
    
    // 年龄验证
    if (data.age && (data.age < 0 || data.age > 150)) {
      throw new Error('年龄必须在 0-150 之间');
    }
  }
  
  return next();
});

// 通用数据验证中间件
const validationRules = {
  users: {
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    age: { type: 'number', min: 0, max: 150 }
  },
  posts: {
    title: { required: true, type: 'string', minLength: 5 },
    content: { required: true, type: 'string', minLength: 10 }
  }
};

store.use(async (args, next) => {
  const [method, path, data] = args;
  
  if (method === 'post' && validationRules[path]) {
    const rules = validationRules[path];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} 是必填项`);
      }
      
      if (value !== undefined) {
        // 类型验证
        if (rule.type === 'string' && typeof value !== 'string') {
          throw new Error(`${field} 必须是字符串`);
        }
        
        if (rule.type === 'number' && typeof value !== 'number') {
          throw new Error(`${field} 必须是数字`);
        }
        
        if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error(`${field} 邮箱格式不正确`);
        }
        
        // 长度验证
        if (rule.minLength && value.length < rule.minLength) {
          throw new Error(`${field} 长度不能少于 ${rule.minLength} 个字符`);
        }
        
        // 数值范围验证
        if (rule.min !== undefined && value < rule.min) {
          throw new Error(`${field} 不能小于 ${rule.min}`);
        }
        
        if (rule.max !== undefined && value > rule.max) {
          throw new Error(`${field} 不能大于 ${rule.max}`);
        }
      }
    }
  }
  
  return next();
});
```

### 权限控制中间件

```javascript
// 简单权限控制
let currentUser = { role: 'user' }; // 模拟当前用户

store.use(async (args, next) => {
  const [method, path] = args;
  
  // 只有管理员可以删除数据
  if (method === 'delete' && currentUser.role !== 'admin') {
    throw new Error('权限不足：只有管理员可以删除数据');
  }
  
  // 普通用户只能修改自己的数据
  if (['put', 'patch'].includes(method) && path.startsWith('users/')) {
    const userId = path.split('/')[1];
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      throw new Error('权限不足：只能修改自己的数据');
    }
  }
  
  return next();
});

// 基于角色的权限控制
const permissions = {
  admin: ['get', 'post', 'put', 'patch', 'delete'],
  editor: ['get', 'post', 'put', 'patch'],
  user: ['get', 'post'],
  guest: ['get']
};

store.use(async (args, next) => {
  const [method] = args;
  const userRole = currentUser.role || 'guest';
  const allowedMethods = permissions[userRole] || [];
  
  if (!allowedMethods.includes(method)) {
    throw new Error(`权限不足：${userRole} 角色不允许执行 ${method.toUpperCase()} 操作`);
  }
  
  return next();
});
```

### 缓存中间件

```javascript
// 简单内存缓存
const cache = new Map();

store.use(async (args, next) => {
  const [method, path, data, query] = args;
  
  // 只缓存 GET 请求
  if (method === 'get') {
    const cacheKey = `${method}:${path}:${JSON.stringify(query || {})}`;
    
    // 检查缓存
    if (cache.has(cacheKey)) {
      console.log('💾 缓存命中:', cacheKey);
      return cache.get(cacheKey);
    }
    
    // 执行请求
    const result = await next();
    
    // 存储到缓存
    cache.set(cacheKey, result);
    console.log('💾 结果已缓存:', cacheKey);
    
    return result;
  }
  
  // 非 GET 请求清除相关缓存
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const pathPrefix = path.split('/')[0];
    const keysToDelete = [];
    
    for (const key of cache.keys()) {
      if (key.includes(pathPrefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => cache.delete(key));
    if (keysToDelete.length > 0) {
      console.log('🗑️ 清除缓存:', keysToDelete.length, '个');
    }
  }
  
  return next();
});

// 带过期时间的缓存
const cacheWithTTL = new Map();

store.use(async (args, next) => {
  const [method, path, data, query] = args;
  
  if (method === 'get') {
    const cacheKey = `${method}:${path}:${JSON.stringify(query || {})}`;
    const cached = cacheWithTTL.get(cacheKey);
    
    // 检查缓存是否存在且未过期
    if (cached && Date.now() < cached.expireAt) {
      console.log('💾 缓存命中:', cacheKey);
      return cached.data;
    }
    
    // 执行请求
    const result = await next();
    
    // 存储到缓存，5分钟过期
    cacheWithTTL.set(cacheKey, {
      data: result,
      expireAt: Date.now() + 5 * 60 * 1000
    });
    
    return result;
  }
  
  return next();
});
```

### 数据转换中间件

```javascript
// 自动添加时间戳
store.use(async (args, next) => {
  const [method, path, data] = args;
  
  if (method === 'post' && data) {
    // 创建时添加时间戳
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
  }
  
  if (['put', 'patch'].includes(method) && data) {
    // 更新时修改时间戳
    data.updatedAt = new Date().toISOString();
  }
  
  return next();
});

// 数据清理中间件
store.use(async (args, next) => {
  const [method, path, data] = args;
  
  if (['post', 'put', 'patch'].includes(method) && data) {
    // 清理空字符串
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key];
      }
    });
    
    // 清理敏感字段
    delete data.password;
    delete data.token;
  }
  
  const result = await next();
  
  // 清理响应中的敏感字段
  if (result && typeof result === 'object') {
    if (Array.isArray(result)) {
      result.forEach(item => {
        delete item.password;
        delete item.token;
      });
    } else {
      delete result.password;
      delete result.token;
    }
  }
  
  return result;
});
```

## 高级用法

### 条件中间件

```javascript
// 只对特定路径应用中间件
store.use(async (args, next) => {
  const [method, path] = args;
  
  // 只对用户相关操作应用验证
  if (path.startsWith('users')) {
    // 执行用户验证逻辑
    console.log('执行用户验证');
  }
  
  return next();
});

// 只对特定方法应用中间件
store.use(async (args, next) => {
  const [method] = args;
  
  if (['post', 'put', 'patch'].includes(method)) {
    // 只对写操作应用验证
    console.log('执行写操作验证');
  }
  
  return next();
});
```

### 中间件组合

```javascript
// 创建中间件工厂函数
function createLoggerMiddleware(options = {}) {
  const { level = 'info', includeData = false } = options;
  
  return async (args, next) => {
    const [method, path, data] = args;
    
    if (level === 'debug' && includeData) {
      console.log(`[${level.toUpperCase()}] ${method.toUpperCase()} ${path}`, data);
    } else {
      console.log(`[${level.toUpperCase()}] ${method.toUpperCase()} ${path}`);
    }
    
    return next();
  };
}

// 使用中间件工厂
store.use(createLoggerMiddleware({ level: 'debug', includeData: true }));

// 中间件组合函数
function combineMiddlewares(...middlewares) {
  return async (args, next) => {
    let index = 0;
    
    async function dispatch() {
      if (index >= middlewares.length) {
        return next();
      }
      
      const middleware = middlewares[index++];
      return middleware(args, dispatch);
    }
    
    return dispatch();
  };
}

// 组合多个中间件
const combinedMiddleware = combineMiddlewares(
  loggerMiddleware,
  validationMiddleware,
  authMiddleware
);

store.use(combinedMiddleware);
```

### 错误处理中间件

```javascript
// 全局错误处理
store.use(async (args, next) => {
  try {
    return await next();
  } catch (error) {
    // 记录错误
    console.error('操作失败:', {
      args,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // 可以转换错误或添加额外信息
    if (error.message.includes('validation')) {
      throw new Error('数据验证失败：' + error.message);
    }
    
    // 重新抛出原错误
    throw error;
  }
});
```

## 最佳实践

### 1. 中间件职责单一

```javascript
// ✅ 好的做法：每个中间件只负责一件事
store.use(loggerMiddleware);
store.use(validationMiddleware);
store.use(authMiddleware);

// ❌ 避免：一个中间件做太多事情
store.use(async (args, next) => {
  // 日志 + 验证 + 权限 + 缓存... 太复杂
});
```

### 2. 合理的执行顺序

```javascript
// ✅ 合理的顺序
store.use(loggerMiddleware);      // 1. 先记录日志
store.use(authMiddleware);        // 2. 再检查权限
store.use(validationMiddleware);  // 3. 然后验证数据
store.use(cacheMiddleware);       // 4. 最后处理缓存
```

### 3. 错误处理

```javascript
// ✅ 在中间件中处理错误
store.use(async (args, next) => {
  try {
    return await next();
  } catch (error) {
    // 记录错误但不阻止传播
    console.error('中间件错误:', error);
    throw error;
  }
});
```

### 4. 性能考虑

```javascript
// ✅ 避免在中间件中进行重复计算
const cache = new Map();

store.use(async (args, next) => {
  const key = JSON.stringify(args);
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await next();
  cache.set(key, result);
  return result;
});
```

## 相关链接

- [创建 Store](/api/create-store) - 了解如何配置中间件
- [在线示例](/html-demo/middleware.html) - 中间件功能演示
- [配置选项](/api/options) - 详细的配置参数说明

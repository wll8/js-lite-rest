# CRUD 操作

js-lite-rest 提供了完整的 CRUD（创建、读取、更新、删除）操作，使用类似 RESTful API 的语法。

## GET - 读取数据

### 获取所有记录

```javascript
// 获取所有用户
const users = await store.get('users');

// 获取所有文章
const posts = await store.get('posts');
```

### 获取单条记录

```javascript
// 获取 ID 为 1 的用户
const user = await store.get('users/1');

// 获取 ID 为 5 的文章
const post = await store.get('posts/5');
```

### 条件查询

```javascript
// 按字段过滤
const activeUsers = await store.get('users', { status: 'active' });

// 多条件过滤
const posts = await store.get('posts', {
  status: 'published',
  category: 'tech'
});

// 范围查询
const expensiveProducts = await store.get('products', {
  price_gte: 100,
  price_lte: 500
});
```

## POST - 创建数据

### 创建单条记录

```javascript
// 创建新用户
const newUser = await store.post('users', {
  name: 'Alice',
  email: 'alice@example.com',
  age: 25
});

console.log(newUser); // { id: 3, name: 'Alice', email: 'alice@example.com', age: 25 }
```

### 批量创建

```javascript
// 批量创建用户
const newUsers = await store.post('users', [
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' },
  { name: 'David', email: 'david@example.com' }
]);

console.log(newUsers); // 返回包含新 ID 的用户数组
```

### 自动 ID 生成

```javascript
// ID 会自动生成
const post = await store.post('posts', {
  title: '我的第一篇文章',
  content: '这是文章内容...'
});

console.log(post.id); // 自动生成的 ID，如 1, 2, 3...
```

## PUT - 完整更新

### 更新单条记录

```javascript
// 完整更新用户信息
const updatedUser = await store.put('users/1', {
  name: 'Alice Smith',
  email: 'alice.smith@example.com',
  age: 26,
  status: 'active'
});
```

### 批量更新

```javascript
// 批量完整更新
const updates = [
  { id: 1, name: 'Alice Updated', email: 'alice@new.com' },
  { id: 2, name: 'Bob Updated', email: 'bob@new.com' }
];

const results = await store.put('users', updates);
```

## PATCH - 部分更新

### 更新单条记录的部分字段

```javascript
// 只更新用户的名字
const user = await store.patch('users/1', {
  name: 'Alice Johnson'
});

// 只更新文章的状态
const post = await store.patch('posts/1', {
  status: 'published',
  publishedAt: new Date().toISOString()
});
```

### 批量部分更新

```javascript
// 批量部分更新
const updates = [
  { id: 1, status: 'active' },
  { id: 2, status: 'inactive' },
  { id: 3, lastLogin: new Date().toISOString() }
];

const results = await store.patch('users', updates);
```

## DELETE - 删除数据

### 删除单条记录

```javascript
// 删除指定用户
const deleted = await store.delete('users/1');

if (deleted) {
  console.log('用户删除成功');
} else {
  console.log('用户不存在');
}
```

### 批量删除

```javascript
// 按 ID 批量删除
await store.delete('users', { id: [1, 2, 3] });

// 按条件批量删除
await store.delete('posts', { status: 'draft' });
```

## 嵌套资源操作

### 获取嵌套资源

```javascript
// 获取文章的所有评论
const comments = await store.get('posts/1/comments');

// 获取用户的所有文章
const userPosts = await store.get('users/1/posts');
```

### 创建嵌套资源

```javascript
// 为文章添加评论
const comment = await store.post('posts/1/comments', {
  content: '很好的文章！',
  author: 'Bob'
});

// 为用户创建文章
const post = await store.post('users/1/posts', {
  title: '我的新文章',
  content: '文章内容...'
});
```

## 返回值处理

### 成功操作

```javascript
// GET 操作返回数据
const users = await store.get('users'); // 返回用户数组
const user = await store.get('users/1'); // 返回用户对象或 null

// POST 操作返回创建的数据（包含 ID）
const newUser = await store.post('users', { name: 'Alice' });
console.log(newUser.id); // 新生成的 ID

// PUT/PATCH 操作返回更新后的数据
const updated = await store.put('users/1', { name: 'New Name' });
console.log(updated.name); // 'New Name'

// DELETE 操作返回被删除的数据或 null
const deleted = await store.delete('users/1');
```

### 错误处理

```javascript
try {
  const user = await store.get('users/999');
  if (!user) {
    console.log('用户不存在');
  }
} catch (error) {
  console.error('操作失败:', error.message);
}

try {
  await store.post('users', {}); // 可能触发验证错误
} catch (error) {
  console.error('创建失败:', error.message);
}
```

## 数据验证

### 使用中间件验证

```javascript
// 添加验证中间件
store.use(async (args, next) => {
  const [method, path, data] = args;
  
  if (method === 'post' && path === 'users') {
    if (!data.name || !data.email) {
      throw new Error('姓名和邮箱是必填项');
    }
    
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      throw new Error('邮箱格式不正确');
    }
  }
  
  return next();
});

// 现在创建用户时会自动验证
try {
  await store.post('users', { name: 'Alice' }); // 会抛出错误
} catch (error) {
  console.error(error.message); // '姓名和邮箱是必填项'
}
```

## 性能优化

### 批量操作

```javascript
// ❌ 低效：逐个创建
for (const userData of users) {
  await store.post('users', userData);
}

// ✅ 高效：批量创建
await store.post('users', users);
```

### 条件查询

```javascript
// ❌ 低效：获取所有数据后过滤
const allUsers = await store.get('users');
const activeUsers = allUsers.filter(u => u.status === 'active');

// ✅ 高效：使用查询条件
const activeUsers = await store.get('users', { status: 'active' });
```

### 字段选择

```javascript
// 只获取需要的字段
const users = await store.get('users', {
  _select: ['id', 'name', 'email']
});
```

## 最佳实践

### 1. 数据结构设计

```javascript
// ✅ 好的设计
const user = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  profile: {
    age: 25,
    city: 'Beijing'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// ❌ 避免的设计
const user = {
  user_id: 1, // 使用 id 而不是 user_id
  userName: 'Alice', // 保持一致的命名风格
  // 缺少时间戳字段
};
```

### 2. 错误处理

```javascript
async function getUser(id) {
  try {
    const user = await store.get(`users/${id}`);
    if (!user) {
      throw new Error(`用户 ${id} 不存在`);
    }
    return user;
  } catch (error) {
    console.error('获取用户失败:', error.message);
    throw error;
  }
}
```

### 3. 数据一致性

```javascript
// 更新关联数据时保持一致性
async function updateUserEmail(userId, newEmail) {
  // 更新用户邮箱
  await store.patch(`users/${userId}`, { email: newEmail });
  
  // 同时更新相关的评论作者信息
  const comments = await store.get('comments', { userId });
  for (const comment of comments) {
    await store.patch(`comments/${comment.id}`, { authorEmail: newEmail });
  }
}
```

## 相关链接

- [查询过滤](/api/query) - 学习高级查询功能
- [关系操作](/api/relations) - 处理关联数据
- [中间件](/api/middleware) - 添加验证和其他逻辑

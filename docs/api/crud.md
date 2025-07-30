# CRUD 操作

js-lite-rest 提供了完整的 CRUD（创建、读取、更新、删除）操作，使用类似 RESTful API 的语法。

## 前置条件

在进行 CRUD 操作前，需要先创建 Store 实例：

```javascript
import JsLiteRest from 'js-lite-rest/browser'; // 浏览器环境
// import JsLiteRest from 'js-lite-rest'; // Node.js 环境

const store = await JsLiteRest.create({
  users: [
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' }
  ],
  posts: [
    { id: 'post1', title: '第一篇文章', usersId: 'user1' }
  ]
});
```

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
// 获取指定 ID 的用户
const user = await store.get('users/user1');

// 获取指定 ID 的文章
const post = await store.get('posts/post1');

// 如果记录不存在，返回 null
const notFound = await store.get('users/nonexistent'); // null
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
// 创建新用户，ID 会自动生成
const newUser = await store.post('users', {
  name: 'Charlie',
  email: 'charlie@example.com',
  age: 25
});

console.log(newUser); 
// { id: 'ABC123XYZ', name: 'Charlie', email: 'charlie@example.com', age: 25 }
```

### 批量创建

```javascript
// 批量创建用户
const newUsers = await store.post('users', [
  { name: 'David', email: 'david@example.com' },
  { name: 'Eve', email: 'eve@example.com' },
  { name: 'Frank', email: 'frank@example.com' }
]);

console.log(newUsers); // 返回包含自动生成 ID 的用户数组


```

## PUT - 完整更新

### 更新单条记录

```javascript
// 完整更新用户信息
const updatedUser = await store.put('users/user1', {
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
  { id: 'user1', name: 'Alice Updated', email: 'alice@new.com' },
  { id: 'user2', name: 'Bob Updated', email: 'bob@new.com' }
];

const results = await store.put('users', updates);
```

## PATCH - 部分更新

### 更新单条记录的部分字段

```javascript
// 只更新用户的名字
const user = await store.patch('users/user1', {
  name: 'Alice Johnson'
});

// 只更新文章的状态
const post = await store.patch('posts/post1', {
  status: 'published',
  publishedAt: new Date().toISOString()
});
```

### 批量部分更新

```javascript
// 批量部分更新
const updates = [
  { id: 'user1', status: 'active' },
  { id: 'user2', status: 'inactive' },
  { id: 'user3', lastLogin: new Date().toISOString() }
];

const results = await store.patch('users', updates);
```

## DELETE - 删除数据

### 删除单条记录

```javascript
// 删除指定用户
const deleted = await store.delete('users/user1');

if (deleted) {
  console.log('用户删除成功');
} else {
  console.log('用户不存在');
}
```

### 批量删除

```javascript
// 按 ID 数组批量删除
await store.delete('users', ['user1', 'user2', 'user3']);
```

## 嵌套资源操作

### 获取嵌套资源

```javascript
// 获取文章的所有评论
const comments = await store.get('posts/post1/comments');

// 获取用户的所有文章
const userPosts = await store.get('users/user1/posts');
```

### 创建嵌套资源

```javascript
// 为文章添加评论
const comment = await store.post('posts/post1/comments', {
  content: '很好的文章！',
  author: 'Bob'
});

// 为用户创建文章
const post = await store.post('users/user1/posts', {
  title: '我的新文章',
  content: '文章内容...'
});
```

## 返回值处理

### 成功操作

```javascript
// GET 操作返回数据
const users = await store.get('users'); // 返回用户数组
const user = await store.get('users/user1'); // 返回用户对象或 null

// POST 操作返回创建的数据
const newUser = await store.post('users', { name: 'Alice' });
console.log(newUser.id);

// PUT/PATCH 操作返回更新后的数据
const updated = await store.put('users/user1', { name: 'New Name' });
console.log(updated.name); // 'New Name'

// DELETE 操作返回被删除的数据或 null
const deleted = await store.delete('users/user1');
```

### 错误处理
```
const updated = await store.put('users/1', { name: 'New Name' });
console.log(updated.name); // 'New Name'

// DELETE 操作返回被删除的数据或 null
const deleted = await store.delete('users/1');
```

### 错误处理

```javascript
const user = await store.get('noTable/noId').catch(err => {
  console.error('操作失败:', err.message);
});
```

## 数据验证

### 使用中间件验证

```javascript
// 添加验证中间件
store.use(async (args, next, opt) => {
  const [method, path, data] = args;
  
  if (method === 'post' && path === 'users') {
    if (!data.name || !data.email) {
      throw { 
        code: 400, 
        success: false, 
        message: '姓名和邮箱是必填项' 
      };
    }
    
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      throw { 
        code: 400, 
        success: false, 
        message: '邮箱格式不正确' 
      };
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

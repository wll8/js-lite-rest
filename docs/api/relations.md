# 关系操作

js-lite-rest 支持处理关联数据，提供了嵌套资源、关联嵌入、关联扩展等功能来处理复杂的数据关系。

## 嵌套资源

嵌套资源允许你使用类似 `posts/1/comments` 的路径来操作关联数据。

### 获取嵌套资源

```javascript
// 获取文章 1 的所有评论
const comments = await store.get('posts/1/comments');

// 获取用户 2 的所有文章
const posts = await store.get('users/2/posts');

// 获取分类 3 的所有产品
const products = await store.get('categories/3/products');
```

### 创建嵌套资源

```javascript
// 为文章 1 添加评论
const comment = await store.post('posts/1/comments', {
  content: '很好的文章！',
  author: 'Alice'
});

// 为用户 2 创建文章
const post = await store.post('users/2/posts', {
  title: '我的新文章',
  content: '文章内容...'
});
```

### 嵌套资源的工作原理

嵌套资源基于外键关系工作：

```javascript
// 数据结构示例
const data = {
  posts: [
    { id: 1, title: '第一篇文章', usersId: 1 },
    { id: 2, title: '第二篇文章', usersId: 2 }
  ],
  comments: [
    { id: 1, content: '很好！', postsId: 1 },
    { id: 2, content: '赞同', postsId: 1 },
    { id: 3, content: '不错', postsId: 2 }
  ]
};

// posts/1/comments 会返回所有 postsId === 1 的评论
const comments = await store.get('posts/1/comments');
// 结果: [{ id: 1, content: '很好！', postsId: 1 }, { id: 2, content: '赞同', postsId: 1 }]
```

## 关联嵌入 (_embed)

使用 `_embed` 参数可以在父资源中嵌入子资源。

### 在列表中嵌入

```javascript
// 获取所有文章，并嵌入评论
const posts = await store.get('posts', { _embed: 'comments' });

// 结果结构
[
  {
    id: 1,
    title: '第一篇文章',
    usersId: 1,
    comments: [
      { id: 1, content: '很好！', postsId: 1 },
      { id: 2, content: '赞同', postsId: 1 }
    ]
  },
  {
    id: 2,
    title: '第二篇文章',
    usersId: 2,
    comments: [
      { id: 3, content: '不错', postsId: 2 }
    ]
  }
]
```

### 在单条记录中嵌入

```javascript
// 获取单篇文章，并嵌入评论
const post = await store.get('posts/1', { _embed: 'comments' });

// 结果结构
{
  id: 1,
  title: '第一篇文章',
  usersId: 1,
  comments: [
    { id: 1, content: '很好！', postsId: 1 },
    { id: 2, content: '赞同', postsId: 1 }
  ]
}
```

### 多重嵌入

```javascript
// 嵌入多种关联数据
const users = await store.get('users', { 
  _embed: ['posts', 'comments'] 
});

// 结果包含用户的文章和评论
[
  {
    id: 1,
    name: 'Alice',
    posts: [...],
    comments: [...]
  }
]
```

## 关联扩展 (_expand)

使用 `_expand` 参数可以在子资源中扩展父资源信息。

### 在列表中扩展

```javascript
// 获取所有评论，并扩展文章信息
const comments = await store.get('comments', { _expand: 'post' });

// 结果结构
[
  {
    id: 1,
    content: '很好！',
    postsId: 1,
    post: {
      id: 1,
      title: '第一篇文章',
      usersId: 1
    }
  },
  {
    id: 2,
    content: '赞同',
    postsId: 1,
    post: {
      id: 1,
      title: '第一篇文章',
      usersId: 1
    }
  }
]
```

### 在单条记录中扩展

```javascript
// 获取单条评论，并扩展文章信息
const comment = await store.get('comments/1', { _expand: 'post' });

// 结果结构
{
  id: 1,
  content: '很好！',
  postsId: 1,
  post: {
    id: 1,
    title: '第一篇文章',
    usersId: 1
  }
}
```

### 多重扩展

```javascript
// 扩展多种关联数据
const comments = await store.get('comments', { 
  _expand: ['post', 'user'] 
});

// 结果包含评论的文章和用户信息
[
  {
    id: 1,
    content: '很好！',
    postsId: 1,
    usersId: 2,
    post: { id: 1, title: '第一篇文章' },
    user: { id: 2, name: 'Bob' }
  }
]
```

## 关联字段配置

### 默认关联规则

js-lite-rest 使用 `idKeySuffix` 配置来确定关联字段：

```javascript
const store = await createStore(data, {
  idKeySuffix: 'Id' // 默认值
});

// 关联规则：
// posts 表中的 usersId 字段关联到 users 表
// comments 表中的 postsId 字段关联到 posts 表
// products 表中的 categoryId 字段关联到 categories 表
```

### 自定义关联字段

```javascript
// 自定义 ID 后缀
const store = await createStore(data, {
  idKeySuffix: '_id'
});

// 现在关联字段为：
// posts 表中的 user_id 字段关联到 users 表
// comments 表中的 post_id 字段关联到 posts 表
```

## 复杂关联示例

### 博客系统

```javascript
const blogData = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  categories: [
    { id: 1, name: '技术' },
    { id: 2, name: '生活' }
  ],
  posts: [
    { id: 1, title: 'JavaScript 入门', usersId: 1, categoryId: 1 },
    { id: 2, title: '我的日常', usersId: 2, categoryId: 2 }
  ],
  comments: [
    { id: 1, content: '很有用！', postsId: 1, usersId: 2 },
    { id: 2, content: '感谢分享', postsId: 1, usersId: 1 }
  ]
};

// 获取文章及其评论和作者信息
const posts = await store.get('posts', { 
  _embed: 'comments',
  _expand: ['user', 'category']
});

// 获取用户及其文章和评论
const users = await store.get('users', { 
  _embed: ['posts', 'comments'] 
});
```

### 电商系统

```javascript
const ecommerceData = {
  categories: [
    { id: 1, name: '电子产品' },
    { id: 2, name: '服装' }
  ],
  products: [
    { id: 1, name: 'iPhone', categoryId: 1, price: 999 },
    { id: 2, name: 'T恤', categoryId: 2, price: 29 }
  ],
  orders: [
    { id: 1, usersId: 1, total: 1028, status: 'completed' }
  ],
  orderItems: [
    { id: 1, orderId: 1, productId: 1, quantity: 1, price: 999 },
    { id: 2, orderId: 1, productId: 2, quantity: 1, price: 29 }
  ]
};

// 获取订单及其商品详情
const orders = await store.get('orders', { 
  _embed: 'orderItems' 
});

// 获取订单项并扩展产品信息
const orderItems = await store.get('orderItems', { 
  _expand: ['product', 'order'] 
});
```

## 关联查询与过滤

### 嵌套资源过滤

```javascript
// 获取特定状态的文章评论
const comments = await store.get('posts/1/comments', {
  status: 'approved'
});

// 获取用户的已发布文章
const posts = await store.get('users/1/posts', {
  status: 'published'
});
```

### 关联数据过滤

```javascript
// 获取有评论的文章
const posts = await store.get('posts', { 
  _embed: 'comments',
  // 可以进一步过滤嵌入的评论
});

// 获取特定分类的文章及其评论
const posts = await store.get('posts', {
  categoryId: 1,
  _embed: 'comments',
  _expand: 'category'
});
```

## 性能考虑

### 避免 N+1 查询

```javascript
// ❌ 低效：N+1 查询
const posts = await store.get('posts');
for (const post of posts) {
  post.comments = await store.get(`posts/${post.id}/comments`);
}

// ✅ 高效：使用嵌入
const posts = await store.get('posts', { _embed: 'comments' });
```

### 合理使用关联

```javascript
// ✅ 只在需要时使用关联
const posts = await store.get('posts', { _embed: 'comments' });

// ❌ 避免过度关联
const posts = await store.get('posts', { 
  _embed: ['comments', 'tags', 'likes', 'shares'],
  _expand: ['user', 'category', 'editor']
});
```

### 分页与关联

```javascript
// 先分页，再关联
const posts = await store.get('posts', {
  _page: 1,
  _limit: 10,
  _embed: 'comments'
});
```

## 最佳实践

### 1. 清晰的命名约定

```javascript
// ✅ 清晰的外键命名
const data = {
  users: [{ id: 1, name: 'Alice' }],
  posts: [{ id: 1, title: '文章', usersId: 1 }], // 明确的 usersId
  comments: [{ id: 1, content: '评论', postsId: 1, usersId: 1 }]
};
```

### 2. 合理的数据结构

```javascript
// ✅ 规范化的数据结构
const data = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' }
  ],
  posts: [
    { id: 1, title: '文章', usersId: 1, categoryId: 1 }
  ],
  categories: [
    { id: 1, name: '技术' }
  ]
};

// ❌ 避免嵌套存储
const data = {
  users: [
    {
      id: 1,
      name: 'Alice',
      posts: [{ title: '文章' }] // 避免这样嵌套
    }
  ]
};
```

### 3. 适当的关联深度

```javascript
// ✅ 适度的关联
const posts = await store.get('posts', { 
  _embed: 'comments',
  _expand: 'user'
});

// ❌ 避免过深的关联
const posts = await store.get('posts', { 
  _embed: 'comments',
  _expand: 'user'
});
// 然后再对每个 comment 进行 _expand: 'user'
```

## 相关链接

- [CRUD 操作](/api/crud) - 基本的数据操作
- [查询过滤](/api/query) - 高级查询功能

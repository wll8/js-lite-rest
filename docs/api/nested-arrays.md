# 数组项中数组的管理

js-lite-rest 支持对数组项内嵌套数组的直接操作，使用 `[index]` 语法可以访问数组中特定项的数组字段。

## 概述

通过字符串路径的形式，你可以直接访问和操作数组项中的数组，支持所有标准的 CRUD 操作。

### 路径语法

```
表名[索引].字段名
```

例如：
- `books[0].comments` - 访问第1本书的评论数组
- `posts[1].tags` - 访问第2篇文章的标签数组
- `users[2].orders` - 访问第3个用户的订单数组

## 基本操作

### 数据结构示例

```javascript
const store = await JsLiteRest.create({
  books: [
    {
      id: 1,
      title: 'JavaScript权威指南',
      comments: [
        { id: 1, content: '很好的书', author: 'Alice' },
        { id: 2, content: '推荐阅读', author: 'Bob' }
      ]
    },
    {
      id: 2,
      title: 'CSS揭秘',
      comments: [
        { id: 3, content: '很实用', author: 'Charlie' }
      ]
    },
    {
      id: 3,
      title: 'HTML5权威指南',
      comments: []
    }
  ]
});
```

### GET - 获取嵌套数组

```javascript
// 获取第1本书的所有评论
const comments = await store.get('books[0].comments');
console.log(comments);
// [
//   { id: 1, content: '很好的书', author: 'Alice' },
//   { id: 2, content: '推荐阅读', author: 'Bob' }
// ]

// 获取第2本书的评论
const comments2 = await store.get('books[1].comments');
console.log(comments2);
// [{ id: 3, content: '很实用', author: 'Charlie' }]

// 获取第3本书的评论（空数组）
const comments3 = await store.get('books[2].comments');
console.log(comments3); // []
```

### POST - 添加到嵌套数组

```javascript
// 为第1本书添加新评论
const newComment = await store.post('books[0].comments', {
  content: '非常棒的书！',
  author: 'David'
});
console.log(newComment);
// { id: 'GENERATED_ID', content: '非常棒的书！', author: 'David' }

// 为没有评论的书添加第一条评论
await store.post('books[2].comments', {
  content: '第一条评论',
  author: 'Eve'
});
```

### PUT - 更新嵌套数组中的项

```javascript
// 完整更新第1本书的第1条评论
await store.put('books[0].comments/1', {
  content: '更新后的评论',
  author: 'Alice-Updated'
});
```

### PATCH - 部分更新嵌套数组中的项

```javascript
// 只更新评论的作者
await store.patch('books[0].comments/2', {
  author: 'Bob-Patched'
});
```

### DELETE - 删除嵌套数组中的项

```javascript
// 删除第1本书的第1条评论
const deletedComment = await store.delete('books[0].comments/1');
console.log(deletedComment);
// { id: 1, content: '很好的书', author: 'Alice' }
```

## 高级查询

嵌套数组同样支持所有查询功能：

### 过滤查询

```javascript
// 获取特定作者的评论
const aliceComments = await store.get('books[0].comments', {
  author: 'Alice'
});

// 使用运算符查询
const recentComments = await store.get('books[0].comments', {
  id_gte: 10, // ID 大于等于 10 的评论
  author_ne: 'Spam' // 作者不是 'Spam' 的评论
});
```

### 排序

```javascript
// 按内容排序
const sortedComments = await store.get('books[0].comments', {
  _sort: 'content',
  _order: 'asc'
});

// 多字段排序
const multiSortComments = await store.get('books[0].comments', {
  _sort: 'author,content',
  _order: 'desc,asc'
});
```

### 分页

```javascript
// 分页获取评论
const pagedComments = await store.get('books[0].comments', {
  _page: 1,
  _limit: 5
});
console.log(pagedComments.count); // 总评论数
console.log(pagedComments.list);  // 当前页的评论
```

### 全文搜索

```javascript
// 搜索包含特定关键词的评论
const searchResults = await store.get('books[0].comments', {
  _q: '推荐'
});
```

## 复杂示例

### 博客系统

```javascript
const store = await JsLiteRest.create({
  posts: [
    {
      id: 1,
      title: '我的第一篇博客',
      content: '这是内容...',
      comments: [
        { id: 1, content: '写得不错', author: 'reader1', likes: 5 },
        { id: 2, content: '继续加油', author: 'reader2', likes: 3 }
      ],
      tags: ['JavaScript', 'Web开发']
    }
  ]
});

// 获取第一篇文章的热门评论（按点赞数排序）
const hotComments = await store.get('posts[0].comments', {
  _sort: 'likes',
  _order: 'desc',
  _limit: 3
});

// 为第一篇文章添加新评论
await store.post('posts[0].comments', {
  content: '学到了很多',
  author: 'student',
  likes: 0
});

// 给评论点赞（部分更新）
await store.patch('posts[0].comments/1', {
  likes: 6
});
```

### 电商系统

```javascript
const store = await JsLiteRest.create({
  users: [
    {
      id: 1,
      name: 'Alice',
      orders: [
        { id: 'order1', total: 299.99, items: ['book1', 'pen1'] },
        { id: 'order2', total: 199.99, items: ['notebook1'] }
      ]
    }
  ]
});

// 获取用户的所有订单
const userOrders = await store.get('users[0].orders');

// 添加新订单
await store.post('users[0].orders', {
  total: 499.99,
  items: ['laptop1', 'mouse1']
});

// 查找大额订单
const bigOrders = await store.get('users[0].orders', {
  total_gte: 400
});
```

## 错误处理

### 索引超出范围

```javascript
try {
  // 尝试访问不存在的数组项
  await store.get('books[999].comments');
} catch (error) {
  console.error('错误:', error.message); // 索引超出范围的错误
}

try {
  // 尝试向不存在的数组项添加数据
  await store.post('books[999].comments', { content: 'test' });
} catch (error) {
  console.error('错误:', error.message); // 数组索引超出范围
}
```

### 路径错误

```javascript
try {
  // 访问不存在的字段
  await store.get('books[0].nonexistent');
} catch (error) {
  console.error('字段不存在');
}
```

## 性能考虑

### 1. 索引效率

- 数组索引访问是 O(1) 操作
- 大数组建议使用过滤查询而不是遍历所有索引

```javascript
// 推荐：使用查询过滤
const result = await store.get('posts', { authorId: 123 });
const comments = result[0]?.comments || [];

// 不推荐：遍历所有索引
for (let i = 0; i < 1000; i++) {
  try {
    const comments = await store.get(`posts[${i}].comments`);
    // 处理评论...
  } catch (error) {
    // 索引不存在
  }
}
```

### 2. 批量操作

对于大量数据操作，考虑在父级进行批量更新：

```javascript
// 推荐：批量更新父级数据
const books = await store.get('books');
books[0].comments.push(newComment);
await store.put('books/1', books[0]);

// 适用场景：单个评论操作
await store.post('books[0].comments', newComment);
```

## 限制和注意事项

1. **索引必须存在**: 数组索引必须在有效范围内，否则会抛出错误
2. **字段必须是数组**: 目标字段必须是数组类型，否则无法进行数组操作
3. **路径解析**: 路径中的 `[index]` 语法仅支持数字索引
4. **嵌套深度**: 理论上支持任意深度的嵌套，但建议保持合理的层级结构

## 相关 API

- [CRUD 操作](/api/crud) - 了解基本的 CRUD 操作
- [查询过滤](/api/query) - 学习查询语法和过滤条件
- [关系操作](/api/relations) - 处理表之间的关联关系
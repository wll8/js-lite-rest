# 查询过滤

js-lite-rest 提供了强大的查询功能，支持过滤、排序、分页、全文搜索等高级特性。

## 基础过滤

### 精确匹配

```javascript
// 按单个字段过滤
const activeUsers = await store.get('users', { status: 'active' });

// 按多个字段过滤
const posts = await store.get('posts', {
  status: 'published',
  category: 'tech',
  featured: true
});
```

### 多值匹配

```javascript
// 匹配多个值中的任意一个
const posts = await store.get('posts', {
  category: ['tech', 'science', 'programming']
});

// 等价于 SQL: WHERE category IN ('tech', 'science', 'programming')
```

### 深层字段过滤

```javascript
// 使用点语法访问嵌套字段
const users = await store.get('users', {
  'profile.age': 25,
  'settings.theme': 'dark'
});

// 数据结构示例
const user = {
  id: 1,
  name: 'Alice',
  profile: { age: 25, city: 'Beijing' },
  settings: { theme: 'dark', language: 'zh' }
};
```

## 运算符查询

### 比较运算符

```javascript
// 大于等于 (>=)
const adults = await store.get('users', { age_gte: 18 });

// 小于等于 (<=)
const youngUsers = await store.get('users', { age_lte: 30 });

// 不等于 (!=)
const nonDraftPosts = await store.get('posts', { status_ne: 'draft' });

// 组合使用
const products = await store.get('products', {
  price_gte: 100,
  price_lte: 500,
  category_ne: 'discontinued'
});
```

### 模糊查询

```javascript
// 包含指定文本
const users = await store.get('users', { name_like: 'Alice' });

// 多个模式匹配
const posts = await store.get('posts', {
  title_like: ['JavaScript', 'React', 'Vue']
});

// 深层字段模糊查询
const users = await store.get('users', {
  'profile.bio_like': 'developer'
});
```

## 排序

### 单字段排序

```javascript
// 升序排序
const usersByName = await store.get('users', {
  _sort: 'name',
  _order: 'asc'
});

// 降序排序
const postsByDate = await store.get('posts', {
  _sort: 'createdAt',
  _order: 'desc'
});
```

### 多字段排序

```javascript
// 多字段排序
const users = await store.get('users', {
  _sort: ['status', 'name'],
  _order: ['asc', 'asc']
});

// 混合排序方向
const posts = await store.get('posts', {
  _sort: ['featured', 'createdAt'],
  _order: ['desc', 'desc'] // featured 文章优先，然后按时间倒序
});
```

### 深层字段排序

```javascript
// 按嵌套字段排序
const users = await store.get('users', {
  _sort: 'profile.age',
  _order: 'asc'
});
```

## 分页

### 基础分页

```javascript
// 第一页，每页 10 条
const page1 = await store.get('users', {
  _page: 1,
  _limit: 10
});

// 第二页，每页 20 条
const page2 = await store.get('users', {
  _page: 2,
  _limit: 20
});
```

### 偏移分页

```javascript
// 跳过前 50 条，获取接下来的 10 条
const results = await store.get('users', {
  _start: 50,
  _limit: 10
});
```

### 分页与其他查询结合

```javascript
// 分页 + 过滤 + 排序
const results = await store.get('posts', {
  status: 'published',
  _sort: 'createdAt',
  _order: 'desc',
  _page: 1,
  _limit: 5
});
```

## 数据截取

### 指定范围

```javascript
// 获取第 10 到第 20 条记录
const slice1 = await store.get('users', {
  _start: 10,
  _end: 20
});

// 从第 5 条开始，获取 10 条记录
const slice2 = await store.get('users', {
  _start: 5,
  _limit: 10
});
```

### 截取与过滤结合

```javascript
// 先过滤，再截取
const results = await store.get('posts', {
  status: 'published',
  _start: 0,
  _limit: 5
});
```

## 全文搜索

### 基础搜索

```javascript
// 在所有字段中搜索
const results = await store.get('posts', { _q: 'JavaScript' });

// 搜索会匹配标题、内容、标签等所有文本字段
```

### 搜索与过滤结合

```javascript
// 在特定分类中搜索
const results = await store.get('posts', {
  category: 'tech',
  _q: 'React'
});
```

## 复杂查询示例

### 电商产品查询

```javascript
// 复杂的产品搜索
const products = await store.get('products', {
  // 基础过滤
  category: ['electronics', 'computers'],
  inStock: true,
  
  // 价格范围
  price_gte: 100,
  price_lte: 1000,
  
  // 评分过滤
  rating_gte: 4.0,
  
  // 排序
  _sort: ['featured', 'rating', 'price'],
  _order: ['desc', 'desc', 'asc'],
  
  // 分页
  _page: 1,
  _limit: 20
});
```

### 用户管理查询

```javascript
// 管理后台用户列表
const users = await store.get('users', {
  // 状态过滤
  status_ne: 'deleted',
  
  // 注册时间范围
  createdAt_gte: '2024-01-01',
  createdAt_lte: '2024-12-31',
  
  // 年龄范围
  'profile.age_gte': 18,
  'profile.age_lte': 65,
  
  // 搜索
  _q: searchTerm,
  
  // 排序
  _sort: 'lastLoginAt',
  _order: 'desc',
  
  // 分页
  _page: currentPage,
  _limit: 50
});
```

### 内容管理查询

```javascript
// 文章管理查询
const posts = await store.get('posts', {
  // 多状态过滤
  status: ['published', 'featured'],
  
  // 作者过滤
  authorId: currentUserId,
  
  // 标签过滤
  'tags_like': ['JavaScript', 'React'],
  
  // 浏览量范围
  views_gte: 1000,
  
  // 排序
  _sort: ['featured', 'publishedAt'],
  _order: ['desc', 'desc'],
  
  // 分页
  _page: 1,
  _limit: 10
});
```

## 查询参数参考

| 参数 | 说明 | 示例 |
|------|------|------|
| `field` | 精确匹配 | `{ status: 'active' }` |
| `field_gte` | 大于等于 | `{ age_gte: 18 }` |
| `field_lte` | 小于等于 | `{ age_lte: 65 }` |
| `field_ne` | 不等于 | `{ status_ne: 'deleted' }` |
| `field_like` | 模糊匹配 | `{ name_like: 'Alice' }` |
| `_q` | 全文搜索 | `{ _q: 'JavaScript' }` |
| `_sort` | 排序字段 | `{ _sort: 'name' }` |
| `_order` | 排序方向 | `{ _order: 'asc' }` |
| `_page` | 页码 | `{ _page: 1 }` |
| `_limit` | 每页数量 | `{ _limit: 10 }` |
| `_start` | 起始位置 | `{ _start: 20 }` |
| `_end` | 结束位置 | `{ _end: 30 }` |

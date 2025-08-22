# _ne 操作符数组支持

js-lite-rest 增强了 `_ne` (not equal) 操作符，现在支持数组值，让你能够一次性排除多个值，使查询更加灵活和高效。

## 概述

`_ne` 操作符现在支持两种使用方式：

1. **单值排除**: `field_ne: value` - 排除单个值
2. **多值排除**: `field_ne: [value1, value2, ...]` - 排除数组中的所有值

## 基本语法

```javascript
// 单值排除（原有功能）
await store.get('table', { field_ne: 'value' });

// 多值排除（新增功能）
await store.get('table', { field_ne: ['value1', 'value2', 'value3'] });
```

## 使用示例

### 数据准备

```javascript
import JsLiteRest from 'js-lite-rest';

const store = await JsLiteRest.create({
  books: [
    { id: 1, title: 'JavaScript权威指南', category: 'programming', status: 'available' },
    { id: 2, title: 'CSS揭秘', category: 'design', status: 'borrowed' },
    { id: 3, title: 'HTML5权威指南', category: 'markup', status: 'available' },
    { id: 4, title: 'Python编程', category: 'programming', status: 'maintenance' },
    { id: 5, title: 'Vue.js实战', category: 'programming', status: 'available' },
    { id: 6, title: 'React进阶', category: 'programming', status: 'borrowed' }
  ],
  users: [
    { id: 1, name: 'Alice', role: 'admin', department: 'IT' },
    { id: 2, name: 'Bob', role: 'user', department: 'Sales' },
    { id: 3, name: 'Charlie', role: 'moderator', department: 'IT' },
    { id: 4, name: 'David', role: 'user', department: 'Marketing' },
    { id: 5, name: 'Eve', role: 'user', department: 'IT' }
  ]
});
```

### 单值排除

```javascript
// 排除特定类别
const nonProgrammingBooks = await store.get('books', {
  category_ne: 'programming'
});
console.log(nonProgrammingBooks);
// [
//   { id: 2, title: 'CSS揭秘', category: 'design', status: 'borrowed' },
//   { id: 3, title: 'HTML5权威指南', category: 'markup', status: 'available' }
// ]

// 排除特定状态
const notBorrowedBooks = await store.get('books', {
  status_ne: 'borrowed'
});
console.log(notBorrowedBooks);
// 返回状态不是 'borrowed' 的所有书籍
```

### 多值排除（数组支持）

```javascript
// 排除多个类别
const excludeMultipleCategories = await store.get('books', {
  category_ne: ['programming', 'design']
});
console.log(excludeMultipleCategories);
// [
//   { id: 3, title: 'HTML5权威指南', category: 'markup', status: 'available' }
// ]

// 排除多个状态
const availableOrMaintenanceBooks = await store.get('books', {
  status_ne: ['borrowed', 'maintenance']
});
console.log(availableOrMaintenanceBooks);
// 返回状态为 'available' 的所有书籍

// 排除多个用户角色
const nonRegularUsers = await store.get('users', {
  role_ne: ['user', 'guest']
});
console.log(nonRegularUsers);
// [
//   { id: 1, name: 'Alice', role: 'admin', department: 'IT' },
//   { id: 3, name: 'Charlie', role: 'moderator', department: 'IT' }
// ]
```

### 数字和 ID 排除

```javascript
// 排除特定 ID
const excludeSpecificBooks = await store.get('books', {
  id_ne: [1, 3, 5]
});
console.log(excludeSpecificBooks);
// 返回 id 不是 1, 3, 5 的书籍

// 排除多个用户
const excludeUsers = await store.get('users', {
  id_ne: [2, 4]
});
console.log(excludeUsers);
// 返回 id 不是 2, 4 的用户
```

## 高级用法

### 与其他条件组合

```javascript
// 组合查询：获取编程类别中状态不是借出或维护的书籍
const availableProgrammingBooks = await store.get('books', {
  category: 'programming',
  status_ne: ['borrowed', 'maintenance']
});
console.log(availableProgrammingBooks);
// [
//   { id: 1, title: 'JavaScript权威指南', category: 'programming', status: 'available' },
//   { id: 5, title: 'Vue.js实战', category: 'programming', status: 'available' }
// ]

// 组合查询：获取 IT 部门中角色不是普通用户的员工
const itNonUsers = await store.get('users', {
  department: 'IT',
  role_ne: ['user']
});
console.log(itNonUsers);
// [
//   { id: 1, name: 'Alice', role: 'admin', department: 'IT' },
//   { id: 3, name: 'Charlie', role: 'moderator', department: 'IT' }
// ]
```

### 与其他操作符组合

```javascript
// 组合 _ne 和 _gte
const recentBooksExcludingCategories = await store.get('books', {
  id_gte: 3,
  category_ne: ['design', 'markup']
});

// 组合 _ne 和 _like
const programBooksExcludingSpecific = await store.get('books', {
  title_like: 'JavaScript|Vue|React',
  status_ne: ['borrowed', 'maintenance']
});
```

### 深层字段排除

```javascript
// 假设有嵌套数据结构
const store2 = await JsLiteRest.create({
  products: [
    { id: 1, name: 'Laptop', specs: { brand: 'Dell', color: 'black' } },
    { id: 2, name: 'Mouse', specs: { brand: 'Logitech', color: 'white' } },
    { id: 3, name: 'Keyboard', specs: { brand: 'Apple', color: 'silver' } },
    { id: 4, name: 'Monitor', specs: { brand: 'Dell', color: 'black' } }
  ]
});

// 排除多个品牌
const nonDellLogitech = await store2.get('products', {
  'specs.brand_ne': ['Dell', 'Logitech']
});
console.log(nonDellLogitech);
// [
//   { id: 3, name: 'Keyboard', specs: { brand: 'Apple', color: 'silver' } }
// ]

// 排除多个颜色
const colorExclusion = await store2.get('products', {
  'specs.color_ne': ['black', 'white']
});
console.log(colorExclusion);
// [
//   { id: 3, name: 'Keyboard', specs: { brand: 'Apple', color: 'silver' } }
// ]
```

## 边界情况处理

### 空数组

```javascript
// 空数组不排除任何值
const allBooks = await store.get('books', {
  category_ne: []
});
console.log(allBooks.length); // 返回所有书籍
```

### 不存在的值

```javascript
// 数组中包含不存在的值不会影响结果
const booksExcludingNonexistent = await store.get('books', {
  category_ne: ['programming', 'nonexistent', 'design']
});
// 等同于 category_ne: ['programming', 'design']
```

### 类型混合

```javascript
// 可以在数组中混合不同类型的值
const mixedExclusion = await store.get('books', {
  id_ne: [1, '2', 3] // 数字和字符串混合
});
// 会正确排除 id 为 1, 2, 3 的记录（自动类型转换）
```

## 性能考虑

### 索引优化

```javascript
// 对于大型数据集，考虑查询的效率
// 推荐：先用其他条件过滤，再用 _ne 排除
const efficientQuery = await store.get('books', {
  category: 'programming',     // 先过滤主要条件
  status_ne: ['borrowed']      // 再排除不需要的
});

// 避免：只用 _ne 进行大范围排除
const inefficientQuery = await store.get('books', {
  id_ne: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // 大量排除可能效率较低
});
```

### 内存使用

```javascript
// 对于超大数组，考虑分批处理
async function excludeManySafely(table, field, excludeArray) {
  if (excludeArray.length > 100) {
    console.warn('排除数组较大，建议考虑重新设计查询策略');
  }
  
  return await store.get(table, {
    [`${field}_ne`]: excludeArray
  });
}
```

## 实际应用场景

### 1. 内容过滤系统

```javascript
async function getFilteredContent(excludedCategories, excludedStatuses) {
  return await store.get('articles', {
    category_ne: excludedCategories,
    status_ne: excludedStatuses,
    published: true
  });
}

// 使用示例
const safeContent = await getFilteredContent(
  ['adult', 'violence', 'politics'],
  ['draft', 'deleted', 'suspended']
);
```

### 2. 用户权限管理

```javascript
async function getUsersExcludingRoles(excludedRoles, department = null) {
  const query = {
    role_ne: excludedRoles,
    active: true
  };
  
  if (department) {
    query.department = department;
  }
  
  return await store.get('users', query);
}

// 获取除了管理员和超级用户外的所有活跃用户
const regularUsers = await getUsersExcludingRoles(['admin', 'superuser']);

// 获取 IT 部门中除了实习生的所有用户
const itUsers = await getUsersExcludingRoles(['intern'], 'IT');
```

### 3. 商品筛选

```javascript
async function getProductsExcludingBrands(excludedBrands, priceRange = null) {
  const query = {
    'brand_ne': excludedBrands,
    'available': true
  };
  
  if (priceRange) {
    query['price_gte'] = priceRange.min;
    query['price_lte'] = priceRange.max;
  }
  
  return await store.get('products', query);
}

// 排除特定品牌，价格在指定范围内的商品
const filteredProducts = await getProductsExcludingBrands(
  ['BrandA', 'BrandB', 'BrandC'],
  { min: 100, max: 1000 }
);
```

### 4. 数据清洗

```javascript
async function cleanData() {
  // 排除测试数据和无效数据
  const cleanUsers = await store.get('users', {
    email_ne: ['test@test.com', 'admin@test.com'],
    status_ne: ['deleted', 'suspended', 'test']
  });
  
  // 排除草稿和已删除的文章
  const validArticles = await store.get('articles', {
    status_ne: ['draft', 'deleted', 'spam']
  });
  
  return {
    users: cleanUsers,
    articles: validArticles
  };
}
```

## 与传统方法的对比

### 使用 _ne 数组（推荐）

```javascript
// 简洁明了
const result = await store.get('books', {
  category_ne: ['programming', 'design', 'markup']
});
```

### 传统方法（不推荐）

```javascript
// 需要多次查询或复杂逻辑
const allBooks = await store.get('books');
const result = allBooks.filter(book => 
  !['programming', 'design', 'markup'].includes(book.category)
);
```

## 注意事项

1. **数组长度**: 虽然支持任意长度的数组，但过长的排除列表可能影响性能
2. **类型转换**: 比较时会进行自动类型转换，确保数据类型一致性
3. **空值处理**: `null` 和 `undefined` 会被正确处理
4. **内存占用**: 大型排除数组会增加内存使用量

## 相关 API

- [查询过滤](/api/query) - 了解完整的查询语法
- [运算操作符](/api/query#运算操作符) - 学习其他比较操作符
- [CRUD 操作](/api/crud) - 基本的数据操作
- [优化数据获取](/api/enhanced-get) - 获取完整数据集的方法
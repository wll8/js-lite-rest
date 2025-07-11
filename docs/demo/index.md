# 在线示例

欢迎来到 js-lite-rest 在线示例！这里提供了丰富的交互式示例，帮助你快速了解和掌握 js-lite-rest 的各种功能。

## 🎯 示例列表

### [基础 CRUD 操作](/html-demo/basic-crud.html)

演示 js-lite-rest 的基本增删改查功能，包括：

- ✅ **创建数据** - 使用 POST 方法添加新记录
- ✅ **读取数据** - 使用 GET 方法获取数据
- ✅ **更新数据** - 使用 PUT/PATCH 方法修改记录
- ✅ **删除数据** - 使用 DELETE 方法删除记录
- ✅ **查询功能** - 支持条件查询和过滤

**适合人群**: 初学者，想要了解基本 CRUD 操作

[🚀 立即体验](/html-demo/basic-crud.html)

---

### [博客系统](/html-demo/blog-system.html)

完整的博客系统演示，展示复杂应用场景：

- 📝 **文章管理** - 创建、编辑、删除文章
- 💬 **评论系统** - 完整的评论功能，支持查看和修改
- 👥 **用户管理** - 用户信息管理
- 🔗 **关联数据** - 文章与评论的关联关系
- 📱 **响应式设计** - 适配各种屏幕尺寸

**适合人群**: 想要了解实际应用场景的开发者

[🚀 立即体验](/html-demo/blog-system.html)

---

### [中间件示例](/html-demo/middleware.html)

展示 js-lite-rest 强大的中间件系统：

- 📊 **日志中间件** - 记录所有 API 调用
- ✅ **验证中间件** - 数据格式和必填字段验证
- 🔒 **权限中间件** - 模拟用户权限检查
- 💾 **缓存中间件** - 缓存 GET 请求结果
- 🔧 **可配置** - 动态开启/关闭中间件

**适合人群**: 需要扩展功能的高级开发者

[🚀 立即体验](/html-demo/middleware.html)

---

### [性能测试](/html-demo/performance.html)

测试 js-lite-rest 在大量数据下的性能表现：

- ⚡ **批量操作** - 测试大量数据的增删改查
- 📊 **性能指标** - 显示吞吐量、延迟等指标
- 🧪 **可配置测试** - 自定义数据量和测试类型
- 📈 **实时统计** - 实时显示测试结果
- 🗑️ **数据清理** - 每次测试前自动清理数据

**适合人群**: 关注性能的开发者

[🚀 立即体验](/html-demo/performance.html)

---

### [查询功能](/html-demo/query-features.html)

展示 js-lite-rest 的高级查询功能：

- 🔍 **基础过滤** - 按字段值过滤数据
- 💰 **范围查询** - 价格、年龄等范围查询
- ⭐ **评分过滤** - 按评分等级过滤
- 📊 **排序功能** - 多字段排序
- 📄 **分页功能** - 支持分页浏览
- 🔎 **全文搜索** - 跨字段搜索功能
- 📈 **查询统计** - 查询性能统计

**适合人群**: 需要复杂查询功能的开发者

[🚀 立即体验](/html-demo/query-features.html)

---

### [关系操作](/html-demo/relations.html)

演示关联数据的处理方式：

- 🔗 **嵌套资源** - posts/1/comments 风格的嵌套操作
- 📦 **关联嵌入** - 使用 _embed 参数嵌入子资源
- 🔍 **关联扩展** - 使用 _expand 参数扩展父资源
- 👥 **多表关联** - 用户、文章、评论的三表关联
- 📊 **数据概览** - 实时显示数据统计

**适合人群**: 处理复杂数据关系的开发者

[🚀 立即体验](/html-demo/relations.html)

---

## 🛠️ 技术特性

所有示例都采用了以下技术：

- **🎨 UnoCSS** - 原子化 CSS 框架，通过 CDN 引入
- **📦 UMD 模块** - 直接在浏览器中使用，无需构建
- **📱 响应式设计** - 适配桌面和移动设备
- **🔄 实时更新** - 操作结果实时反馈
- **📝 操作日志** - 详细的操作记录和错误信息

## 🚀 快速开始

### 在控制台中体验

打开浏览器控制台，js-lite-rest 已经全局加载，你可以直接使用：

```javascript
// 创建一个简单的 store
const store = await createStore({
  todos: [
    { id: 1, text: '学习 js-lite-rest', completed: false },
    { id: 2, text: '构建应用', completed: false }
  ]
});

// 获取所有待办事项
const todos = await store.get('todos');
console.log('所有待办事项:', todos);

// 添加新的待办事项
const newTodo = await store.post('todos', {
  text: '分享给朋友',
  completed: false
});
console.log('新待办事项:', newTodo);

// 标记为完成
await store.patch(`todos/${newTodo.id}`, { completed: true });
console.log('已标记完成');

// 查询未完成的待办事项
const pending = await store.get('todos', { completed: false });
console.log('未完成的待办事项:', pending);
```

### 在你的项目中使用

```bash
# 安装
npm install js-lite-rest

# 或者使用 yarn
yarn add js-lite-rest

# 或者使用 pnpm
pnpm add js-lite-rest
```

```javascript
import createStore from 'js-lite-rest';

// 开始使用
const store = await createStore();
```

## 📚 学习路径

推荐的学习顺序：

1. **[基础 CRUD 操作](/html-demo/basic-crud.html)** - 了解基本概念
2. **[查询功能](/html-demo/query-features.html)** - 掌握查询技巧
3. **[关系操作](/html-demo/relations.html)** - 处理关联数据
4. **[博客系统](/html-demo/blog-system.html)** - 综合应用实践
5. **[中间件示例](/html-demo/middleware.html)** - 扩展功能
6. **[性能测试](/html-demo/performance.html)** - 性能优化

## 💡 使用提示

- **数据持久化**: 浏览器示例使用 localStorage，数据会保存在本地
- **清理数据**: 每个示例都提供了清理数据的功能
- **错误处理**: 注意查看操作日志中的错误信息
- **性能考虑**: 大量数据操作时建议使用批量方法
- **移动端**: 所有示例都支持移动端访问

## 🤝 反馈与贡献

如果你在使用过程中遇到问题或有改进建议，欢迎：

- 🐛 [报告 Bug](https://github.com/wll8/js-lite-rest/issues)
- 💡 [提出建议](https://github.com/wll8/js-lite-rest/discussions)
- 🔧 [贡献代码](https://github.com/wll8/js-lite-rest/pulls)

---

<div class="text-center mt-8">
  <p class="text-gray-600 mb-4">
    选择一个示例开始你的 js-lite-rest 之旅吧！
  </p>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
    <a href="/html-demo/basic-crud.html" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm">基础 CRUD</a>
    <a href="/html-demo/blog-system.html" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">博客系统</a>
    <a href="/html-demo/middleware.html" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm">中间件</a>
    <a href="/html-demo/performance.html" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">性能测试</a>
    <a href="/html-demo/query-features.html" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm">查询功能</a>
    <a href="/html-demo/relations.html" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm">关系操作</a>
  </div>
</div>

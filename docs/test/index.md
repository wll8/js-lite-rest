# 测试概览

js-lite-rest 拥有完整的测试套件，确保库的稳定性和可靠性。本页面提供了测试相关的信息和资源。

## 📊 测试统计

当前测试覆盖情况：

- **测试用例总数**: 66 个
- **测试通过率**: 100%
- **代码覆盖率**: 95%+
- **支持环境**: Node.js + 浏览器

## 🧪 测试分类

### 基本操作测试
- ✅ GET 列表和详情
- ✅ POST 新增数据
- ✅ PUT 完整更新
- ✅ DELETE 删除数据
- ✅ PATCH 部分更新

### 查询功能测试
- ✅ 基础过滤查询
- ✅ 多字段过滤
- ✅ 同字段多值过滤
- ✅ 深层字段过滤
- ✅ 分页功能
- ✅ 排序功能
- ✅ 数据截取
- ✅ 范围查询
- ✅ 模糊查询
- ✅ 全文检索

### 关系操作测试
- ✅ 关联嵌入 (_embed)
- ✅ 关联扩展 (_expand)
- ✅ 嵌套资源操作
- ✅ 批量操作

### 中间件系统测试
- ✅ 前置拦截器
- ✅ 后置拦截器
- ✅ 多个拦截器链式处理
- ✅ 拦截器错误处理
- ✅ 拦截器数据修改
- ✅ 拦截器验证功能

### 配置选项测试
- ✅ 默认配置验证
- ✅ 自定义配置
- ✅ 存储路径配置
- ✅ 自定义适配器
- ✅ 加载和保存函数
- ✅ 环境特定存储

### 持久化测试
- ✅ 文件系统持久化 (Node.js)
- ✅ localStorage 持久化 (浏览器)
- ✅ 自定义存储适配器

## 🔍 查看测试报告

### [完整测试报告](/test-results/mochawesome-results.html)

查看详细的测试执行报告，包括：
- 所有测试用例的执行结果
- 测试执行时间统计
- 错误和失败详情
- 代码覆盖率报告

[📊 查看完整报告](/test-results/mochawesome-results.html)

### 测试用例示例

以下是一些关键测试用例的示例：

#### 基本 CRUD 操作测试

```javascript
describe('基本操作', () => {
  it('get 列表', async () => {
    const result = await store.get('posts');
    expect(result).to.be.an('array');
    expect(result.length).to.equal(3);
  });

  it('post 新增', async () => {
    const newPost = await store.post('posts', {
      title: 'new post',
      author: 'test'
    });
    expect(newPost).to.have.property('id');
    expect(newPost.title).to.equal('new post');
  });

  it('put 更新', async () => {
    const updated = await store.put('posts/1', {
      title: 'updated title',
      author: 'updated author'
    });
    expect(updated.title).to.equal('updated title');
  });
});
```

#### 查询功能测试

```javascript
describe('查询功能', () => {
  it('基础过滤', async () => {
    const result = await store.get('posts', { author: 'john' });
    expect(result).to.be.an('array');
    result.forEach(post => {
      expect(post.author).to.equal('john');
    });
  });

  it('范围查询', async () => {
    const result = await store.get('posts', {
      views_gte: 100,
      views_lte: 500
    });
    result.forEach(post => {
      expect(post.views).to.be.at.least(100);
      expect(post.views).to.be.at.most(500);
    });
  });

  it('分页查询', async () => {
    const result = await store.get('posts', {
      _page: 1,
      _limit: 2
    });
    expect(result.length).to.equal(2);
  });
});
```

#### 中间件测试

```javascript
describe('中间件功能', () => {
  it('前置拦截器', async () => {
    let intercepted = false;
    
    store.use(async (args, next) => {
      intercepted = true;
      return next();
    });
    
    await store.get('posts');
    expect(intercepted).to.be.true;
  });

  it('数据验证中间件', async () => {
    store.use(async (args, next) => {
      const [method, path, data] = args;
      if (method === 'post' && !data.title) {
        throw new Error('title is required');
      }
      return next();
    });
    
    try {
      await store.post('posts', { author: 'test' });
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).to.equal('title is required');
    }
  });
});
```

## 🚀 运行测试

### 本地运行测试

如果你想在本地运行测试：

```bash
# 克隆仓库
git clone https://github.com/wll8/js-lite-rest.git
cd js-lite-rest

# 安装依赖
pnpm install

# 运行所有测试
pnpm test

# 运行开发模式测试
pnpm test:dev

# 运行浏览器环境测试
pnpm test:dev:browser

# 运行构建后测试
pnpm test:build
```

### 测试环境

测试在以下环境中运行：

- **Node.js**: 20+
- **浏览器**: Chrome, Firefox, Safari, Edge
- **测试框架**: Mocha + Chai
- **模拟环境**: JSDOM (用于浏览器环境测试)

## 📈 持续集成

js-lite-rest 使用 GitHub Actions 进行持续集成：

- ✅ 每次提交都会自动运行测试
- ✅ 支持多个 Node.js 版本测试
- ✅ 同时测试 Node.js 和浏览器环境
- ✅ 自动生成测试报告
- ✅ 代码覆盖率检查

## 🐛 报告问题

如果你发现了 bug 或测试问题：

1. **检查现有问题**: 先查看 [GitHub Issues](https://github.com/wll8/js-lite-rest/issues)
2. **创建新问题**: 提供详细的重现步骤和环境信息
3. **提供测试用例**: 如果可能，提供失败的测试用例

## 🤝 贡献测试

欢迎为 js-lite-rest 贡献测试用例：

1. **Fork 仓库**
2. **添加测试用例** 到 `test/` 目录
3. **确保测试通过** 运行 `pnpm test`
4. **提交 Pull Request**

### 测试编写指南

- 使用描述性的测试名称
- 每个测试应该只测试一个功能点
- 提供充分的断言验证
- 包含边界情况和错误情况
- 保持测试的独立性

## 📚 相关资源

- [API 文档](/api/) - 了解所有 API 的详细说明
- [在线示例](/demo/) - 查看实际使用示例
- [GitHub 仓库](https://github.com/wll8/js-lite-rest) - 源代码和问题跟踪
- [测试报告](/test-results/mochawesome-results.html) - 详细的测试执行结果

---

<div class="text-center mt-8">
  <p class="text-gray-600 mb-4">
    测试是保证代码质量的重要手段，感谢你对测试的关注！
  </p>
  <div class="flex justify-center space-x-4">
    <a href="/test-results/mochawesome-results.html" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">查看测试报告</a>
    <a href="https://github.com/wll8/js-lite-rest/tree/main/test" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">查看测试代码</a>
  </div>
</div>

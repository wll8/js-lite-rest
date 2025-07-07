import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
import { Store } from './store.js';

export function testStoreBasic(Store) {
  describe('Store 基础功能', () => {
    let store;
    beforeEach(() => {
      store = new Store({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
    });

    it('get 列表', async () => {
      const books = await store.get('book');
      expect(books.length).to.equal(2);
    });

    it('get 详情', async () => {
      const book = await store.get('book/1');
      expect(book).to.deep.equal({ id: 1, title: 'css' });
    });

    it('get 查询', async () => {
      const books = await store.get('book', { title: 'css' });
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
    });

    it('post 新增', async () => {
      await store.post('book', { title: 'html' });
      const books = await store.get('book');
      expect(books.length).to.equal(3);
      expect(books[2].title).to.equal('html');
    });

    it('put 更新', async () => {
      await store.put('book/1', { title: 'css3' });
      const books = await store.get('book');
      expect(books[0].title).to.equal('css3');
    });

    it('delete 删除', async () => {
      await store.delete('book/1');
      const books = await store.get('book');
      expect(books.length).to.equal(1);
      expect(books[0].id).to.equal(2);
    });

    it('patch 部分更新', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', author: 'A' },
          { id: 2, title: 'js', author: 'B' },
        ],
      });
      // 只更新 title 字段
      await store.patch('book/1', { title: 'css3' });
      const book = await store.get('book/1');
      expect(book).to.deep.equal({ id: 1, title: 'css3', author: 'A' });
      // 只更新 author 字段
      await store.patch('book/1', { author: 'C' });
      const book2 = await store.get('book/1');
      expect(book2).to.deep.equal({ id: 1, title: 'css3', author: 'C' });
    });

    it('get 多字段过滤', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', type: 'js', discount: 1 },
          { id: 2, title: 'js', type: 'js', discount: 0 },
          { id: 3, title: 'html', type: 'html', discount: 1 },
        ],
      });
      const books = await store.get('book', { discount: 1, type: 'js' });
      expect(books.length).to.equal(1);
      expect(books[0].id).to.equal(1);
    });

    it('get 同字段多值过滤', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
          { id: 3, title: 'html' },
        ],
      });
      // 模拟 id=1&id=2 这种情况
      const books = await store.get('book', { id: [1, 2] });
      expect(books.length).to.equal(2);
      expect(books.map(b => b.id)).to.include(1).and.include(2);
    });

    it('get 点语法深层字段过滤', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', author: { name: '张三' } },
          { id: 2, title: 'js', author: { name: '李四' } },
        ],
      });
      const books = await store.get('book', { 'author.name': '张三' });
      expect(books.length).to.equal(1);
      expect(books[0].author.name).to.equal('张三');
    });
  });
  describe('Store 拦截器功能', () => {
    let store;
    
    beforeEach(() => {
      store = new Store({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
    });

    it('前置拦截器 - 修改请求参数', async () => {
      const requestLog = [];
      
      store.use(async (args, next) => {
        requestLog.push({ type: 'before', args: [...args] });
        // 修改查询参数
        if (args[0] === 'get' && args[1] === 'book') {
          args[2] = { title: 'css' }; // 强制查询 css
        }
        const result = await next(args);
        requestLog.push({ type: 'after', result });
        return result;
      });

      const books = await store.get('book');
      
      expect(requestLog).to.have.length(2);
      expect(requestLog[0].type).to.equal('before');
      expect(requestLog[1].type).to.equal('after');
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
    });

    it('后置拦截器 - 修改响应数据', async () => {
      store.use(async (args, next) => {
        const result = await next(args);
        // 为所有书籍添加时间戳
        if (Array.isArray(result)) {
          return result.map(book => ({ ...book, timestamp: Date.now() }));
        }
        return result;
      });

      const books = await store.get('book');
      
      expect(books.length).to.equal(2);
      expect(books[0]).to.have.property('timestamp');
      expect(books[1]).to.have.property('timestamp');
    });

    it('多个拦截器 - 链式处理与数据传递', async () => {
      store.use(async (args, next) => {
        // 添加标记1
        const result = await next(args);
        if (Array.isArray(result)) {
          return result.map(item => ({ ...item, tag1: true }));
        }
        return result;
      });

      store.use(async (args, next) => {
        // 添加标记2
        const result = await next(args);
        if (Array.isArray(result)) {
          return result.map(item => ({ ...item, tag2: true }));
        }
        return result;
      });

      const books = await store.get('book');
      expect(books.length).to.equal(2);
      expect(books[0]).to.have.property('tag1', true);
      expect(books[0]).to.have.property('tag2', true);
      expect(books[1]).to.have.property('tag1', true);
      expect(books[1]).to.have.property('tag2', true);
    });

    it('拦截器中断链后，后续拦截器不会执行', async () => {
      let secondCalled = false;

      store.use(async (args, next) => {
        // 不调用 next，直接返回
        return [{ id: 999, title: 'fake' }];
      });

      store.use(async (args, next) => {
        secondCalled = true;
        return await next(args);
      });

      const books = await store.get('book');
      expect(books).to.deep.equal([{ id: 999, title: 'fake' }]);
      expect(secondCalled).to.equal(false);
    });

    it('拦截器错误处理', async () => {
      let errorCaught = false;
      
      store.use(async (args, next) => {
        try {
          const result = await next(args);
          return result;
        } catch (error) {
          errorCaught = true;
          throw error;
        }
      });

      store.use(async (args, next) => {
        if (args[0] === 'get') {
          throw new Error('模拟拦截器错误');
        }
        return await next(args);
      });

      try {
        await store.get('book');
      } catch (error) {
        expect(error.message).to.equal('模拟拦截器错误');
        expect(errorCaught).to.equal(true);
      }
    });

    it('拦截器阻止请求', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'delete') {
          // 阻止删除操作
          return { blocked: true, message: '删除操作被拦截' };
        }
        return await next(args);
      });

      const result = await store.delete('book/1');
      
      expect(result.blocked).to.equal(true);
      expect(result.message).to.equal('删除操作被拦截');
      
      // 验证数据没有被删除
      const books = await store.get('book');
      expect(books.length).to.equal(2);
    });

    it('拦截器修改 POST 数据', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'post') {
          // 为所有新增的数据添加创建时间
          args[2] = { ...args[2], createdAt: new Date().toISOString() };
        }
        return await next(args);
      });

      const newBook = { title: 'vue' };
      const result = await store.post('book', newBook);
      
      expect(result).to.have.property('createdAt');
      expect(result.title).to.equal('vue');
      
      const books = await store.get('book');
      expect(books.length).to.equal(3);
    });

    it('拦截器验证数据', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'post' || args[0] === 'put') {
          const data = args[2];
          if (!data.title || data.title.length < 2) {
            throw new Error('标题长度必须大于2个字符');
          }
        }
        return await next(args);
      });

      // 测试有效数据
      const validBook = { title: 'react' };
      await expect(store.post('book', validBook)).to.be.fulfilled;

      // 测试无效数据
      const invalidBook = { title: 'a' };
      await expect(store.post('book', invalidBook)).to.be.rejectedWith('标题长度必须大于2个字符');
    });

    it('拦截器添加认证信息', async () => {
      store.use(async (args, next, opt) => {
        // 模拟添加认证头
        opt.headers = opt.headers || {};
        opt.headers['Authorization'] = 'Bearer token123';
        return await next(args);
      });

      store.use(async (args, next, opt) => {
        // 验证认证信息
        expect(opt.headers['Authorization']).to.equal('Bearer token123');
        return await next(args);
      });

      await store.get('book');
    });

    it('拦截器缓存机制', async () => {
      const cache = new Map();
      
      store.use(async (args, next) => {
        const cacheKey = JSON.stringify(args);
        
        if (args[0] === 'get' && cache.has(cacheKey)) {
          return cache.get(cacheKey);
        }
        
        const result = await next(args);
        
        if (args[0] === 'get') {
          cache.set(cacheKey, result);
        }
        
        return result;
      });

      // 第一次请求
      const books1 = await store.get('book');
      expect(books1.length).to.equal(2);
      
      // 第二次请求应该从缓存返回
      const books2 = await store.get('book');
      expect(books2).to.equal(books1); // 应该是同一个引用
      
      // 修改数据后缓存应该失效
      await store.post('book', { title: 'angular' });
      const books3 = await store.get('book');
      expect(books3.length).to.equal(3);
    });
  });
}

testStoreBasic(Store);
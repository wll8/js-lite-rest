import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import fs from 'fs';

function fn({ JsLiteRest, cleanStorageData }) {
  // 检测当前环境
  const isNodeEnv = typeof window === 'undefined';

  // 读取存储中的完整数据（Node 读文件 / 浏览器读 localforage）
  async function readStored(savePath) {
    if (isNodeEnv) {
      return JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    }
    return await JsLiteRest.lib.localforage.getItem(savePath);
  }

  // 创建带自定义 save 的 store，用于模拟落盘失败
  function createWithFailingSave(savePath, shouldFail) {
    return JsLiteRest.create(savePath, {
      save: async (key, data) => {
        if (shouldFail()) {
          throw new Error('模拟磁盘写入失败');
        }
        if (isNodeEnv) {
          await fs.promises.writeFile(key, JSON.stringify(data, null, 2), 'utf-8');
        } else {
          await JsLiteRest.lib.localforage.setItem(key, data);
        }
      },
    });
  }

  describe('并发与高频写入', function () {
    this.timeout(10000);

    const TEST_KEY = 'test-concurrency-store';

    afterEach(async () => {
      await cleanStorageData(TEST_KEY);
    });

    it('并发 post 不丢失数据，且全部落盘', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      const total = 50;
      const results = await Promise.all(
        Array.from({ length: total }, (_, i) => store.post('users', { name: `user-${i}` }))
      );

      // 每个请求都成功返回各自的数据，且 id 互不重复
      results.forEach((item, i) => {
        expect(item.name).to.equal(`user-${i}`);
      });
      const resultIds = results.map(item => String(item.id));
      expect(new Set(resultIds).size).to.equal(total);

      // 落盘数据与响应一致
      const stored = await readStored(TEST_KEY);
      expect(stored.users).to.have.lengthOf(total);
      const storedIds = stored.users.map(item => String(item.id));
      expect(new Set(storedIds).size).to.equal(total);
    });

    it('并发 patch 与 delete 混合操作后状态一致', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      // 预置 10 条记录
      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push(await store.post('books', { title: `book-${i}`, version: 0 }));
      }

      // 并发：前 5 条 patch，后 5 条 delete
      await Promise.all([
        ...items.slice(0, 5).map(book => store.patch(`books/${book.id}`, { version: 1 })),
        ...items.slice(5).map(book => store.delete(`books/${book.id}`)),
      ]);

      const stored = await readStored(TEST_KEY);
      expect(stored.books).to.have.lengthOf(5);
      // 保留的都是被 patch 的记录，且修改生效
      stored.books.forEach((book) => {
        expect(book.version).to.equal(1);
      });
    });

    it('并发写操作按发起顺序执行（FIFO）', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      const order = [];
      // 中间件在写队列的临界区内触发，记录顺序即实际执行顺序
      store.use(async (args, next) => {
        const [method, , data] = args;
        if (method === 'post') order.push(data.name);
        await next();
      });

      await Promise.all([
        store.post('users', { name: 'first' }),
        store.post('users', { name: 'second' }),
        store.post('users', { name: 'third' }),
      ]);

      expect(order).to.deep.equal(['first', 'second', 'third']);
    });

    it('写操作失败不阻塞后续写操作', async () => {
      // 首次 save 抛错，之后正常
      let failNextSave = true;
      const store = await createWithFailingSave(TEST_KEY, () => failNextSave);

      // 首条写入失败（落盘失败返回 500 错误）
      const firstPost = store.post('users', { name: 'fail' });
      await expect(firstPost).to.be.rejected;

      // 恢复正常落盘，后续写入不受前序失败影响
      failNextSave = false;
      const second = await store.post('users', { name: 'ok' });
      expect(second.name).to.equal('ok');

      const stored = await readStored(TEST_KEY);
      const names = stored.users.map(item => item.name);
      expect(names).to.include('ok');
    });

    it('外部同步与并发写不互相打断', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      await store.post('users', { name: 'init' });

      // 写操作与外部变更重读并发发起：写队列保证两者串行，写入不丢失
      await Promise.all([
        store.post('users', { name: 'writer' }),
        store._syncFromExternal(),
      ]);

      const stored = await readStored(TEST_KEY);
      const names = stored.users.map(item => item.name);
      expect(names).to.include('writer');
      expect(stored.users).to.have.lengthOf(2);
    });

    it('并发 kv.set 按顺序生效，最终值为最后一次写入', async () => {
      const store = await JsLiteRest.create(TEST_KEY);

      await Promise.all([
        store.kv.set('counter', 1),
        store.kv.set('counter', 2),
        store.kv.set('counter', 3),
      ]);

      const stored = await readStored(TEST_KEY);
      expect(stored.counter).to.equal(3);
    });
  });
}

export default fn;

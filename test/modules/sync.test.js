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

  // 直接写入存储，模拟其他标签页/进程的修改
  async function setStored(savePath, data) {
    if (isNodeEnv) {
      fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8');
    } else {
      await JsLiteRest.lib.localforage.setItem(savePath, data);
    }
  }

  // 在存储现有数据的基础上应用外部修改
  async function applyExternalChange(savePath, mutate) {
    const data = (await readStored(savePath)) || {};
    mutate(data);
    await setStored(savePath, data);
  }

  // 轮询等待条件成立（广播消息为异步投递，期间查询可能尚未同步而抛错）
  async function waitFor(check, timeout = 1500) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await check()) return true;
      } catch {
        // 条件未满足（如资源尚未同步），继续等待
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    try {
      return await check();
    } catch {
      return false;
    }
  }

  describe('多标签页同步', function () {
    this.timeout(5000);

    const TEST_KEY = 'test-sync-store';

    afterEach(async () => {
      await cleanStorageData(TEST_KEY);
    });

    describe('写前重读（防止丢失更新）', () => {
      it('post 前重读，不丢失外部新增的表', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        await store.post('books', { title: '本标签页写入' });

        // 模拟其他标签页新增一张表
        await applyExternalChange(TEST_KEY, (data) => {
          data.logs = [{ id: 1, text: '外部写入的日志' }];
        });

        // 本标签页继续写入另一张表
        await store.post('users', { name: 'Alice' });

        // 外部表与本标签页的写入共存
        const stored = await readStored(TEST_KEY);
        expect(stored.logs).to.have.lengthOf(1);
        expect(stored.users).to.have.lengthOf(1);
      });

      it('patch 前重读，不覆盖外部修改的字段', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        const book = await store.post('books', { title: 'js' });

        // 模拟其他标签页给同一条记录新增字段
        await applyExternalChange(TEST_KEY, (data) => {
          const target = data.books.find(b => String(b.id) === String(book.id));
          target.price = 99;
        });

        // 本标签页内存中的旧数据没有 price 字段
        await store.patch(`books/${book.id}`, { title: 'js advanced' });

        const stored = await readStored(TEST_KEY);
        const updated = stored.books.find(b => String(b.id) === String(book.id));
        expect(updated.title).to.equal('js advanced');
        expect(updated.price).to.equal(99);
      });

      it('put 前重读，不覆盖外部修改的字段', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        const book = await store.post('books', { title: 'js', author: '旧作者' });

        // 模拟其他标签页修改 author
        await applyExternalChange(TEST_KEY, (data) => {
          const target = data.books.find(b => String(b.id) === String(book.id));
          target.author = '外部新作者';
        });

        // 本标签页 put 修改 title
        await store.put(`books/${book.id}`, { title: 'js advanced' });

        const stored = await readStored(TEST_KEY);
        const updated = stored.books.find(b => String(b.id) === String(book.id));
        expect(updated.title).to.equal('js advanced');
        expect(updated.author).to.equal('外部新作者');
      });

      it('delete 前重读，不删除外部新增的记录', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        const firstBook = await store.post('books', { title: 'js' });
        await store.post('books', { title: 'css' });

        // 模拟其他标签页新增一条记录
        await applyExternalChange(TEST_KEY, (data) => {
          data.books.push({ id: 'ext-1', title: '外部新增' });
        });

        await store.delete(`books/${firstBook.id}`);

        const stored = await readStored(TEST_KEY);
        expect(stored.books).to.have.lengthOf(2);
        expect(stored.books.map(b => b.title)).to.include('外部新增');
      });

      it('kv.set 前重读，不覆盖外部 kv 数据', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        await store.kv.set('a', { n: 1 });

        // 模拟其他标签页写入另一个 kv 键
        await applyExternalChange(TEST_KEY, (data) => {
          data.b = { n: 2 };
        });

        await store.kv.set('c', { n: 3 });

        const stored = await readStored(TEST_KEY);
        expect(stored.a).to.deep.equal({ n: 1 });
        expect(stored.b).to.deep.equal({ n: 2 });
        expect(stored.c).to.deep.equal({ n: 3 });
      });

      it('内存模式（无 load/save）写操作不受影响', async () => {
        // 原始 Store 类（不经过 lite 拦截器）返回标准响应结构
        // Store 兼容直接引用与 Promise getter 两种入口形态
        const StoreClass = await JsLiteRest.Store;
        const store = await StoreClass.create({
          books: [{ id: 1, title: '内存数据' }]
        });
        const postRes = await store.post('books', { title: '新数据' });
        expect(postRes.code).to.equal(201);
        const getRes = await store.get('books');
        expect(getRes.data.length).to.equal(2);
      });

      it('save 后的指纹缓存不漏检外部直写', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        await store.post('books', { title: '本页写入' });

        // 模拟其他标签页直写存储后，本页继续写，外部修改必须保留
        await applyExternalChange(TEST_KEY, (data) => {
          data.logs = [{ id: 'ext-1', text: '外部写入' }];
        });

        await store.post('users', { name: 'Alice' });

        const stored = await readStored(TEST_KEY);
        expect(stored.logs).to.have.lengthOf(1);
        expect(stored.users).to.have.lengthOf(1);
      });
    });

    describe('onChange 与变更通知', () => {
      it('onChange 注册、触发与取消', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        const calls = [];
        const unsubscribe = store.onChange((info) => calls.push(info));

        await store._syncFromExternal();
        expect(calls).to.have.lengthOf(1);
        expect(calls[0].source).to.equal('external');

        // 取消后不再触发
        unsubscribe();
        await store._syncFromExternal();
        expect(calls).to.have.lengthOf(1);
      });

      it('外部变更后内存副本被刷新', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        let notified = false;
        store.onChange(() => { notified = true; });

        await applyExternalChange(TEST_KEY, (data) => {
          data.books = [{ id: 1, title: '外部写入' }];
        });

        await store._syncFromExternal();
        expect(notified).to.equal(true);
        const books = await store.get('books');
        expect(books).to.have.lengthOf(1);
        expect(books[0].title).to.equal('外部写入');
      });

      it('存在待落盘修改被跳过重读时不通知监听器', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        let notified = false;
        store.onChange(() => { notified = true; });

        // 模拟写任务进行中（内存已改、尚未落盘）的脏状态
        store.opt.adapter._dirty = true;
        const changed = await store._syncFromExternal();
        // 修复前：重读被 _dirty 守卫跳过仍发空通知
        expect(changed).to.equal(false);
        expect(notified).to.equal(false);
      });
    });

    describe('跨实例广播同步', () => {
      // Node.js 入口（store.node.ts）未集成广播，仅在浏览器入口测试
      if (isNodeEnv) {
        it.skip('跨实例广播同步 - 跳过（浏览器专用测试）', () => {});
      } else {
        it('写入后其他实例自动刷新并触发 onChange', async () => {
          const storeA = await JsLiteRest.create(TEST_KEY);
          const storeB = await JsLiteRest.create(TEST_KEY);

          const received = [];
          storeB.onChange((info) => received.push(info));

          await storeA.post('books', { title: 'A 标签页写入' });

          // B 收到广播后自动重读存储
          const synced = await waitFor(async () => {
            const books = await storeB.get('books');
            return books.length === 1 && books[0].title === 'A 标签页写入';
          });
          expect(synced).to.equal(true);
          expect(received.length).to.be.at.least(1);
          expect(received[0].source).to.equal('external');
        });

        it('不同存储键的实例不互相干扰', async () => {
          const OTHER_KEY = 'test-sync-other';
          try {
            const storeA = await JsLiteRest.create(TEST_KEY);
            const storeB = await JsLiteRest.create(OTHER_KEY);

            let bNotified = false;
            storeB.onChange(() => { bNotified = true; });

            await storeA.post('books', { title: 'A 写入' });

            // 等待一段时间，B 不应收到不相关键的变更通知
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(bNotified).to.equal(false);
          } finally {
            await cleanStorageData(OTHER_KEY);
          }
        });
      }
    });
  });
}

export default fn;

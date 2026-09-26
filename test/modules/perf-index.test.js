import chai from 'chai';
const expect = chai.expect;

import fs from 'fs';

function fn({ JsLiteRest, cleanStorageData }) {
  const isNodeEnv = typeof window === 'undefined';

  async function readStored(savePath) {
    if (isNodeEnv) {
      return JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    }
    return await JsLiteRest.lib.localforage.getItem(savePath);
  }

  describe('id 索引正确性', function () {
    this.timeout(10000);

    const TEST_KEY = 'test-perf-index';

    afterEach(async () => {
      await cleanStorageData(TEST_KEY);
    });

    it('2000 条规模下按 id 读写删结果与线性查找一致', async () => {
      const total = 2000;
      const seed = Array.from({ length: total }, (_, i) => ({ id: i + 1, title: `t-${i}`, group: i % 7 }));
      // 初始数据对象 + overwrite，直接以大数据集建库（逐条 post 太慢）
      const store = await JsLiteRest.create({ books: seed }, { savePath: TEST_KEY, overwrite: true });
      // 按 id 读
      for (const id of [1, 500, 1000, 2000]) {
        const book = await store.get(`books/${id}`);
        expect(book).to.not.equal(null);
        expect(book.id).to.equal(id);
      }
      // lite 拦截器下未命中为 404 错误响应（throw），捕获后断言空数据
      const miss = await store.get('books/99999').catch(err => err);
      expect(miss.data).to.equal(null);

      // patch 后读回
      await store.patch('books/500', { title: 'patched' });
      const patched = await store.get('books/500');
      expect(patched.title).to.equal('patched');
      // seed 构造为 id = i + 1、group = i % 7，故 id=500 的 group 为 499 % 7
      expect(patched.group).to.equal(499 % 7);

      // delete 后读不到，其余仍在
      await store.delete('books/1000');
      const missDel = await store.get('books/1000').catch(err => err);
      expect(missDel.data).to.equal(null);
      const rest = await store.get('books');
      expect(rest).to.have.lengthOf(total - 1);

      // 落盘内容与内存一致
      const stored = await readStored(TEST_KEY);
      expect(stored.books).to.have.lengthOf(total - 1);
    });

    it('put 换 id 后旧 id 不再命中幽灵索引键', async () => {
      const store = await JsLiteRest.create(
        { books: [{ id: 1, title: 'a' }] },
        { savePath: TEST_KEY, overwrite: true }
      );
      // 先读一次建索引（惰性构建），换 id 才会产生幽灵旧键
      expect((await store.get('books/1')).title).to.equal('a');
      // put body 携带新 id，把记录改名
      await store.put('books/1', { id: 999 });
      // lite 拦截器下未命中为 404 错误响应（throw），捕获后断言空数据
      // 修复前：旧 id 键仍指向被顶替对象，读旧 id 返回改名后的记录
      const missOld = await store.get('books/1').catch(err => err);
      expect(missOld.data).to.equal(null);
      // 新 id 可读
      expect((await store.get('books/999')).title).to.equal('a');
    });

    it('重复 id 的记录取第一个（与 findIndex 语义一致）', async () => {
      // 原始 Store 类内存模式，注入重复 id 数据
      const raw = await JsLiteRest.Store.create(
        { dup: [{ id: 'x', tag: 1 }, { id: 'x', tag: 2 }] }
      );
      // 原始 Store 类无拦截器，get 返回响应对象，数据在 data 字段
      const hit = await raw.get('dup/x');
      expect(hit.data.tag).to.equal(1);
      await raw.delete('dup/x');
      const rest = (await raw.get('dup')).data;
      expect(rest).to.have.lengthOf(1);
      expect(rest[0].tag).to.equal(2);
    });

    it('删除重复 id 的第一条后仍能读到第二条', async () => {
      const raw = await JsLiteRest.Store.create({ dup: [{ id: 'x', tag: 1 }, { id: 'x', tag: 2 }] });
      expect((await raw.get('dup/x')).data.tag).to.equal(1);
      await raw.delete('dup/x');
      // 修复前：索引键被直接删除，返回 404（data 为 null，取 data.tag 抛 TypeError）
      expect((await raw.get('dup/x')).data.tag).to.equal(2);
    });

    it('嵌套数组的写入不污染顶层表索引', async () => {
      const raw = await JsLiteRest.Store.create({
        books: [{ id: 1, title: 'a', tags: [{ id: 1, name: 't' }] }],
      });
      // 先读一次建 books 索引（惰性构建），嵌套写入才有污染对象
      expect((await raw.get('books/1')).data.title).to.equal('a');
      // put 的导航循环对按 id 中间段不支持（既有行为），用下标语法到达嵌套 tags 数组
      await raw.put('books[0]/tags/1', { name: 't2' });
      // 修复前：books 索引键 '1' 被 tag 顶替，get 返回 tag 对象
      expect((await raw.get('books/1')).data.title).to.equal('a');
      expect((await raw.get('books/1')).data.tags[0].name).to.equal('t2');
    });

    it('嵌套数组的删除不影响顶层表索引', async () => {
      const raw = await JsLiteRest.Store.create({
        books: [{ id: 1, title: 'a', tags: [{ id: 1, name: 't' }] }],
      });
      // 先读一次建 books 索引（惰性构建），嵌套删除才有误删对象
      expect((await raw.get('books/1')).data.title).to.equal('a');
      // delete 的导航循环对按 id 中间段不支持（既有行为），用下标语法到达嵌套 tags 数组
      await raw.delete('books[0]/tags/1');
      // 修复前：books 索引键 '1' 被误删，get 返回 404
      expect((await raw.get('books/1')).data.title).to.equal('a');
      expect((await raw.get('books/1')).data.tags).to.have.lengthOf(0);
    });

    it('数字 id 与字符串路径互查', async () => {
      const raw = await JsLiteRest.Store.create(
        { nums: [{ id: 42, v: 'a' }] }
      );
      // 原始 Store 类无拦截器，get 返回响应对象，数据在 data 字段
      const hit = await raw.get('nums/42');
      expect(hit.data.v).to.equal('a');
    });

    it('外部直写存储后索引重建，本地写不串数据', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      const book = await store.post('books', { title: 'a' });
      // 外部新增一条记录（绕过本实例索引）
      if (isNodeEnv) {
        const data = JSON.parse(fs.readFileSync(TEST_KEY, 'utf-8'));
        data.books.push({ id: 'ext-1', title: 'ext' });
        fs.writeFileSync(TEST_KEY, JSON.stringify(data), 'utf-8');
      } else {
        const data = await JsLiteRest.lib.localforage.getItem(TEST_KEY);
        data.books.push({ id: 'ext-1', title: 'ext' });
        await JsLiteRest.lib.localforage.setItem(TEST_KEY, data);
      }
      // 本地修改外部新增的记录，写前重读 + 索引重建后应命中
      await store.patch('books/ext-1', { title: 'ext-patched' });
      const stored = await readStored(TEST_KEY);
      const ext = stored.books.find(b => b.id === 'ext-1');
      expect(ext.title).to.equal('ext-patched');
      expect(stored.books.find(b => String(b.id) === String(book.id)).title).to.equal('a');
    });
  });
}

export default fn;

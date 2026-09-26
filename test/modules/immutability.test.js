import chai from 'chai';
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('查询结果不可变性', () => {
    it('修改 get 返回的数组不应污染库数据', async () => {
      const store = await JsLiteRest.create({
        books: [
          { id: 1, title: 'a' },
          { id: 2, title: 'b' },
        ],
      });
      const books = await store.get('books');
      // 修改返回的数组和元素
      books.push({ id: 3, title: 'c' });
      books[0].title = 'changed';
      // 重新读取，库数据应保持不变
      const again = await store.get('books');
      expect(again.length).to.equal(2);
      expect(again[0].title).to.equal('a');
    });

    it('修改 get 返回对象的嵌套字段不应污染库数据', async () => {
      const store = await JsLiteRest.create({
        books: [{ id: 1, title: 'a', meta: { views: 0, tags: ['x'] } }],
      });
      const book = await store.get('books/1');
      book.meta.views = 999;
      book.meta.tags.push('y');
      const again = await store.get('books/1');
      expect(again.meta.views).to.equal(0);
      expect(again.meta.tags).to.deep.equal(['x']);
    });

    it('修改 kv.get 返回的对象不应污染库数据', async () => {
      const store = await JsLiteRest.create({ config: { theme: 'light' } });
      const conf = await store.kv.get('config');
      conf.theme = 'dark';
      const again = await store.kv.get('config');
      expect(again.theme).to.equal('light');
    });

    it('含函数字段的数据 get 时不抛错，函数被清洗', async () => {
      const store = await JsLiteRest.create({
        books: [{ id: 1, title: 'a', hook: () => 'x' }],
      });
      const book = await store.get('books/1');
      expect(book.title).to.equal('a');
      expect(book.hook).to.equal(undefined);
    });
  });
}

export default fn;

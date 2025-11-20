import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import fs from 'fs';


function fn({ JsLiteRest, cleanStorageData }) {
  // 基本操作
  describe('基本操作', () => {
    let store;
    beforeEach(async () => {
      store = await JsLiteRest.create({
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
      const testPath = `test-patch-${Date.now()}.json`;

      try {
        const store = await JsLiteRest.create({
          book: [
            { id: 1, title: 'css', author: 'A' },
            { id: 2, title: 'js', author: 'B' },
          ],
        }, {
          savePath: testPath,
          overwrite: true // 确保使用新数据，不合并
        });
        await store.patch('book/1', { title: 'css3' });
        const book = await store.get('book/1');
        expect(book).to.deep.equal({ id: 1, title: 'css3', author: 'A' });
        await store.patch('book/1', { author: 'C' });
        const book2 = await store.get('book/1');
        expect(book2).to.deep.equal({ id: 1, title: 'css3', author: 'C' });
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });
  });

}

export default fn;
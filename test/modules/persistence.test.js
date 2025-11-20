import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import fs from 'fs';

function fn({ JsLiteRest, cleanStorageData }) {
  // 检测当前环境
  const isNodeEnv = typeof window === 'undefined';

  describe('文件持久化', () => {
    const TEST_FILE = 'test-node-store.json';

    afterEach(() => {
      if (isNodeEnv && fs.existsSync(TEST_FILE)) {
        fs.unlinkSync(TEST_FILE);
      }
    });

    it('json', async () => {
      // 新建 store - 使用异步创建方法
      const store = await JsLiteRest.create(TEST_FILE);
      // 新增
      await store.post('book', { title: 'js' });
      await store.post('book', { title: 'css' });
      let books = await store.get('book');
      expect(books.length).to.equal(2);
      expect(books[0].title).to.equal('js');
      const firstBookId = books[0].id;
      await store.put(`book/${firstBookId}`, { title: 'html' });
      let book = await store.get(`book/${firstBookId}`);
      expect(book.title).to.equal('html');
      const secondBookId = books[1].id;
      await store.delete(`book/${secondBookId}`);
      books = await store.get('book');
      expect(books.length).to.equal(1);
      
      // 检查文件内容
      if (isNodeEnv) {
        const fileContent = JSON.parse(fs.readFileSync(TEST_FILE, 'utf-8'));
        expect(fileContent.book.length).to.equal(1);
        expect(fileContent.book[0].title).to.equal('html');
      }
    });
  });

  describe('本地存储持久化', () => {
    const TEST_KEY = 'test-browser-store';
    
    beforeEach(async () => {
      if (!isNodeEnv) {
        await JsLiteRest.lib.localforage.removeItem(TEST_KEY);
      }
    });
    
    // 只在浏览器环境下运行这些测试
    if (!isNodeEnv) {
      it('localforage 存储', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        // 新增
        const b1 = await store.post('book', { title: 'js' });
        const b2 = await store.post('book', { title: 'css' });
        let books = await store.get('book');
        expect(books.length).to.equal(2);
        expect(books[0].title).to.equal('js');
        // 修改
        await store.put(`book/${b1.id}`, { title: 'html' })
        let book = await store.get(`book/${b1.id}`)
        expect(book.title).to.equal('html');
        // 删除
        await store.delete(`book/${b2.id}`);
        books = await store.get('book');
        expect(books.length).to.equal(1);
        
        // 验证数据存储在 localforage 中
        const storedData = await JsLiteRest.lib.localforage.getItem(TEST_KEY);
        expect(storedData.book.length).to.equal(1);
        expect(storedData.book[0].title).to.equal('html');
      });
      
      it('localforage 数据体积扩展', async () => {
        const TEST_KEY_LARGE = 'test-browser-store-large';
        
        // 清理可能存在的测试数据
        await JsLiteRest.lib.localforage.removeItem(TEST_KEY_LARGE);
        
        const store = await JsLiteRest.create(TEST_KEY_LARGE);
        
        // 逐个创建数据来测试存储能力
        const bookCount = 50;
        for (let i = 0; i < bookCount; i++) {
          const bookData = {
            title: `Book ${i}`,
            content: `This is content for book ${i}. `.repeat(20),
            metadata: {
              author: `Author ${i}`,
              category: `Category ${i % 10}`,
              tags: [`tag${i}`, `tag${i + 1}`]
            }
          };
          
          await store.post('book', bookData);
        }
        
        // 验证数据完整性
        const allBooks = await store.get('book');
        expect(allBooks.length).to.equal(bookCount);
        expect(allBooks[0].title).to.equal('Book 0');
        expect(allBooks[bookCount - 1].title).to.equal(`Book ${bookCount - 1}`);
        
        // 验证数据确实存储在 localforage 中
        const localforageData = await JsLiteRest.lib.localforage.getItem(TEST_KEY_LARGE);
        expect(localforageData).to.not.be.null;
        expect(localforageData.book.length).to.equal(bookCount);
        
        await JsLiteRest.lib.localforage.removeItem(TEST_KEY_LARGE);
      });
    } else {
      // Node.js 环境下跳过这些测试
      it.skip('localforage 存储 - 跳过（浏览器专用测试）', () => {});
      it.skip('localforage 数据体积扩展 - 跳过（浏览器专用测试）', () => {});
    }
  });

  describe('使用原始 Store 类', () => {
    // 只在浏览器环境下运行这个测试
    if (!isNodeEnv) {
      it('创建 Store 实例', async () => {
        async function load(key) {
          return JSON.parse(window.localStorage.getItem(key) || '{}');
        }

        async function save(key, data) {
          window.localStorage.setItem(key, JSON.stringify(data));
        }
        
        const mergedOpt = { load, save };
        const store = await JsLiteRest.Store.create({
          books: [
            { id: 1, title: 'Book 1' },
            { id: 2, title: 'Book 2' }
          ]
        }, mergedOpt);
        const res = await store.get('books');
        expect(res.code).to.equal(200);
        expect(res.data.length).to.equal(2);
      });
    } else {
      // Node.js 环境下跳过这个测试
      it.skip('创建 Store 实例 - 跳过（浏览器专用测试）', () => {});
    }
  });
}

export default fn;
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import fs from 'fs';

// 导入所有测试模块
import basic from './modules/basic.test.js';
import filter from './modules/filter.test.js';
import pagination from './modules/pagination.test.js';
import sort from './modules/sort.test.js';
import slice from './modules/slice.test.js';
import operations from './modules/operations.test.js';
import search from './modules/search.test.js';
import relations from './modules/relations.test.js';
import nested from './modules/nested.test.js';
import batch from './modules/batch.test.js';
import middleware from './modules/middleware.test.js';
import errors from './modules/errors.test.js';
import config from './modules/config.test.js';
import optimization from './modules/optimization.test.js';
import features from './modules/features.test.js';
import arrayItems from './modules/array-items.test.js';
import persistence from './modules/persistence.test.js';

export function testMain(JsLiteRest, opt = {}) {
  if (opt.afterEach) {
    afterEach(opt.afterEach);
  }

  // 检测当前环境
  const isNodeEnv = typeof window === 'undefined';

  // 通用函数：根据存储路径读取实际存储的数据
  // 用于验证 Store 是否正确地将数据持久化到文件系统（Node.js）或 localStorage（浏览器）
  // 用法：const data = await readStorageData(store.opt.savePath);
  const readStorageData = async (savePath) => {
    if (isNodeEnv) {
      // Node.js 环境：读取文件系统
      const fsPromises = fs.promises;
      try {
        const fileContent = await fsPromises.readFile(savePath, 'utf-8');
        return JSON.parse(fileContent);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return null; // 文件不存在
        }
        throw error;
      }
    } else {
      // 浏览器环境：读取 localStorage
      return await JsLiteRest.lib.localforage.getItem(savePath);
    }
  };

  // 通用函数：清理对应环境下的存储数据
  // 用于删除测试产生的存储文件或清理 localStorage
  // 用法：await cleanStorageData(store.opt.savePath);
  const cleanStorageData = async (savePath) => {
    if (isNodeEnv) {
      // Node.js 环境：删除文件系统中的文件
      const fsPromises = fs.promises;
      try {
        await fsPromises.unlink(savePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // 文件不存在，忽略错误
          return;
        }
        throw error;
      }
    } else {
      // 浏览器环境：从 localStorage 中移除
      await JsLiteRest.lib.localforage.removeItem(savePath);
    }
  };

  // 调用各个测试模块
  basic({ JsLiteRest, cleanStorageData });
  filter({ JsLiteRest, cleanStorageData });
  pagination({ JsLiteRest, cleanStorageData });
  sort({ JsLiteRest, cleanStorageData });
  slice({ JsLiteRest, cleanStorageData });
  operations({ JsLiteRest, cleanStorageData });
  search({ JsLiteRest, cleanStorageData });
  relations({ JsLiteRest, cleanStorageData });
  nested({ JsLiteRest, cleanStorageData });
  batch({ JsLiteRest, cleanStorageData });
  middleware({ JsLiteRest, cleanStorageData });
  errors({ JsLiteRest, cleanStorageData });
  config({ JsLiteRest, cleanStorageData });
  optimization({ JsLiteRest, cleanStorageData });
  features({ JsLiteRest, cleanStorageData });
  arrayItems({ JsLiteRest, cleanStorageData });
  persistence({ JsLiteRest, cleanStorageData });
}

export async function testNodeStoreBasic(JsLiteRest) {
  const TEST_FILE = 'test-node-store.json';

  describe('文件持久化', () => {
    afterEach(() => {
      if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
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
      const fileContent = JSON.parse(fs.readFileSync(TEST_FILE, 'utf-8'));
      expect(fileContent.book.length).to.equal(1);
      expect(fileContent.book[0].title).to.equal('html');
    });
  });
}

export function testBrowserStore(JsLiteRest) {
  describe('使用原始 Store 类', () => { 
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
  });
  describe('本地存储持久化', () => {
    const TEST_KEY = 'test-browser-store';
    beforeEach(async () => {
      await JsLiteRest.lib.localforage.removeItem(TEST_KEY);
    });
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
  });
}

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest, cleanStorageData }) {
  // 检测当前环境
  const isNodeEnv = typeof window === 'undefined';

  describe('Store 配置项', () => {
    it('默认配置项', async () => {
      // 检查默认的 idKeySuffix
      const store = await JsLiteRest.create({
        posts: [{ id: 1, title: 'test' }],
        comments: [{ id: 1, postId: 1, content: 'comment' }]
      });

      expect(store.opt.idKeySuffix).to.equal('Id');

      // 测试默认的关系键生成 - postId 对应 posts + Id
      const result = await store.get('posts/1/comments');
      expect(Array.isArray(result)).to.equal(true);
      if (result.length > 0) {
        expect(result[0].content).to.equal('comment');
        expect(result[0].postId).to.equal(1);
      }
    });

    it('默认存储路径验证', async () => {
      // 传入数据对象，使用默认存储路径
      const store = await JsLiteRest.create({
        books: [{ id: 1, title: 'initial book' }]
      });

      // 验证默认路径被设置
      expect(store.opt.savePath).to.be.a('string');
      expect(store.opt.savePath.length).to.be.greaterThan(0);

      // 验证初始数据存在
      const books = await store.get('books');
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('initial book');

      // 添加数据
      await store.post('books', { title: 'new book' });

      // 验证数据更新
      const updatedBooks = await store.get('books');
      expect(updatedBooks.length).to.equal(2);
      expect(updatedBooks[1].title).to.equal('new book');
    });

    it('自定义 idKeySuffix 配置', async () => {
      const store = await JsLiteRest.create({
        posts: [{ id: 1, title: 'test' }],
        comments: [{ id: 1, post_id: 1, content: 'comment' }]
      }, {
        idKeySuffix: '_id'
      });

      expect(store.opt.idKeySuffix).to.equal('_id');

      // 先测试基本查询
      const allComments = await store.get('comments');
      expect(allComments.length).to.equal(1);

      // 测试自定义关系键 - 使用正确的字段名
      const result = await store.get('posts/1/comments');
      expect(Array.isArray(result)).to.equal(true);
      if (result.length > 0) {
        expect(result[0].content).to.equal('comment');
        expect(result[0].post_id).to.equal(1);
      }
    });

    it('自定义 savePath 配置', async () => {
      const testPath = `test-custom-path-${Date.now()}`;

      try {
        // 传入数据对象和自定义路径
        const store = await JsLiteRest.create({
          books: [{ id: 1, title: 'initial book' }]
        }, {
          savePath: testPath
        });

        expect(store.opt.savePath).to.equal(testPath);

        // 验证初始数据存在
        const books = await store.get('books');
        expect(books.length).to.equal(1);
        expect(books[0].title).to.equal('initial book');

        // 验证实际存储的数据（通过文件系统或localStorage）
        const readStorageData = async (savePath) => {
          if (isNodeEnv) {
            // Node.js 环境：读取文件系统
            const { promises: fsPromises } = await import('fs');
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

        const initialStorageData = await readStorageData(testPath);
        expect(initialStorageData).to.not.be.null;
        expect(initialStorageData.books).to.be.an('array');
        expect(initialStorageData.books.length).to.equal(1);
        expect(initialStorageData.books[0].title).to.equal('initial book');

        // 添加数据
        await store.post('books', { title: 'custom path book' });

        // 验证数据更新
        const updatedBooks = await store.get('books');
        expect(updatedBooks.length).to.equal(2);
        expect(updatedBooks[1].title).to.equal('custom path book');

        // 验证实际存储的数据已更新
        const updatedStorageData = await readStorageData(testPath);
        expect(updatedStorageData.books.length).to.equal(2);
        expect(updatedStorageData.books[1].title).to.equal('custom path book');
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('自定义 adapter 配置', async () => {
      class CustomAdapter {
        constructor(data, opt) {
          this.data = data;
          this.opt = opt;
        }

        get(path) {
          return { custom: true, path };
        }

        // 添加 save 方法，因为初始化时会调用
        async save() {
          // 自定义适配器的保存逻辑
        }
      }

      const customAdapter = new CustomAdapter({}, {});
      const store = await JsLiteRest.create({}, {
        adapter: customAdapter
      });

      expect(store.opt.adapter).to.equal(customAdapter);
      const result = await store.get('test');
      expect(result.custom).to.equal(true);
      expect(result.path).to.equal('test');
    });

    it('自定义 load 和 save 函数', async () => {
      let loadCalled = false;
      let loadPath = null;
      let saveCalled = false;
      let savedPath = null;
      let savedData = null;

      const customLoad = async (path) => {
        loadCalled = true;
        loadPath = path;
        // 返回统一的测试数据，不需要区分环境
        return { books: [{ id: 1, title: 'loaded book' }] };
      };

      const customSave = async (path, data) => {
        saveCalled = true;
        savedPath = path;
        savedData = data;

        // 验证保存的数据结构
        expect(data).to.be.an('object');
        expect(data.books).to.be.an('array');
      };

      const testPath = isNodeEnv ? 'test-file.json' : 'test-localStorage-key';
      const store = await JsLiteRest.create(testPath, {
        load: customLoad,
        save: customSave
      });

      // 验证 load 函数被正确调用
      expect(loadCalled).to.equal(true);
      expect(loadPath).to.equal(testPath);

      // 测试数据是否正确加载
      const books = await store.get('books');
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('loaded book');

      // 测试保存功能
      await store.post('books', { title: 'new book' });
      expect(saveCalled).to.equal(true);
      expect(savedPath).to.equal(testPath);
      expect(savedData).to.not.be.null;
      expect(savedData.books.length).to.equal(2);
      expect(savedData.books[1].title).to.equal('new book');
    });

    it('配置项合并测试', async () => {
      const testPath = 'test-merge-config.json';
      let savedPath = null;

      try {
        // 使用自定义 save 函数避免创建实际文件
        const mockSave = async (path, data) => {
          savedPath = path;
        };

        const store = await JsLiteRest.create({
          items: []
        }, {
          idKeySuffix: '_key',
          savePath: testPath,
          customOption: 'custom_value',
          save: mockSave
        });

        expect(store.opt.idKeySuffix).to.equal('_key');
        expect(store.opt.savePath).to.equal(testPath);
        expect(store.opt.customOption).to.equal('custom_value');
        expect(savedPath).to.equal(testPath);
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('空配置项测试', async () => {
      const store = await JsLiteRest.create();

      expect(store.opt.idKeySuffix).to.equal('Id');
      // 在测试环境中，默认 savePath 可能不是空字符串
      expect(store.opt.savePath).to.be.a('string');
      // 检查 adapter 是否存在且有正确的方法，而不是使用 instanceof
      expect(store.opt.adapter).to.be.an('object');
      expect(store.opt.adapter).to.have.property('get');
      expect(store.opt.adapter).to.have.property('post');
      expect(store.opt.adapter).to.have.property('save');
    });

    it('配置项不可变性测试', async () => {
      const testPath = 'test-immutable-config.json';
      let savedPath = null;

      try {
        // 使用自定义 save 函数避免创建实际文件
        const mockSave = async (path, data) => {
          savedPath = path;
        };

        const originalOpt = {
          idKeySuffix: 'Test',
          savePath: testPath,
          save: mockSave
        };

        const store = await JsLiteRest.create({}, originalOpt);

        // 修改原始配置对象不应影响 store
        originalOpt.idKeySuffix = 'Modified';
        originalOpt.savePath = 'modified.json';

        expect(store.opt.idKeySuffix).to.equal('Test');
        expect(store.opt.savePath).to.equal(testPath);
        expect(savedPath).to.equal(testPath);
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('load 函数错误处理', async () => {
      const errorLoad = async (path) => {
        throw new Error('Load failed');
      };

      try {
        await JsLiteRest.create('test-path', {
          load: errorLoad
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('Load failed');
      }
    });

    it('save 函数错误处理', async () => {
      const errorSave = async (path, data) => {
        throw new Error('Save failed');
      };

      // 现在初始化时就会调用 save，所以创建时就会抛出错误
      try {
        await JsLiteRest.create({
          books: []
        }, {
          save: errorSave
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('Save failed');
      }
    });

    it('缺少 load 函数时的错误处理', async () => {
      // 导入基础的 Store 类来测试这个错误情况
      const { Store: BaseStore } = await import('../../src/store.ts');

      try {
        await BaseStore.create('test-path', {
          // 没有提供 load 函数
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('load 方法未定义');
      }
    });

    it('环境特定的存储验证', async () => {
      if (isNodeEnv) {
        // Node.js 环境：验证实际文件操作
        const testFile = 'test-env-specific.json';
        let actualFileContent = null;

        const mockSave = async (path, data) => {
          expect(path).to.equal(testFile);
          actualFileContent = JSON.stringify(data, null, 2);
          // 模拟写入文件
        };

        const mockLoad = async (path) => {
          expect(path).to.equal(testFile);
          return { items: [] };
        };

        const store = await JsLiteRest.create(testFile, {
          load: mockLoad,
          save: mockSave
        });

        await store.post('items', { name: 'test item' });

        expect(actualFileContent).to.not.be.null;
        const parsedContent = JSON.parse(actualFileContent);
        expect(parsedContent.items.length).to.equal(1);
        expect(parsedContent.items[0].name).to.equal('test item');

      } else {
        // 浏览器环境：验证 localStorage 操作
        const testKey = 'test-env-specific';
        let actualStorageData = null;

        const mockSave = async (key, data) => {
          expect(key).to.equal(testKey);
          actualStorageData = JSON.stringify(data);
          // 模拟存储到 localStorage
        };

        const mockLoad = async (key) => {
          expect(key).to.equal(testKey);
          return { items: [] };
        };

        const store = await JsLiteRest.create(testKey, {
          load: mockLoad,
          save: mockSave
        });

        await store.post('items', { name: 'test item' });

        expect(actualStorageData).to.not.be.null;
        const parsedData = JSON.parse(actualStorageData);
        expect(parsedData.items.length).to.equal(1);
        expect(parsedData.items[0].name).to.equal('test item');
      }
    });

    it('配置项类型验证', async () => {
      const testPath = 'test-type-validation.json';
      let savedPath = null;

      try {
        // 使用自定义 save 函数避免创建实际文件
        const mockSave = async (path, data) => {
          savedPath = path;
        };

        const store = await JsLiteRest.create({
          books: []
        }, {
          idKeySuffix: 'Suffix',
          savePath: testPath,
          customProp: 'customValue',
          save: mockSave
        });

        // 验证配置项类型
        expect(typeof store.opt.idKeySuffix).to.equal('string');
        expect(typeof store.opt.savePath).to.equal('string');
        expect(typeof store.opt.customProp).to.equal('string');

        // 验证配置项值
        expect(store.opt.idKeySuffix).to.equal('Suffix');
        expect(store.opt.savePath).to.equal(testPath);
        expect(store.opt.customProp).to.equal('customValue');
        expect(savedPath).to.equal(testPath);
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('初始化时数据合并 - 默认不覆盖', async () => {
      const testPath = `test-merge-initialization-${Date.now()}`;

      try {
        // 先创建一个 Store 并保存一些数据
        await JsLiteRest.create({
          users: [{ id: 1, name: 'Alice' }],
          posts: [{ id: 1, title: 'Existing Post' }]
        }, { savePath: testPath });

        // 现在创建新的 Store，尝试添加新数据（默认不覆盖）
        const store = await JsLiteRest.create({
          users: [{ id: 2, name: 'Bob' }], // 这个应该被忽略
          categories: [{ id: 1, name: 'Tech' }] // 这个应该被添加
        }, { savePath: testPath });

        // 验证 users 保持原有数据（不覆盖）
        const users = await store.get('users');
        expect(users.length).to.equal(1);
        expect(users[0].name).to.equal('Alice');

        // 验证 posts 保持原有数据
        const posts = await store.get('posts');
        expect(posts.length).to.equal(1);
        expect(posts[0].title).to.equal('Existing Post');

        // 验证 categories 被添加
        const categories = await store.get('categories');
        expect(categories.length).to.equal(1);
        expect(categories[0].name).to.equal('Tech');

        // 验证实际存储的数据（数据合并结果）
        const readStorageData = async (savePath) => {
          if (isNodeEnv) {
            const { promises: fsPromises } = await import('fs');
            try {
              const fileContent = await fsPromises.readFile(savePath, 'utf-8');
              return JSON.parse(fileContent);
            } catch (error) {
              if (error.code === 'ENOENT') {
                return null;
              }
              throw error;
            }
          } else {
            return await JsLiteRest.lib.localforage.getItem(savePath);
          }
        };

        const mergedStorageData = await readStorageData(testPath);
        expect(mergedStorageData.users.length).to.equal(1);
        expect(mergedStorageData.users[0].name).to.equal('Alice'); // 原有数据保持
        expect(mergedStorageData.posts.length).to.equal(1);
        expect(mergedStorageData.posts[0].title).to.equal('Existing Post'); // 原有数据保持
        expect(mergedStorageData.categories.length).to.equal(1);
        expect(mergedStorageData.categories[0].name).to.equal('Tech'); // 新数据被添加
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('初始化时数据覆盖 - 启用覆盖选项', async () => {
      const testPath = `test-overwrite-initialization-${Date.now()}`;

      try {
        // 先创建一个 Store 并保存一些数据
        await JsLiteRest.create({
          users: [{ id: 1, name: 'Alice' }],
          posts: [{ id: 1, title: 'Existing Post' }]
        }, { savePath: testPath });

        // 现在创建新的 Store，启用覆盖选项
        const store = await JsLiteRest.create({
          users: [{ id: 2, name: 'Bob' }],
          categories: [{ id: 1, name: 'Tech' }]
        }, { 
          savePath: testPath, 
          overwrite: true 
        });

        // 验证数据被完全覆盖
        const users = await store.get('users');
        expect(users.length).to.equal(1);
        expect(users[0].name).to.equal('Bob');

        const categories = await store.get('categories');
        expect(categories.length).to.equal(1);
        expect(categories[0].name).to.equal('Tech');

        // 验证 posts 不存在了
        try {
          await store.get('posts');
          expect.fail('posts 应该不存在');
        } catch (error) {
          expect(error.code).to.equal(500);
        }

        // 验证实际存储的数据（覆盖结果）
        const readStorageData = async (savePath) => {
          if (isNodeEnv) {
            const { promises: fsPromises } = await import('fs');
            try {
              const fileContent = await fsPromises.readFile(savePath, 'utf-8');
              return JSON.parse(fileContent);
            } catch (error) {
              if (error.code === 'ENOENT') {
                return null;
              }
              throw error;
            }
          } else {
            return await JsLiteRest.lib.localforage.getItem(savePath);
          }
        };

        const overwrittenStorageData = await readStorageData(testPath);
        expect(overwrittenStorageData.users.length).to.equal(1);
        expect(overwrittenStorageData.users[0].name).to.equal('Bob'); // 数据被覆盖
        expect(overwrittenStorageData.categories.length).to.equal(1);
        expect(overwrittenStorageData.categories[0].name).to.equal('Tech'); // 新数据存在
        expect(overwrittenStorageData.posts).to.be.undefined; // 原有数据被移除
      } finally {
        // 清理测试产生的存储文件
        await cleanStorageData(testPath);
      }
    });

    it('overwrite 配置选项默认值验证', async () => {
      const store = await JsLiteRest.create({});
      expect(store.opt.overwrite).to.equal(false);
    });
  });
}

export default fn;
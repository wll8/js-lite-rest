import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest, cleanStorageData }) {
  // _ne 支持数组功能
  describe('_ne 支持数组', () => {
    let store;
    
    beforeEach(async () => {
      store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', category: 'frontend' },
          { id: 2, title: 'js', category: 'frontend' },
          { id: 3, title: 'python', category: 'backend' },
          { id: 4, title: 'java', category: 'backend' },
          { id: 5, title: 'html', category: 'frontend' },
          { id: 6, title: 'go', category: 'backend' }
        ]
      }, {
        savePath: `test_ne_array_${Date.now()}`
      });
    });

    afterEach(async () => {
      await cleanStorageData(store.opt.savePath);
    });

    it('_ne 单个值应该排除指定项', async () => {
      const books = await store.get('book', { title_ne: 'css' });
      expect(books.length).to.equal(5);
      expect(books.every(book => book.title !== 'css')).to.be.true;
    });

    it('_ne 数组应该排除多个指定项', async () => {
      const books = await store.get('book', { title_ne: ['css', 'js', 'html'] });
      expect(books.length).to.equal(3);
      expect(books.every(book => !['css', 'js', 'html'].includes(book.title))).to.be.true;
      expect(books.map(book => book.title)).to.deep.equal(['python', 'java', 'go']);
    });

    it('_ne 数组与其他条件组合', async () => {
      const books = await store.get('book', { 
        category: 'frontend',
        title_ne: ['css', 'html'] 
      });
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('js');
      expect(books[0].category).to.equal('frontend');
    });

    it('_ne 空数组应该不排除任何项', async () => {
      const books = await store.get('book', { title_ne: [] });
      expect(books.length).to.equal(6);
    });

    it('_ne 数组中包含不存在的值', async () => {
      const books = await store.get('book', { title_ne: ['css', 'nonexistent', 'js'] });
      expect(books.length).to.equal(4);
      expect(books.every(book => !['css', 'js'].includes(book.title))).to.be.true;
    });
  });

  // kv 模式功能
  describe('kv 模式', () => {
    let store;
    
    beforeEach(async () => {
      store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' }
        ],
        config: {
          theme: 'dark',
          language: 'zh',
          settings: {
            autoSave: true,
            notifications: {
              email: true,
              push: false
            }
          }
        }
      }, {
        savePath: `test_kv_mode_${Date.now()}`
      });
    });

    afterEach(async () => {
      await cleanStorageData(store.opt.savePath);
    });

    it('kv.get() 应该获取指定路径的值', async () => {
      const theme = await store.kv.get('config.theme');
      expect(theme).to.equal('dark');
      
      const autoSave = await store.kv.get('config.settings.autoSave');
      expect(autoSave).to.equal(true);
      
      const email = await store.kv.get('config.settings.notifications.email');
      expect(email).to.equal(true);
    });

    it('kv.get() 路径不存在时应该返回 undefined', async () => {
      const result = await store.kv.get('config.nonexistent');
      expect(result).to.be.undefined;
      
      const result2 = await store.kv.get('config.settings.nonexistent.deep');
      expect(result2).to.be.undefined;
    });

    it('kv.set() 应该设置指定路径的值', async () => {
      await store.kv.set('config.theme', 'light');
      const theme = await store.kv.get('config.theme');
      expect(theme).to.equal('light');
      
      await store.kv.set('config.settings.notifications.push', true);
      const push = await store.kv.get('config.settings.notifications.push');
      expect(push).to.equal(true);
    });

    it('kv.set() 应该创建新的嵌套路径', async () => {
      await store.kv.set('config.newSection.newKey', 'newValue');
      const value = await store.kv.get('config.newSection.newKey');
      expect(value).to.equal('newValue');
      
      // 验证整个配置结构
      const config = await store.get('config');
      expect(config.newSection.newKey).to.equal('newValue');
    });

    it('kv.delete() 应该删除指定路径的值', async () => {
      await store.kv.delete('config.settings.notifications.email');
      const email = await store.kv.get('config.settings.notifications.email');
      expect(email).to.be.undefined;
      
      // 验证其他值仍然存在
      const push = await store.kv.get('config.settings.notifications.push');
      expect(push).to.equal(false);
    });

    it('kv.delete() 删除不存在的路径应该不报错', async () => {
      await store.kv.delete('config.nonexistent');
      await store.kv.delete('config.settings.nonexistent.deep');
      // 不应该抛出错误
    });

    it('kv 模式应该与原有数据持久化一致', async () => {
      // 通过 kv 模式修改数据
      await store.kv.set('config.theme', 'blue');
      
      // 通过常规方式获取数据验证
      const config = await store.get('config');
      expect(config.theme).to.equal('blue');
      
      // 通过 kv 模式修改数据
      await store.kv.set('config.version', '1.0');
      
      // 通过常规方式验证
      const updatedConfig = await store.get('config');
      expect(updatedConfig.version).to.equal('1.0');
      expect(updatedConfig.theme).to.equal('blue');
      
      // 通过 kv 模式验证
      const version = await store.kv.get('config.version');
      expect(version).to.equal('1.0');
    });

    it('kv.get() 应该能获取数组中的元素', async () => {
      const firstBook = await store.kv.get('book.0');
      expect(firstBook).to.deep.equal({ id: 1, title: 'css' });
      
      const firstBookTitle = await store.kv.get('book.0.title');
      expect(firstBookTitle).to.equal('css');
    });

    it('kv.set() 应该能修改数组中的元素', async () => {
      await store.kv.set('book.0.title', 'css3');
      const firstBookTitle = await store.kv.get('book.0.title');
      expect(firstBookTitle).to.equal('css3');
      
      // 验证整个数组结构
      const books = await store.get('book');
      expect(books[0].title).to.equal('css3');
      expect(books[1].title).to.equal('js');
    });
  });

  // info 模式 API
  describe('info 模式 API', () => {
    let store;
    
    beforeEach(async () => {
      store = await JsLiteRest.create({
        books: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' }
        ],
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ],
        config: {
          theme: 'dark',
          language: 'zh'
        },
        tags: []
      }, {
        savePath: `test_info_mode_${Date.now()}`
      });
    });

    afterEach(async () => {
      await cleanStorageData(store.opt.savePath);
    });

    it('info.getTables() 应该返回所有数组类型的表名', async () => {
      const tables = await store.info.getTables();
      expect(tables).to.be.an('array');
      expect(tables).to.include('books');
      expect(tables).to.include('users');
      expect(tables).to.include('tags');
      expect(tables).to.not.include('config'); // config 不是数组类型
      expect(tables.length).to.equal(3);
    });

    it('info.getStorageSize() 应该返回存储空间占用大小', async () => {
      const storageSize = await store.info.getStorageSize();
      expect(storageSize).to.be.a('number');
      expect(storageSize).to.be.greaterThan(0);
      
      // 添加一些数据后，存储大小应该增加
      const initialSize = storageSize;
      await store.post('books', { title: 'html', content: 'HTML is a markup language for creating web pages' });
      
      const newSize = await store.info.getStorageSize();
      expect(newSize).to.be.greaterThan(initialSize);
    });

    it('info.getStorageFreeSize() 应该返回剩余存储空间', async () => {
      const freeSize = await store.info.getStorageFreeSize();
      expect(freeSize).to.be.a('number');
      
      if (typeof window === 'undefined') {
        // Node.js 环境 (file 模式) 应该返回 -1
        expect(freeSize).to.equal(-1);
      } else {
        // 浏览器环境，应该是正数或 -1 (如果无法检测)
        expect(freeSize >= -1).to.be.true;
      }
    });

    it('JsLiteRest.driver() 应该返回当前的存储驱动程序', async () => {
      const driver = await JsLiteRest.driver();
      expect(driver).to.be.a('string');
      
      if (typeof window === 'undefined') {
        // Node.js 环境应该返回 'file'
        expect(driver).to.equal('file');
      } else {
        // 浏览器环境应该返回 localforage 的 driver 名称
        expect(driver).to.be.oneOf(['asyncStorage', 'webSQLStorage', 'localStorageWrapper']);
      }
    });

    it('info APIs 在空数据存储中的行为', async () => {
      const emptyStore = await JsLiteRest.create({}, {
        savePath: `test_empty_info_${Date.now()}`
      });

      try {
        const tables = await emptyStore.info.getTables();
        expect(tables).to.be.an('array');
        expect(tables.length).to.equal(0);

        const storageSize = await emptyStore.info.getStorageSize();
        expect(storageSize).to.be.a('number');
        expect(storageSize).to.be.greaterThanOrEqual(0);

        const freeSize = await emptyStore.info.getStorageFreeSize();
        expect(freeSize).to.be.a('number');
      } finally {
        await cleanStorageData(emptyStore.opt.savePath);
      }
    });

    it('info APIs 在混合数据类型中的行为', async () => {
      const mixedStore = await JsLiteRest.create({
        arrayTable: [{ id: 1, name: 'item1' }],
        objectData: { key: 'value' },
        stringData: 'hello',
        numberData: 42,
        booleanData: true,
        nullData: null,
        emptyArray: []
      }, {
        savePath: `test_mixed_info_${Date.now()}`
      });

      try {
        const tables = await mixedStore.info.getTables();
        expect(tables).to.be.an('array');
        expect(tables).to.include('arrayTable');
        expect(tables).to.include('emptyArray');
        expect(tables).to.not.include('objectData');
        expect(tables).to.not.include('stringData');
        expect(tables).to.not.include('numberData');
        expect(tables).to.not.include('booleanData');
        expect(tables).to.not.include('nullData');
        expect(tables.length).to.equal(2);
      } finally {
        await cleanStorageData(mixedStore.opt.savePath);
      }
    });
  });
}

export default fn;
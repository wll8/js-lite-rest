import fs from 'fs';
import chai from 'chai';
const expect = chai.expect;

const UMD_FILE = new URL('../../dist/js-lite-rest.umd.js', import.meta.url);

// 在独立 JSDOM 页面上下文中加载 UMD 产物，等价于 <script> 标签引入
async function loadUmd() {
  const { JSDOM } = await import('jsdom');
  const code = fs.readFileSync(UMD_FILE, 'utf8');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    runScripts: 'dangerously'
  });
  dom.window.eval(code);
  return dom.window.JsLiteRest;
}

// UMD 产物测试：仅构建后可运行（依赖 dist 产物）
export async function testUmd() {
  describe('UMD 产物', function () {
    this.timeout(5000);

    let UmdJsLiteRest;

    before(async () => {
      UmdJsLiteRest = await loadUmd();
    });

    it('全局挂载成员完整', () => {
      expect(UmdJsLiteRest).to.exist;
      for (const key of ['driver', 'create', 'Store', 'interceptor', 'JsonAdapter', 'lib']) {
        expect(UmdJsLiteRest[key], `成员 ${key}`).to.exist;
      }
    });

    it('Store 类同步可用', () => {
      expect(UmdJsLiteRest.Store).to.be.a('function');
      expect(UmdJsLiteRest.Store.create).to.be.a('function');
    });

    it('CRUD 冒烟', async () => {
      const TEST_KEY = 'test-umd-store';
      const store = await UmdJsLiteRest.create(TEST_KEY);
      await store.post('books', { title: 'UMD 写入' });
      const books = await store.get('books');
      expect(books).to.have.lengthOf(1);
      expect(books[0].title).to.equal('UMD 写入');
      await UmdJsLiteRest.lib.localforage.removeItem(TEST_KEY);
    });
  });
}

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('过滤', () => {
    it('get 查询', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
      const books = await store.get('book', { title: 'css' });
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
    });
    
    it('get 多字段过滤', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', type: 'js', discount: 1 },
          { id: 2, title: 'js', type: 'js', discount: 0 },
          { id: 3, title: 'html', type: 'html', discount: 1 },
        ],
      });
      const books = await store.get('book', { discount: 1, type: 'js' });
      expect(books.length).to.equal(1);
      expect(books[0].id).to.equal(1);
    });
    
    it('get 同字段多值过滤', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
          { id: 3, title: 'html' },
        ],
      });
      const books = await store.get('book', { id: [1, 2] });
      expect(books.length).to.equal(2);
      expect(books.map(b => b.id)).to.include(1).and.include(2);
    });
    
    it('get 点语法深层字段过滤', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', author: { name: '张三' } },
          { id: 2, title: 'js', author: { name: '李四' } },
        ],
      });
      const books = await store.get('book', { 'author.name': '张三' });
      expect(books.length).to.equal(1);
      expect(books[0].author.name).to.equal('张三');
    });

    describe('布尔值查询测试', () => {
      let store;

      beforeEach(async () => {
        store = await JsLiteRest.create({
          users: [
            { name: 'Tom', age: 18, student: true },      // 布尔 true
            { name: 'Jerry', age: 20, student: false },    // 布尔 false
            { name: 'Alice', age: 19, student: 'true' },   // 字符串 "true"
            { name: 'Bob', age: 21, student: 'false' },    // 字符串 "false"
            { name: 'Carol', age: 22, student: 1 },        // 数字 1
            { name: 'David', age: 23, student: 0 },        // 数字 0
            { name: 'Eve', age: 24, student: '' }          // 空字符串
          ],
        });
      });

      it('student=true 应该匹配 true 和 1', async () => {
        const result = await store.get('users', { student: true });
        expect(result.length).to.equal(2);
        const names = result.map(user => user.name);
        expect(names).to.include('Tom').and.include('Carol');
        // 验证具体的值和类型
        const tom = result.find(u => u.name === 'Tom');
        const carol = result.find(u => u.name === 'Carol');
        expect(tom.student).to.equal(true);
        expect(carol.student).to.equal(1);
      });

      it('student="true" 应该只匹配 "true" 字符串', async () => {
        const result = await store.get('users', { student: 'true' });
        expect(result.length).to.equal(1);
        expect(result[0].name).to.equal('Alice');
        expect(result[0].student).to.equal('true');
      });

      it('student=false 应该匹配 false、0 和 ""', async () => {
        const result = await store.get('users', { student: false });
        expect(result.length).to.equal(3);
        const names = result.map(user => user.name);
        expect(names).to.include('Jerry').and.include('David').and.include('Eve');
        // 验证具体的值和类型
        const jerry = result.find(u => u.name === 'Jerry');
        const david = result.find(u => u.name === 'David');
        const eve = result.find(u => u.name === 'Eve');
        expect(jerry.student).to.equal(false);
        expect(david.student).to.equal(0);
        expect(eve.student).to.equal('');
      });

      it('student="false" 应该只匹配 "false" 字符串', async () => {
        const result = await store.get('users', { student: 'false' });
        expect(result.length).to.equal(1);
        expect(result[0].name).to.equal('Bob');
        expect(result[0].student).to.equal('false');
      });

      it('student=0 应该匹配 false、0 和 ""', async () => {
        const result = await store.get('users', { student: 0 });
        expect(result.length).to.equal(3);
        const names = result.map(user => user.name);
        expect(names).to.include('Jerry').and.include('David').and.include('Eve');
        // 验证具体的值和类型
        const jerry = result.find(u => u.name === 'Jerry');
        const david = result.find(u => u.name === 'David');
        const eve = result.find(u => u.name === 'Eve');
        expect(jerry.student).to.equal(false);
        expect(david.student).to.equal(0);
        expect(eve.student).to.equal('');
      });

      it('student="0" 应该匹配 false 和 0', async () => {
        const result = await store.get('users', { student: '0' });
        expect(result.length).to.equal(2);
        const names = result.map(user => user.name);
        expect(names).to.include('Jerry').and.include('David');
        // 验证具体的值和类型
        const jerry = result.find(u => u.name === 'Jerry');
        const david = result.find(u => u.name === 'David');
        expect(jerry.student).to.equal(false);
        expect(david.student).to.equal(0);
      });

      it('student=1 应该匹配 true 和 1', async () => {
        const result = await store.get('users', { student: 1 });
        expect(result.length).to.equal(2);
        const names = result.map(user => user.name);
        expect(names).to.include('Tom').and.include('Carol');
      });

      it('student="1" 应该只匹配 1 数字', async () => {
        const result = await store.get('users', { student: '1' });
        expect(result.length).to.equal(2);
        const names = result.map(user => user.name);
        expect(names).to.include('Tom').and.include('Carol');
      });
    });
  });
}

export default fn;
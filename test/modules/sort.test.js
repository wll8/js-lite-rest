import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('排序', () => {
    it('get 单字段排序', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', view: 100 },
          { id: 2, title: 'js', view: 200 },
          { id: 3, title: 'html', view: 50 },
        ],
      });
      const ascResult = await store.get('book', { _sort: 'view', _order: 'asc' });
      expect(ascResult[0].view).to.equal(50);
      expect(ascResult[1].view).to.equal(100);
      expect(ascResult[2].view).to.equal(200);
      const descResult = await store.get('book', { _sort: 'view', _order: 'desc' });
      expect(descResult[0].view).to.equal(200);
      expect(descResult[1].view).to.equal(100);
      expect(descResult[2].view).to.equal(50);
    });
    
    it('get 多字段排序', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', user: 'A', view: 100 },
          { id: 2, title: 'js', user: 'A', view: 200 },
          { id: 3, title: 'html', user: 'B', view: 50 },
          { id: 4, title: 'vue', user: 'B', view: 150 },
        ],
      });
      const result = await store.get('book', { _sort: 'user,view', _order: 'desc,asc' });
      expect(result[0].user).to.equal('B');
      expect(result[0].view).to.equal(50);
      expect(result[1].user).to.equal('B');
      expect(result[1].view).to.equal(150);
      expect(result[2].user).to.equal('A');
      expect(result[2].view).to.equal(100);
      expect(result[3].user).to.equal('A');
      expect(result[3].view).to.equal(200);
    });
    
    it('get 排序与过滤结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', type: 'programming', view: 100 },
          { id: 2, title: 'css', type: 'design', view: 200 },
          { id: 3, title: 'html', type: 'design', view: 50 },
          { id: 4, title: 'python', type: 'programming', view: 150 },
        ],
      });
      const result = await store.get('book', { type: 'design', _sort: 'view', _order: 'asc' });
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(50);
      expect(result[1].view).to.equal(200);
    });
    
    it('get 排序与分页结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1', view: 100 },
          { id: 2, title: 'book2', view: 200 },
          { id: 3, title: 'book3', view: 50 },
          { id: 4, title: 'book4', view: 150 },
          { id: 5, title: 'book5', view: 300 },
        ],
      });
      const result = await store.get('book', { _sort: 'view', _order: 'desc', _page: 1, _limit: 2 });
      expect(result.count).to.equal(5);
      expect(result.list.length).to.equal(2);
      expect(result.list[0].view).to.equal(300);
      expect(result.list[1].view).to.equal(200);
    });
    
    it('get 深层字段排序', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css', author: { name: '张三', age: 30 } },
          { id: 2, title: 'js', author: { name: '李四', age: 25 } },
          { id: 3, title: 'html', author: { name: '王五', age: 35 } },
        ],
      });
      const result = await store.get('book', { _sort: 'author.age', _order: 'asc' });
      expect(result[0].author.age).to.equal(25);
      expect(result[1].author.age).to.equal(30);
      expect(result[2].author.age).to.equal(35);
    });

    it('get 多字段排序 - 数组形式', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', user: 'A', view: 200 },
          { id: 2, title: 'css', user: 'A', view: 100 },
          { id: 3, title: 'html', user: 'B', view: 50 },
          { id: 4, title: 'vue', user: 'B', view: 150 },
        ],
      });
      // 使用数组形式的排序参数
      const result = await store.get('book', { _sort: ['user', 'view'], _order: ['desc', 'asc'] });
      expect(result[0].user).to.equal('B');
      expect(result[0].view).to.equal(50);
      expect(result[1].user).to.equal('B');
      expect(result[1].view).to.equal(150);
      expect(result[2].user).to.equal('A');
      expect(result[2].view).to.equal(100);
      expect(result[3].user).to.equal('A');
      expect(result[3].view).to.equal(200);
    });

    it('get 单字段排序 - 数组形式', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', view: 200 },
          { id: 2, title: 'css', view: 100 },
          { id: 3, title: 'html', view: 300 },
        ],
      });
      // 单字段也可以使用数组形式
      const result = await store.get('book', { _sort: ['view'], _order: ['desc'] });
      expect(result[0].view).to.equal(300);
      expect(result[1].view).to.equal(200);
      expect(result[2].view).to.equal(100);
    });

    it('get 混合排序形式', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', user: 'A', view: 200 },
          { id: 2, title: 'css', user: 'A', view: 100 },
          { id: 3, title: 'html', user: 'B', view: 50 },
          { id: 4, title: 'vue', user: 'B', view: 150 },
        ],
      });
      // 数组形式的 _sort 和字符串形式的 _order
      const result1 = await store.get('book', { _sort: ['user', 'view'], _order: 'desc,asc' });
      expect(result1[0].user).to.equal('B');
      expect(result1[0].view).to.equal(50);
      
      // 字符串形式的 _sort 和数组形式的 _order
      const result2 = await store.get('book', { _sort: 'user,view', _order: ['desc', 'asc'] });
      expect(result2[0].user).to.equal('B');
      expect(result2[0].view).to.equal(50);
      
      // 验证两种形式返回相同结果
      expect(result1).to.deep.equal(result2);
    });
  });
}

export default fn;
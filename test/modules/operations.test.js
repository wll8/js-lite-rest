import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('运算', () => {
    it('get 范围查询 - gte和lte', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1', view: 2000 },
          { id: 2, title: 'book2', view: 4000 },
          { id: 3, title: 'book3', view: 6000 },
          { id: 4, title: 'book4', view: 8000 },
        ],
      });
      const result = await store.get('book', { view_gte: 3000, view_lte: 7000 });
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(4000);
      expect(result[1].view).to.equal(6000);
    });
    
    it('get 排除查询 - ne', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
        ],
      });
      const result = await store.get('book', { id_ne: 1 });
      expect(result.length).to.equal(2);
      expect(result[0].id).to.equal(2);
      expect(result[1].id).to.equal(3);
      const result2 = await store.get('book', { id_ne: [1, 2] });
      expect(result2.length).to.equal(1);
      expect(result2[0].id).to.equal(3);
    });
    
    it('get 模糊查询 - like单模式', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'javascript', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'markup' },
          { id: 4, title: 'python', type: 'programming' },
        ],
      });
      const result = await store.get('book', { type_like: 'prog|design' });
      expect(result.length).to.equal(3);
      expect(result[0].title).to.equal('javascript');
      expect(result[1].title).to.equal('css');
      expect(result[2].title).to.equal('python');
    });
    
    it('get 模糊查询 - like多模式', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'javascript', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'markup' },
          { id: 4, title: 'python', type: 'programming' },
        ],
      });
      const result = await store.get('book', { title_like: 'script' });
      expect(result.length).to.equal(1);
      expect(result[0].title).to.equal('javascript');
    });
    
    it('get 运算查询与过滤结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', type: 'programming', view: 1000 },
          { id: 2, title: 'css', type: 'design', view: 2000 },
          { id: 3, title: 'html', type: 'markup', view: 3000 },
          { id: 4, title: 'python', type: 'programming', view: 4000 },
        ],
      });
      const result = await store.get('book', { type_like: 'prog', view_gte: 2000, id_ne: 4 });
      expect(result.length).to.equal(0);
      const result2 = await store.get('book', { type_like: 'prog', view_gte: 1000, id_ne: 1 });
      expect(result2.length).to.equal(1);
      expect(result2[0].id).to.equal(4);
    });
    
    it('get 运算查询与排序结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1', view: 1000 },
          { id: 2, title: 'book2', view: 3000 },
          { id: 3, title: 'book3', view: 2000 },
          { id: 4, title: 'book4', view: 4000 },
        ],
      });
      const result = await store.get('book', { view_gte: 1500, view_lte: 3500, _sort: 'view', _order: 'desc' });
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(3000);
      expect(result[1].view).to.equal(2000);
    });
    
    it('get 深层字段运算查询', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1', author: { name: '张三', age: 25 } },
          { id: 2, title: 'book2', author: { name: '李四', age: 30 } },
          { id: 3, title: 'book3', author: { name: '王五', age: 35 } },
        ],
      });
      const result = await store.get('book', { 'author.age_gte': 30, 'author.name_like': '李|王' });
      expect(result.length).to.equal(2);
      expect(result[0].author.name).to.equal('李四');
      expect(result[1].author.name).to.equal('王五');
    });
  });
}

export default fn;
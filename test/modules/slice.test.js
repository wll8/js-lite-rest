import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('截取', () => {
    it('get 截取功能 - start到end', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
          { id: 4, title: 'book4' },
          { id: 5, title: 'book5' },
          { id: 6, title: 'book6' },
        ],
      });
      const result = await store.get('book', { _start: 2, _end: 5 });
      expect(result.length).to.equal(3);
      expect(result[0].id).to.equal(3);
      expect(result[1].id).to.equal(4);
      expect(result[2].id).to.equal(5);
    });
    
    it('get 截取功能 - start加limit', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
          { id: 4, title: 'book4' },
          { id: 5, title: 'book5' },
          { id: 6, title: 'book6' },
        ],
      });
      const result = await store.get('book', { _start: 20, _limit: 10 });
      expect(result.length).to.equal(0);
      const result2 = await store.get('book', { _start: 2, _limit: 3 });
      expect(result2.length).to.equal(3);
      expect(result2[0].id).to.equal(3);
      expect(result2[1].id).to.equal(4);
      expect(result2[2].id).to.equal(5);
    });
    
    it('get 截取与过滤结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'design' },
          { id: 4, title: 'python', type: 'programming' },
          { id: 5, title: 'java', type: 'programming' },
        ],
      });
      const result = await store.get('book', { type: 'programming', _start: 1, _end: 3 });
      expect(result.length).to.equal(2);
      expect(result[0].title).to.equal('python');
      expect(result[1].title).to.equal('java');
    });
    
    it('get 截取与排序结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1', view: 100 },
          { id: 2, title: 'book2', view: 200 },
          { id: 3, title: 'book3', view: 50 },
          { id: 4, title: 'book4', view: 150 },
          { id: 5, title: 'book5', view: 300 },
        ],
      });
      const result = await store.get('book', { _sort: 'view', _order: 'desc', _start: 1, _end: 4 });
      expect(result.length).to.equal(3);
      expect(result[0].view).to.equal(200);
      expect(result[1].view).to.equal(150);
      expect(result[2].view).to.equal(100);
    });
    
    it('get 截取边界情况', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
        ],
      });
      const result1 = await store.get('book', { _start: 10, _end: 15 });
      expect(result1.length).to.equal(0);
      const result2 = await store.get('book', { _start: 1, _end: 10 });
      expect(result2.length).to.equal(2);
      expect(result2[0].id).to.equal(2);
      expect(result2[1].id).to.equal(3);
      const result3 = await store.get('book', { _start: -1, _end: 2 });
      expect(result3.length).to.equal(2);
      expect(result3[0].id).to.equal(1);
      expect(result3[1].id).to.equal(2);
    });
  });
}

export default fn;
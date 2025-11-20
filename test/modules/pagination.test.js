import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('分页', () => {
    it('get 分页功能', async () => {
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
      const page1 = await store.get('book', { _page: 1 });
      expect(page1.count).to.equal(6);
      expect(page1.list.length).to.equal(6);
      expect(page1.list[0].id).to.equal(1);
      
      const page1Limit2 = await store.get('book', { _page: 1, _limit: 2 });
      expect(page1Limit2.count).to.equal(6);
      expect(page1Limit2.list.length).to.equal(2);
      expect(page1Limit2.list[0].id).to.equal(1);
      expect(page1Limit2.list[1].id).to.equal(2);
      
      const page2Limit2 = await store.get('book', { _page: 2, _limit: 2 });
      expect(page2Limit2.count).to.equal(6);
      expect(page2Limit2.list.length).to.equal(2);
      expect(page2Limit2.list[0].id).to.equal(3);
      expect(page2Limit2.list[1].id).to.equal(4);
      
      const page3Limit2 = await store.get('book', { _page: 3, _limit: 2 });
      expect(page3Limit2.count).to.equal(6);
      expect(page3Limit2.list.length).to.equal(2);
      expect(page3Limit2.list[0].id).to.equal(5);
      expect(page3Limit2.list[1].id).to.equal(6);
      
      const page4Limit2 = await store.get('book', { _page: 4, _limit: 2 });
      expect(page4Limit2.count).to.equal(6);
      expect(page4Limit2.list.length).to.equal(0);
    });
    
    it('get 分页与过滤结合', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'design' },
          { id: 4, title: 'python', type: 'programming' },
          { id: 5, title: 'java', type: 'programming' },
        ],
      });
      const result = await store.get('book', { type: 'programming', _page: 1, _limit: 2 });
      expect(result.count).to.equal(3);
      expect(result.list.length).to.equal(2);
      expect(result.list[0].title).to.equal('js');
      expect(result.list[1].title).to.equal('python');
    });
  });
}

export default fn;
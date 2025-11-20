import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('全文检索', () => {
    it('get 全文检索 _q参数', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', author: { name: '张三' }, desc: '编程' },
          { id: 2, title: 'css', author: { name: '李四' }, desc: '设计' },
          { id: 3, title: 'html', author: { name: '王五' }, desc: '标记语言' },
        ],
      });
      const result1 = await store.get('book', { _q: '张三' });
      expect(result1.length).to.equal(1);
      expect(result1[0].author.name).to.equal('张三');
      const result2 = await store.get('book', { _q: '设计' });
      expect(result2.length).to.equal(1);
      expect(result2[0].desc).to.equal('设计');
      const result3 = await store.get('book', { _q: '不存在' });
      expect(result3.length).to.equal(0);
      const result4 = await store.get('book', { _q: '王五' });
      expect(result4.length).to.equal(1);
      expect(result4[0].author.name).to.equal('王五');
      const result5 = await store.get('book', { _q: 'HTML' });
      expect(result5.length).to.equal(1);
      expect(result5[0].title).to.equal('html');
    });
    
    it('get 全文检索 _q参数 - 命中多条', async () => {
      const store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'js', author: { name: '张三' }, desc: '编程' },
          { id: 2, title: 'css', author: { name: '李四' }, desc: '设计' },
          { id: 3, title: 'html', author: { name: '王五' }, desc: '标记语言' },
          { id: 4, title: 'js高级', author: { name: '赵六' }, desc: '进阶' },
        ],
      });
      const result = await store.get('book', { _q: 'js' });
      expect(result.length).to.equal(2);
      expect(result.map(b => b.id)).to.include(1).and.include(4);
    });
  });
}

export default fn;
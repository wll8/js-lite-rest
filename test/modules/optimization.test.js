import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest, cleanStorageData }) {
  describe('优化数据获取', () => {
    let store;
    
    beforeEach(async () => {
      store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
          { id: 3, title: 'html' }
        ],
        user: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      }, {
        savePath: `test_get_optimization_${Date.now()}`
      });
    });

    afterEach(async () => {
      await cleanStorageData(store.opt.savePath);
    });

    it('get() 应该返回所有数据', async () => {
      const allData = await store.get();
      expect(allData).to.be.an('object');
      expect(allData.book).to.be.an('array');
      expect(allData.book.length).to.equal(3);
      expect(allData.user).to.be.an('array');
      expect(allData.user.length).to.equal(2);
      expect(allData.book[0]).to.deep.equal({ id: 1, title: 'css' });
      expect(allData.user[0]).to.deep.equal({ id: 1, name: 'Alice' });
    });

    it('get("") 应该返回所有数据', async () => {
      const allData = await store.get('');
      expect(allData).to.be.an('object');
      expect(allData.book).to.be.an('array');
      expect(allData.book.length).to.equal(3);
      expect(allData.user).to.be.an('array');
      expect(allData.user.length).to.equal(2);
    });

    it('get() 和 get("") 和 get("/") 应该返回相同的数据', async () => {
      const data1 = await store.get();
      const data2 = await store.get('');
      const data3 = await store.get('/');
      expect(data1).to.deep.equal(data2);
      expect(data1).to.deep.equal(data3);
    });
  });
}

export default fn;
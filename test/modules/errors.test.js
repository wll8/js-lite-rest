import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('类 http 响应错误格式', () => {
    let store;
    beforeEach(async () => {
      store = await JsLiteRest.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
    });

    it('get 不存在资源的错误响应格式', async () => {
      const err = await store.get('book/999').catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('delete 不存在资源的错误响应格式', async () => {
      const err = await store.delete('book/999').catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('put 不存在资源的错误响应格式', async () => {
      const err = await store.put('book/999', { title: 'updated' }).catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('patch 不存在资源的错误响应格式', async () => {
      const err = await store.patch('book/999', { title: 'patched' }).catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('get 不存在的表的错误响应格式', async () => {
      const err = await store.get('nonexistent').catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('中间件抛出错误的响应格式', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'get' && args[1] === 'book/error') {
          throw new Error('中间件模拟错误');
        }
        return await next(args);
      });

      const err = await store.get('book/error').catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.message).to.include('中间件模拟错误');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('不支持的 HTTP 方法错误响应格式', async () => {
      const err = await store._request('unsupported', 'book').catch(err => err);
      
      expect(err.code).to.be.a('number');
      expect(err.success).to.equal(false);
      expect(err.data).to.equal(null);
      expect(typeof err.message).to.equal('string');
      expect(err.message).to.include('不支持的 HTTP 方法');
      expect(err.code < 200 || err.code >= 300).to.equal(true);
    });

    it('批量操作部分失败的响应格式', async () => {
      const err = await store.post('book', [
        { title: 'valid book' },
        { id: 1, title: 'invalid book with id' },
        { title: 'another valid book' }
      ]).catch(err => err);
      
      expect(err.code).to.equal(303);
      expect(err.success).to.equal(false);
      expect(Array.isArray(err.data)).to.equal(true);
      expect(Array.isArray(err.message)).to.equal(true);
      expect(err.message[0]).to.equal(null); 
      expect(typeof err.message[1]).to.equal('string'); 
      expect(err.message[2]).to.equal(null); 
    });

    it('验证错误响应中 success 字段与状态码的一致性', async () => {
      const err = await store.get('book/999').catch(err => err);
      
      const codeFirstDigit = Math.floor(err.code / 100);
      expect(codeFirstDigit).to.not.equal(2);
      expect(err.success).to.equal(false);
    });

    it('单条操作错误时 message 为字符串', async () => {
      const err = await store.delete('book/999').catch(err => err);
      
      expect(typeof err.message).to.equal('string');
      expect(err.message.length).to.be.greaterThan(0);
    });
  });
}

export default fn;
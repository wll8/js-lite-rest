import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('批量操作', () => {
    it('delete /posts?id=1&id=2 批量删除', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'a' },
          { id: 2, title: 'b' },
          { id: 3, title: 'c' },
        ],
      });
      const result = await store.delete('posts', { id: [1, 2] });
      expect(result.length).to.equal(2);
      expect(result[0].id).to.equal(1);
      expect(result[1].id).to.equal(2);
      const left = await store.get('posts');
      expect(left.length).to.equal(1);
      expect(left[0].id).to.equal(3);
    });
    
    it('post /posts 批量创建', async () => {
      const store = await JsLiteRest.create({ posts: [] });
      const arr = [
        { title: 'a' },
        { title: 'b' },
        { id: 99, title: 'should fail' },
        ...[...new Array(1000)].map((item, index) => ({index})),
      ];
      const err = await store.post('posts', arr).catch(err => err)
      expect(err.code).to.equal(303);
      expect(err.success).to.equal(false);
      expect(Array.isArray(err.data)).to.equal(true);
      expect(err.data.length).to.equal(arr.length);
      expect(typeof err.data[0].id).to.equal('string');
      expect(typeof err.data[1].id).to.equal('string');
      expect(err.data[2]).to.equal(null);
      expect(Array.isArray(err.message)).to.equal(true);
      expect(err.message[0]).to.equal(null);
      expect(err.message[1]).to.equal(null);
      expect(err.message[2]).to.include('不能指定 id');
      const all = await store.get('posts');
      expect(all.length).to.equal(arr.length - 1);
    });
    
    it('put /posts 批量全量修改', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'a', view: 1 },
          { id: 2, title: 'b', view: 2 },
        ],
      });
      const arr = [
        { id: 1, title: 'A', view: 10 },
        { id: 2, title: 'B', view: 20 },
        { title: 'fail' },
      ];
      const err = await store.put('posts', arr).catch(err => err);
      expect(err.code).to.equal(303);
      expect(err.success).to.equal(false);
      expect(Array.isArray(err.data)).to.equal(true);
      expect(err.data.length).to.equal(3);
      expect(err.data[0].title).to.equal('A');
      expect(err.data[1].view).to.equal(20);
      expect(err.data[2]).to.equal(null);
      expect(Array.isArray(err.message)).to.equal(true);
      expect(err.message[0]).to.equal(null);
      expect(err.message[1]).to.equal(null);
      expect(err.message[2]).to.include('缺少 id');
      const all = await store.get('posts');
      expect(all[0].title).to.equal('A');
      expect(all[1].title).to.equal('B');
    });
    
    it('patch /posts 批量部分修改', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'a', view: 1 },
          { id: 2, title: 'b', view: 2 },
        ],
      });
      const arr = [
        { id: 1, view: 100 },
        { id: 2, title: 'B' },
        { title: 'fail' },
      ];
      const err = await store.patch('posts', arr).catch(err => err);
      expect(err.code).to.equal(303);
      expect(err.success).to.equal(false);
      expect(Array.isArray(err.data)).to.equal(true);
      expect(err.data.length).to.equal(3);
      expect(err.data[0].view).to.equal(100);
      expect(err.data[1].title).to.equal('B');
      expect(err.data[2]).to.equal(null);
      expect(Array.isArray(err.message)).to.equal(true);
      expect(err.message[0]).to.equal(null);
      expect(err.message[1]).to.equal(null);
      expect(err.message[2]).to.include('缺少 id');
      const all = await store.get('posts');
      expect(all[0].view).to.equal(100);
      expect(all[1].title).to.equal('B');
    });
  });
}

export default fn;
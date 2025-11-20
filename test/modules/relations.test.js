import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest, cleanStorageData }) {
  describe('关系', () => {
    it('get 在父列表中嵌入子列表', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
          { id: 2, title: 'post2' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
          { id: 2, postsId: 1, content: 'c2' },
          { id: 3, postsId: 2, content: 'c3' },
        ],
      });
      const result = await store.get('posts', { _embed: 'comments' });
      expect(result.length).to.equal(2);
      expect(result[0].comments.length).to.equal(2);
      expect(result[1].comments.length).to.equal(1);
      expect(result[0].comments[0].content).to.equal('c1');
      expect(result[1].comments[0].content).to.equal('c3');
    });
    
    it('get 在父详情中嵌入子列表', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
          { id: 2, postsId: 1, content: 'c2' },
        ],
      });
      const result = await store.get('posts/1', { _embed: 'comments' });
      expect(result.comments.length).to.equal(2);
      expect(result.comments[0].content).to.equal('c1');
    });
    
    it('get 在子列表中扩展父详情', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
          { id: 2, title: 'post2' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
          { id: 2, postsId: 2, content: 'c2' },
        ],
      });
      const result = await store.get('comments', { _expand: 'posts' });
      expect(result.length).to.equal(2);
      expect(result[0].posts.title).to.equal('post1');
      expect(result[1].posts.title).to.equal('post2');
    });
    
    it('get 在子详情中扩展父详情', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
        ],
      });
      const result = await store.get('comments/1', { _expand: 'posts' });
      expect(result.posts.title).to.equal('post1');
    });
  });

  describe('避免 _expand 和 _embed 查询时数据污染', () => {
    let store;
    const testPath = `test_expand_embed_fix_${Date.now()}.json`;

    beforeEach(async () => {
      store = await JsLiteRest.create({
        posts: [{ id: 1, title: 'post1' }, { id: 2, title: 'post2' }],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
          { id: 2, postsId: 1, content: 'c2' },
          { id: 3, postsId: 2, content: 'c3' },
        ],
        courseSubject: [{ id: '6ZA2NLP', courseId: '6TGPYCK', subjectId: '6ZA0CCA' }],
        subject: [{ id: '6ZA0CCA', name: '数学' }]
      }, { savePath: testPath });
    });

    afterEach(async () => {
      await cleanStorageData(testPath);
    });

    it('_expand 不应该污染原始数据', async () => {
      // 使用 _expand 查询
      await store.get('courseSubject', { courseId: '6TGPYCK', _expand: 'subject' });
      
      // 验证原始数据没有被污染
      const result = await store.get('courseSubject', { courseId: '6TGPYCK' });
      expect(result[0]).to.not.have.property('subject');
    });

    it('_embed 不应该污染原始数据', async () => {
      // 使用 _embed 查询
      await store.get('posts', { _embed: 'comments' });
      
      // 验证原始数据没有被污染
      const result = await store.get('posts');
      expect(result[0]).to.not.have.property('comments');
      expect(result[1]).to.not.have.property('comments');
    });

    it('_expand 和 _embed 同时使用也不应该污染原始数据', async () => {
      // 同时使用两种查询
      await store.get('posts', { _embed: 'comments' });
      await store.get('courseSubject', { courseId: '6TGPYCK', _expand: 'subject' });
      
      // 验证数据干净
      const posts = await store.get('posts');
      const courseSubject = await store.get('courseSubject', { courseId: '6TGPYCK' });
      
      expect(posts.every(post => !post.comments)).to.be.true;
      expect(courseSubject[0]).to.not.have.property('subject');
    });

    it('多次查询验证数据一致性', async () => {
      // 多次使用关系查询
      for (let i = 0; i < 3; i++) {
        await store.get('posts', { _embed: 'comments' });
        await store.get('courseSubject', { courseId: '6TGPYCK', _expand: 'subject' });
      }
      
      // 验证数据仍然干净
      const posts = await store.get('posts');
      const courseSubject = await store.get('courseSubject', { courseId: '6TGPYCK' });
      
      expect(posts.every(post => !post.comments)).to.be.true;
      expect(courseSubject[0]).to.not.have.property('subject');
    });
  });
}

export default fn;
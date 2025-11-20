import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest }) {
  describe('嵌套', () => {
    it('get posts/1/comments 嵌套资源', async () => {
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
      const result = await store.get('posts/1/comments');
      expect(result.length).to.equal(2);
      expect(result[0].content).to.equal('c1');
      expect(result[1].content).to.equal('c2');
    });
    
    it('get posts/1/comments 不应使用单复数转换的 id key', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
          { id: 2, title: 'post2' },
        ],
        comments: [
          { id: 1, postId: 1, content: 'c1' },
          { id: 2, postId: 1, content: 'c2' },
          { id: 3, postId: 2, content: 'c3' },
        ],
      });
      const result = await store.get('posts/1/comments');
      expect(result.length).to.equal(0);
    });
    
    it('post posts/1/comments 嵌套资源', async () => {
      const store = await JsLiteRest.create({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
        ],
      });
      const newComment = { content: 'c2' };
      const result = await store.post('posts/1/comments', newComment);
      expect(typeof result.id).to.equal('string');
      expect(result.postsId).to.equal(1);
      expect(result.content).to.equal('c2');
      const comments = await store.get('posts/1/comments');
      expect(comments.length).to.equal(2);
      expect(comments[1].content).to.equal('c2');
    });
  });
}

export default fn;
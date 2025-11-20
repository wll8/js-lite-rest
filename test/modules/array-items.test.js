import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

function fn({ JsLiteRest, cleanStorageData }) {
  describe('数组项中数组的管理', () => {
    let store;
    
    beforeEach(async () => {
      store = await JsLiteRest.create({
        books: [
          { 
            id: 1, 
            title: 'JavaScript权威指南',
            comments: [
              { id: 1, content: '很好的书', author: 'Alice' },
              { id: 2, content: '推荐阅读', author: 'Bob' }
            ]
          },
          { 
            id: 2, 
            title: 'CSS揭秘',
            comments: [
              { id: 3, content: '很实用', author: 'Charlie' }
            ]
          },
          {
            id: 3,
            title: 'HTML5权威指南',
            comments: []
          }
        ]
      }, {
        savePath: `test_array_item_array_${Date.now()}`
      });
    });

    afterEach(async () => {
      await cleanStorageData(store.opt.savePath);
    });

    it('get books[0].comments 应该获取第1本书的所有评论', async () => {
      const comments = await store.get('books[0].comments');
      expect(comments).to.be.an('array');
      expect(comments.length).to.equal(2);
      expect(comments[0].content).to.equal('很好的书');
      expect(comments[1].content).to.equal('推荐阅读');
    });

    it('get books[1].comments 应该获取第2本书的所有评论', async () => {
      const comments = await store.get('books[1].comments');
      expect(comments).to.be.an('array');
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal('很实用');
    });

    it('get books[2].comments 应该获取空评论数组', async () => {
      const comments = await store.get('books[2].comments');
      expect(comments).to.be.an('array');
      expect(comments.length).to.equal(0);
    });

    it('get books[0].comments 支持查询参数过滤', async () => {
      const comments = await store.get('books[0].comments', { author: 'Alice' });
      expect(comments).to.be.an('array');
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal('很好的书');
      expect(comments[0].author).to.equal('Alice');
    });

    it('post books[0].comments 应该在第1本书中添加评论', async () => {
      const newComment = { content: '非常棒!', author: 'David' };
      const result = await store.post('books[0].comments', newComment);
      
      expect(result).to.be.an('object');
      expect(result.content).to.equal('非常棒!');
      expect(result.author).to.equal('David');
      expect(result.id).to.be.a('string');

      // 验证评论确实被添加
      const comments = await store.get('books[0].comments');
      expect(comments.length).to.equal(3);
      expect(comments[2].content).to.equal('非常棒!');
    });

    it('post books[2].comments 应该在空评论数组中添加评论', async () => {
      const newComment = { content: '第一条评论', author: 'Eve' };
      const result = await store.post('books[2].comments', newComment);
      
      expect(result.content).to.equal('第一条评论');
      expect(result.author).to.equal('Eve');

      const comments = await store.get('books[2].comments');
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal('第一条评论');
    });

    it('put books[0].comments/1 应该更新第1本书的指定评论', async () => {
      const updatedComment = { content: '更新后的评论', author: 'Alice-Updated' };
      const result = await store.put('books[0].comments/1', updatedComment);
      
      expect(result.content).to.equal('更新后的评论');
      expect(result.author).to.equal('Alice-Updated');
      expect(result.id).to.equal(1);

      // 验证评论确实被更新
      const comments = await store.get('books[0].comments');
      expect(comments[0].content).to.equal('更新后的评论');
      expect(comments[0].author).to.equal('Alice-Updated');
    });

    it('patch books[0].comments/2 应该部分更新第1本书的指定评论', async () => {
      const patchData = { author: 'Bob-Patched' };
      const result = await store.patch('books[0].comments/2', patchData);
      
      expect(result.content).to.equal('推荐阅读'); // 内容保持不变
      expect(result.author).to.equal('Bob-Patched'); // 作者被更新
      expect(result.id).to.equal(2);

      // 验证评论确实被部分更新
      const comments = await store.get('books[0].comments');
      expect(comments[1].content).to.equal('推荐阅读');
      expect(comments[1].author).to.equal('Bob-Patched');
    });

    it('delete books[0].comments/1 应该删除第1本书的指定评论', async () => {
      const deletedComment = await store.delete('books[0].comments/1');
      
      expect(deletedComment).to.be.an('object');
      expect(deletedComment.id).to.equal(1);
      expect(deletedComment.content).to.equal('很好的书');

      // 验证评论确实被删除
      const comments = await store.get('books[0].comments');
      expect(comments.length).to.equal(1);
      expect(comments[0].id).to.equal(2);
      expect(comments[0].content).to.equal('推荐阅读');
    });

    it('get books[999].comments 应该抛出错误 (索引超出范围)', async () => {
      try {
        await store.get('books[999].comments');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.code).to.equal(500);
        expect(error.success).to.equal(false);
        expect(error.message).to.include('未找到');
      }
    });

    it('post books[999].comments 应该抛出错误 (索引超出范围)', async () => {
      try {
        await store.post('books[999].comments', { content: 'test' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.include('数组索引');
        expect(error.message).to.include('超出范围');
      }
    });

    it('深层嵌套：books[0].comments 的分页和排序', async () => {
      // 先添加更多评论用于测试
      await store.post('books[0].comments', { content: 'comment3', author: 'Charlie', rating: 3 });
      await store.post('books[0].comments', { content: 'comment1', author: 'Alice2', rating: 5 });
      await store.post('books[0].comments', { content: 'comment2', author: 'Bob2', rating: 4 });

      // 测试排序 - 按内容升序排列（所有评论现在包括原有的 + 新添加的）
      const sortedComments = await store.get('books[0].comments', { 
        _sort: 'content', 
        _order: 'asc' 
      });
      expect(sortedComments.length).to.equal(5);
      
      // 验证排序功能正常工作 - 检查新添加的评论是否正确排序
      const newComments = sortedComments.filter(c => c.content.startsWith('comment'));
      expect(newComments.length).to.equal(3);
      expect(newComments[0].content).to.equal('comment1');
      expect(newComments[1].content).to.equal('comment2');
      expect(newComments[2].content).to.equal('comment3');

      // 测试分页
      const pagedComments = await store.get('books[0].comments', { 
        _page: 1, 
        _limit: 2 
      });
      expect(pagedComments.count).to.equal(5);
      expect(pagedComments.list.length).to.equal(2);
    });
  });
}

export default fn;
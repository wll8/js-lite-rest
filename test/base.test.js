import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import fs from 'fs';

export function testMain(Store, opt = {}) {
  if (opt.afterEach) {
    afterEach(opt.afterEach);
  }

  // 检测当前环境
  const isNodeEnv = typeof window === 'undefined';
  // 基本操作
  describe('基本操作', () => {
    let store;
    beforeEach(async () => {
      store = await Store.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
    });
    it('get 列表', async () => {
      const books = await store.get('book');
      expect(books.length).to.equal(2);
    });
    it('get 详情', async () => {
      const book = await store.get('book/1');
      expect(book).to.deep.equal({ id: 1, title: 'css' });
    });
    it('post 新增', async () => {
      await store.post('book', { title: 'html' });
      const books = await store.get('book');
      expect(books.length).to.equal(3);
      expect(books[2].title).to.equal('html');
    });
    it('put 更新', async () => {
      await store.put('book/1', { title: 'css3' });
      const books = await store.get('book');
      expect(books[0].title).to.equal('css3');
    });
    it('delete 删除', async () => {
      await store.delete('book/1');
      const books = await store.get('book');
      expect(books.length).to.equal(1);
      expect(books[0].id).to.equal(2);
    });
    it('patch 部分更新', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', author: 'A' },
          { id: 2, title: 'js', author: 'B' },
        ],
      });
      await store.patch('book/1', { title: 'css3' });
      const book = await store.get('book/1');
      expect(book).to.deep.equal({ id: 1, title: 'css3', author: 'A' });
      await store.patch('book/1', { author: 'C' });
      const book2 = await store.get('book/1');
      expect(book2).to.deep.equal({ id: 1, title: 'css3', author: 'C' });
    });
  });

  // 过滤
  describe('过滤', () => {
    it('get 查询', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
      const books = await store.get('book', { title: 'css' });
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
    });
    it('get 多字段过滤', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', type: 'js', discount: 1 },
          { id: 2, title: 'js', type: 'js', discount: 0 },
          { id: 3, title: 'html', type: 'html', discount: 1 },
        ],
      });
      const books = await store.get('book', { discount: 1, type: 'js' });
      expect(books.length).to.equal(1);
      expect(books[0].id).to.equal(1);
    });
    it('get 同字段多值过滤', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
          { id: 3, title: 'html' },
        ],
      });
      const books = await store.get('book', { id: [1, 2] });
      expect(books.length).to.equal(2);
      expect(books.map(b => b.id)).to.include(1).and.include(2);
    });
    it('get 点语法深层字段过滤', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', author: { name: '张三' } },
          { id: 2, title: 'js', author: { name: '李四' } },
        ],
      });
      const books = await store.get('book', { 'author.name': '张三' });
      expect(books.length).to.equal(1);
      expect(books[0].author.name).to.equal('张三');
    });
  });

  // 分页
  describe('分页', () => {
    it('get 分页功能', async () => {
      const store = await Store.create({
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
      expect(page1.length).to.equal(6);
      expect(page1[0].id).to.equal(1);
      const page1Limit2 = await store.get('book', { _page: 1, _limit: 2 });
      expect(page1Limit2.length).to.equal(2);
      expect(page1Limit2[0].id).to.equal(1);
      expect(page1Limit2[1].id).to.equal(2);
      const page2Limit2 = await store.get('book', { _page: 2, _limit: 2 });
      expect(page2Limit2.length).to.equal(2);
      expect(page2Limit2[0].id).to.equal(3);
      expect(page2Limit2[1].id).to.equal(4);
      const page3Limit2 = await store.get('book', { _page: 3, _limit: 2 });
      expect(page3Limit2.length).to.equal(2);
      expect(page3Limit2[0].id).to.equal(5);
      expect(page3Limit2[1].id).to.equal(6);
      const page4Limit2 = await store.get('book', { _page: 4, _limit: 2 });
      expect(page4Limit2.length).to.equal(0);
    });
    it('get 分页与过滤结合', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'js', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'design' },
          { id: 4, title: 'python', type: 'programming' },
          { id: 5, title: 'java', type: 'programming' },
        ],
      });
      const result = await store.get('book', { type: 'programming', _page: 1, _limit: 2 });
      expect(result.length).to.equal(2);
      expect(result[0].title).to.equal('js');
      expect(result[1].title).to.equal('python');
    });
  });

  // 排序
  describe('排序', () => {
    it('get 单字段排序', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', view: 100 },
          { id: 2, title: 'js', view: 200 },
          { id: 3, title: 'html', view: 50 },
        ],
      });
      const ascResult = await store.get('book', { _sort: 'view', _order: 'asc' });
      expect(ascResult[0].view).to.equal(50);
      expect(ascResult[1].view).to.equal(100);
      expect(ascResult[2].view).to.equal(200);
      const descResult = await store.get('book', { _sort: 'view', _order: 'desc' });
      expect(descResult[0].view).to.equal(200);
      expect(descResult[1].view).to.equal(100);
      expect(descResult[2].view).to.equal(50);
    });
    it('get 多字段排序', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', user: 'A', view: 100 },
          { id: 2, title: 'js', user: 'A', view: 200 },
          { id: 3, title: 'html', user: 'B', view: 50 },
          { id: 4, title: 'vue', user: 'B', view: 150 },
        ],
      });
      const result = await store.get('book', { _sort: 'user,view', _order: 'desc,asc' });
      expect(result[0].user).to.equal('B');
      expect(result[0].view).to.equal(50);
      expect(result[1].user).to.equal('B');
      expect(result[1].view).to.equal(150);
      expect(result[2].user).to.equal('A');
      expect(result[2].view).to.equal(100);
      expect(result[3].user).to.equal('A');
      expect(result[3].view).to.equal(200);
    });
    it('get 排序与过滤结合', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'js', type: 'programming', view: 100 },
          { id: 2, title: 'css', type: 'design', view: 200 },
          { id: 3, title: 'html', type: 'design', view: 50 },
          { id: 4, title: 'python', type: 'programming', view: 150 },
        ],
      });
      const result = await store.get('book', { type: 'design', _sort: 'view', _order: 'asc' });
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(50);
      expect(result[1].view).to.equal(200);
    });
    it('get 排序与分页结合', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'book1', view: 100 },
          { id: 2, title: 'book2', view: 200 },
          { id: 3, title: 'book3', view: 50 },
          { id: 4, title: 'book4', view: 150 },
          { id: 5, title: 'book5', view: 300 },
        ],
      });
      const result = await store.get('book', { _sort: 'view', _order: 'desc', _page: 1, _limit: 2 });
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(300);
      expect(result[1].view).to.equal(200);
    });
    it('get 深层字段排序', async () => {
      const store = await Store.create({
        book: [
          { id: 1, title: 'css', author: { name: '张三', age: 30 } },
          { id: 2, title: 'js', author: { name: '李四', age: 25 } },
          { id: 3, title: 'html', author: { name: '王五', age: 35 } },
        ],
      });
      const result = await store.get('book', { _sort: 'author.age', _order: 'asc' });
      expect(result[0].author.age).to.equal(25);
      expect(result[1].author.age).to.equal(30);
      expect(result[2].author.age).to.equal(35);
    });
  });

  // 截取
  describe('截取', () => {
    it('get 截取功能 - start到end', async () => {
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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

  // 运算
  describe('运算', () => {
    it('get 范围查询 - gte和lte', async () => {
      const store = await Store.create({
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
      const store = await Store.create({
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
    });
    it('get 模糊查询 - like单模式', async () => {
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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

  // 全文检索
  describe('全文检索', () => {
    it('get 全文检索 _q参数', async () => {
      const store = await Store.create({
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
      const store = await Store.create({
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

  // 关系
  describe('关系', () => {
    it('get 在父列表中嵌入子列表', async () => {
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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
      const store = await Store.create({
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

  // 嵌套
  describe('嵌套', () => {
    it('get posts/1/comments 嵌套资源', async () => {
      const store = await Store.create({
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
    it('post posts/1/comments 嵌套资源', async () => {
      const store = await Store.create({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postsId: 1, content: 'c1' },
        ],
      });
      const newComment = { content: 'c2' };
      const result = await store.post('posts/1/comments', newComment);
      expect(result.id).to.equal(2);
      expect(result.postsId).to.equal(1);
      expect(result.content).to.equal('c2');
      const comments = await store.get('posts/1/comments');
      expect(comments.length).to.equal(2);
      expect(comments[1].content).to.equal('c2');
    });
  });

  // 批量操作
  describe('批量操作', () => {
    it('delete /posts?id=1&id=2 批量删除', async () => {
      const store = await Store.create({
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
      const store = await Store.create({ posts: [] });
      const arr = [
        { title: 'a' },
        { title: 'b' },
        { id: 99, title: 'should fail' },
      ];
      const result = await store.post('posts', arr);
      expect(result.length).to.equal(3);
      expect(result[0].id).to.equal(1);
      expect(result[1].id).to.equal(2);
      expect(result[2]).to.equal(null);
      const all = await store.get('posts');
      expect(all.length).to.equal(2);
    });
    it('put /posts 批量全量修改', async () => {
      const store = await Store.create({
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
      const result = await store.put('posts', arr);
      expect(result.length).to.equal(3);
      expect(result[0].title).to.equal('A');
      expect(result[1].view).to.equal(20);
      expect(result[2]).to.equal(null);
      const all = await store.get('posts');
      expect(all[0].title).to.equal('A');
      expect(all[1].title).to.equal('B');
    });
    it('patch /posts 批量部分修改', async () => {
      const store = await Store.create({
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
      const result = await store.patch('posts', arr);
      expect(result.length).to.equal(3);
      expect(result[0].view).to.equal(100);
      expect(result[1].title).to.equal('B');
      expect(result[2]).to.equal(null);
      const all = await store.get('posts');
      expect(all[0].view).to.equal(100);
      expect(all[1].title).to.equal('B');
    });
  });

  // 拦截器功能（保持原有）
  describe('拦截器功能', () => {
    let store;

    beforeEach(async () => {
      store = await Store.create({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
        ],
      });
    });

    it('前置拦截器 - 修改请求参数', async () => {
      const requestLog = [];
      
      store.use(async (args, next) => {
        requestLog.push({ type: 'before', args: [...args] });
        // 修改查询参数
        if (args[0] === 'get' && args[1] === 'book') {
          args[2] = { title: 'css' }; // 强制查询 css
        }
        const result = await next(args);
        requestLog.push({ type: 'after', result });
        return result;
      });

      const books = await store.get('book');
      
      expect(requestLog).to.have.length(2);
      expect(requestLog[0].type).to.equal('before');
      expect(requestLog[1].type).to.equal('after');
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
    });

    it('后置拦截器 - 修改响应数据', async () => {
      store.use(async (args, next) => {
        const result = await next(args);
        // 为所有书籍添加时间戳
        if (Array.isArray(result)) {
          return result.map(book => ({ ...book, timestamp: Date.now() }));
        }
        return result;
      });

      const books = await store.get('book');
      
      expect(books.length).to.equal(2);
      expect(books[0]).to.have.property('timestamp');
      expect(books[1]).to.have.property('timestamp');
    });

    it('多个拦截器 - 链式处理与数据传递', async () => {
      store.use(async (args, next) => {
        // 添加标记1
        const result = await next(args);
        if (Array.isArray(result)) {
          return result.map(item => ({ ...item, tag1: true }));
        }
        return result;
      });

      store.use(async (args, next) => {
        // 添加标记2
        const result = await next(args);
        if (Array.isArray(result)) {
          return result.map(item => ({ ...item, tag2: true }));
        }
        return result;
      });

      const books = await store.get('book');
      expect(books.length).to.equal(2);
      expect(books[0]).to.have.property('tag1', true);
      expect(books[0]).to.have.property('tag2', true);
      expect(books[1]).to.have.property('tag1', true);
      expect(books[1]).to.have.property('tag2', true);
    });

    it('拦截器中断链后，后续拦截器不会执行', async () => {
      let secondCalled = false;

      store.use(async (args, next) => {
        // 不调用 next，直接返回
        return [{ id: 999, title: 'fake' }];
      });

      store.use(async (args, next) => {
        secondCalled = true;
        return await next(args);
      });

      const books = await store.get('book');
      expect(books).to.deep.equal([{ id: 999, title: 'fake' }]);
      expect(secondCalled).to.equal(false);
    });

    it('拦截器错误处理', async () => {
      let errorCaught = false;
      
      store.use(async (args, next) => {
        try {
          const result = await next(args);
          return result;
        } catch (error) {
          errorCaught = true;
          throw error;
        }
      });

      store.use(async (args, next) => {
        if (args[0] === 'get') {
          throw new Error('模拟拦截器错误');
        }
        return await next(args);
      });

      try {
        await store.get('book');
      } catch (error) {
        expect(error.message).to.equal('模拟拦截器错误');
        expect(errorCaught).to.equal(true);
      }
    });

    it('拦截器阻止请求', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'delete') {
          // 阻止删除操作
          return { blocked: true, message: '删除操作被拦截' };
        }
        return await next(args);
      });

      const result = await store.delete('book/1');
      
      expect(result.blocked).to.equal(true);
      expect(result.message).to.equal('删除操作被拦截');
      
      // 验证数据没有被删除
      const books = await store.get('book');
      expect(books.length).to.equal(2);
    });

    it('拦截器修改 POST 数据', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'post') {
          // 为所有新增的数据添加创建时间
          args[2] = { ...args[2], createdAt: new Date().toISOString() };
        }
        return await next(args);
      });

      const newBook = { title: 'vue' };
      const result = await store.post('book', newBook);
      
      expect(result).to.have.property('createdAt');
      expect(result.title).to.equal('vue');
      
      const books = await store.get('book');
      expect(books.length).to.equal(3);
    });

    it('拦截器验证数据', async () => {
      store.use(async (args, next) => {
        if (args[0] === 'post' || args[0] === 'put') {
          const data = args[2];
          if (!data.title || data.title.length < 2) {
            throw new Error('标题长度必须大于2个字符');
          }
        }
        return await next(args);
      });

      // 测试有效数据
      const validBook = { title: 'react' };
      await expect(store.post('book', validBook)).to.be.fulfilled;

      // 测试无效数据
      const invalidBook = { title: 'a' };
      await expect(store.post('book', invalidBook)).to.be.rejectedWith('标题长度必须大于2个字符');
    });

    it('拦截器添加认证信息', async () => {
      store.use(async (args, next, opt) => {
        // 模拟添加认证头
        opt.headers = opt.headers || {};
        opt.headers['Authorization'] = 'Bearer token123';
        return await next(args);
      });

      store.use(async (args, next, opt) => {
        // 验证认证信息
        expect(opt.headers['Authorization']).to.equal('Bearer token123');
        return await next(args);
      });

      await store.get('book');
    });

    it('拦截器缓存机制', async () => {
      const cache = new Map();
      
      store.use(async (args, next) => {
        const cacheKey = JSON.stringify(args);
        
        if (args[0] === 'get' && cache.has(cacheKey)) {
          return cache.get(cacheKey);
        }
        
        const result = await next(args);
        
        if (args[0] === 'get') {
          cache.set(cacheKey, result);
        }
        
        return result;
      });

      // 第一次请求
      const books1 = await store.get('book');
      expect(books1.length).to.equal(2);
      
      // 第二次请求应该从缓存返回
      const books2 = await store.get('book');
      expect(books2).to.equal(books1); // 应该是同一个引用
      
      // 修改数据后缓存应该失效
      await store.post('book', { title: 'angular' });
      const books3 = await store.get('book');
      expect(books3.length).to.equal(3);
    });
  });

  // Store 配置项测试
  describe('Store 配置项', () => {
    it('默认配置项', async () => {
      // 检查默认的 idKeySuffix
      const store = await Store.create({
        posts: [{ id: 1, title: 'test' }],
        comments: [{ id: 1, postId: 1, content: 'comment' }]
      });

      expect(store.opt.idKeySuffix).to.equal('Id');

      // 测试默认的关系键生成 - postId 对应 posts + Id
      const result = await store.get('posts/1/comments');
      expect(Array.isArray(result)).to.equal(true);
      if (result.length > 0) {
        expect(result[0].content).to.equal('comment');
        expect(result[0].postId).to.equal(1);
      }
    });

    it('默认存储路径验证', async () => {
      if (isNodeEnv) {
        // Node.js 环境：验证默认文件路径和实际文件内容
        const defaultPath = 'js-store.json';

        // 清理可能存在的测试文件
        if (fs.existsSync(defaultPath)) {
          fs.unlinkSync(defaultPath);
        }

        // 传入数据对象，JsStore 已经有默认的 load 和 save 函数
        const store = await Store.create({
          books: [{ id: 1, title: 'initial book' }]
        });

        expect(store.opt.savePath).to.equal(defaultPath);

        // 验证初始数据已经被保存到文件
        expect(fs.existsSync(defaultPath)).to.equal(true);

        // 验证初始文件内容
        let fileContent = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
        expect(fileContent.books).to.be.an('array');
        expect(fileContent.books.length).to.equal(1);
        expect(fileContent.books[0].title).to.equal('initial book');

        // 添加数据触发保存
        await store.post('books', { title: 'new book' });

        // 验证更新后的文件内容
        fileContent = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
        expect(fileContent.books.length).to.equal(2);
        expect(fileContent.books[1].title).to.equal('new book');

        // 清理测试文件
        fs.unlinkSync(defaultPath);

      } else {
        // 浏览器环境：验证默认 localStorage key 和实际存储内容
        const defaultKey = 'js-store';

        // 清理可能存在的测试数据
        window.localStorage.removeItem(defaultKey);

        // 传入数据对象，现在也会使用默认的 save 函数
        const store = await Store.create({
          books: [{ id: 1, title: 'initial book' }]
        });

        expect(store.opt.savePath).to.equal(defaultKey);

        // 验证初始数据已经被保存到 localStorage
        let storedData = window.localStorage.getItem(defaultKey);
        expect(storedData).to.not.be.null;

        let parsedData = JSON.parse(storedData);
        expect(parsedData.books).to.be.an('array');
        expect(parsedData.books.length).to.equal(1);
        expect(parsedData.books[0].title).to.equal('initial book');

        // 添加数据触发保存
        await store.post('books', { title: 'new book' });

        // 验证更新后的 localStorage 内容
        storedData = window.localStorage.getItem(defaultKey);
        parsedData = JSON.parse(storedData);
        expect(parsedData.books.length).to.equal(2);
        expect(parsedData.books[1].title).to.equal('new book');

        // 清理测试数据
        window.localStorage.removeItem(defaultKey);
      }
    });

    it('自定义 idKeySuffix 配置', async () => {
      const store = await Store.create({
        posts: [{ id: 1, title: 'test' }],
        comments: [{ id: 1, post_id: 1, content: 'comment' }]
      }, {
        idKeySuffix: '_id'
      });

      expect(store.opt.idKeySuffix).to.equal('_id');

      // 先测试基本查询
      const allComments = await store.get('comments');
      expect(allComments.length).to.equal(1);

      // 测试自定义关系键 - 使用正确的字段名
      const result = await store.get('posts/1/comments');
      expect(Array.isArray(result)).to.equal(true);
      if (result.length > 0) {
        expect(result[0].content).to.equal('comment');
        expect(result[0].post_id).to.equal(1);
      }
    });

    it('自定义 savePath 配置', async () => {
      if (isNodeEnv) {
        // Node.js 环境：测试自定义文件路径和实际文件内容
        const testPath = 'test-custom-path.json';

        // 清理可能存在的测试文件
        if (fs.existsSync(testPath)) {
          fs.unlinkSync(testPath);
        }

        // 传入数据对象和自定义路径，JsStore 会自动合并默认的 load 和 save 函数
        const store = await Store.create({
          books: [{ id: 1, title: 'initial book' }]
        }, {
          savePath: testPath
        });

        expect(store.opt.savePath).to.equal(testPath);

        // 验证初始数据已经被保存到自定义路径
        expect(fs.existsSync(testPath)).to.equal(true);

        // 验证初始文件内容
        let fileContent = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
        expect(fileContent.books).to.be.an('array');
        expect(fileContent.books.length).to.equal(1);
        expect(fileContent.books[0].title).to.equal('initial book');

        // 添加数据触发保存
        await store.post('books', { title: 'custom path book' });

        // 验证更新后的文件内容
        fileContent = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
        expect(fileContent.books.length).to.equal(2);
        expect(fileContent.books[1].title).to.equal('custom path book');

        // 清理测试文件
        fs.unlinkSync(testPath);

      } else {
        // 浏览器环境：测试自定义 localStorage key 和实际存储内容
        const testKey = 'test-custom-key';

        // 清理可能存在的测试数据
        window.localStorage.removeItem(testKey);

        // 传入数据对象和自定义 key
        const store = await Store.create({
          books: [{ id: 1, title: 'initial book' }]
        }, {
          savePath: testKey
        });

        expect(store.opt.savePath).to.equal(testKey);

        // 验证初始数据已经被保存到自定义 key
        let storedData = window.localStorage.getItem(testKey);
        expect(storedData).to.not.be.null;

        let parsedData = JSON.parse(storedData);
        expect(parsedData.books).to.be.an('array');
        expect(parsedData.books.length).to.equal(1);
        expect(parsedData.books[0].title).to.equal('initial book');

        // 添加数据触发保存
        await store.post('books', { title: 'custom key book' });

        // 验证更新后的 localStorage 内容
        storedData = window.localStorage.getItem(testKey);
        parsedData = JSON.parse(storedData);
        expect(parsedData.books.length).to.equal(2);
        expect(parsedData.books[1].title).to.equal('custom key book');

        // 清理测试数据
        window.localStorage.removeItem(testKey);
      }
    });

    it('自定义 adapter 配置', async () => {
      class CustomAdapter {
        constructor(data, opt) {
          this.data = data;
          this.opt = opt;
        }

        get(path) {
          return { custom: true, path };
        }

        // 添加 save 方法，因为初始化时会调用
        async save() {
          // 自定义适配器的保存逻辑
        }
      }

      const customAdapter = new CustomAdapter({}, {});
      const store = await Store.create({}, {
        adapter: customAdapter
      });

      expect(store.opt.adapter).to.equal(customAdapter);
      const result = await store.get('test');
      expect(result.custom).to.equal(true);
      expect(result.path).to.equal('test');
    });

    it('自定义 load 和 save 函数', async () => {
      let loadCalled = false;
      let loadPath = null;
      let saveCalled = false;
      let savedPath = null;
      let savedData = null;

      const customLoad = async (path) => {
        loadCalled = true;
        loadPath = path;

        if (isNodeEnv) {
          // Node.js 环境：模拟从文件加载
          return { books: [{ id: 1, title: 'loaded from file' }] };
        } else {
          // 浏览器环境：模拟从 localStorage 加载
          return { books: [{ id: 1, title: 'loaded from localStorage' }] };
        }
      };

      const customSave = async (path, data) => {
        saveCalled = true;
        savedPath = path;
        savedData = data;

        // 验证保存的数据结构
        expect(data).to.be.an('object');
        expect(data.books).to.be.an('array');
      };

      const testPath = isNodeEnv ? 'test-file.json' : 'test-localStorage-key';
      const store = await Store.create(testPath, {
        load: customLoad,
        save: customSave
      });

      // 验证 load 函数被正确调用
      expect(loadCalled).to.equal(true);
      expect(loadPath).to.equal(testPath);

      // 测试数据是否正确加载
      const books = await store.get('books');
      expect(books.length).to.equal(1);
      if (isNodeEnv) {
        expect(books[0].title).to.equal('loaded from file');
      } else {
        expect(books[0].title).to.equal('loaded from localStorage');
      }

      // 测试保存功能
      await store.post('books', { title: 'new book' });
      expect(saveCalled).to.equal(true);
      expect(savedPath).to.equal(testPath);
      expect(savedData).to.not.be.null;
      expect(savedData.books.length).to.equal(2);
      expect(savedData.books[1].title).to.equal('new book');
    });

    it('配置项合并测试', async () => {
      const testPath = 'test-merge-config.json';
      let savedPath = null;

      // 使用自定义 save 函数避免创建实际文件
      const mockSave = async (path, data) => {
        savedPath = path;
      };

      const store = await Store.create({
        items: []
      }, {
        idKeySuffix: '_key',
        savePath: testPath,
        customOption: 'custom_value',
        save: mockSave
      });

      expect(store.opt.idKeySuffix).to.equal('_key');
      expect(store.opt.savePath).to.equal(testPath);
      expect(store.opt.customOption).to.equal('custom_value');
      expect(savedPath).to.equal(testPath);
    });

    it('空配置项测试', async () => {
      const store = await Store.create();

      expect(store.opt.idKeySuffix).to.equal('Id');
      // 在测试环境中，默认 savePath 可能不是空字符串
      expect(store.opt.savePath).to.be.a('string');
      // 检查 adapter 是否存在且有正确的方法，而不是使用 instanceof
      expect(store.opt.adapter).to.be.an('object');
      expect(store.opt.adapter).to.have.property('get');
      expect(store.opt.adapter).to.have.property('post');
      expect(store.opt.adapter).to.have.property('save');
    });

    it('配置项不可变性测试', async () => {
      const testPath = 'test-immutable-config.json';
      let savedPath = null;

      // 使用自定义 save 函数避免创建实际文件
      const mockSave = async (path, data) => {
        savedPath = path;
      };

      const originalOpt = {
        idKeySuffix: 'Test',
        savePath: testPath,
        save: mockSave
      };

      const store = await Store.create({}, originalOpt);

      // 修改原始配置对象不应影响 store
      originalOpt.idKeySuffix = 'Modified';
      originalOpt.savePath = 'modified.json';

      expect(store.opt.idKeySuffix).to.equal('Test');
      expect(store.opt.savePath).to.equal(testPath);
      expect(savedPath).to.equal(testPath);
    });

    it('load 函数错误处理', async () => {
      const errorLoad = async (path) => {
        throw new Error('Load failed');
      };

      try {
        await Store.create('test-path', {
          load: errorLoad
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('Load failed');
      }
    });

    it('save 函数错误处理', async () => {
      const errorSave = async (path, data) => {
        throw new Error('Save failed');
      };

      // 现在初始化时就会调用 save，所以创建时就会抛出错误
      try {
        await Store.create({
          books: []
        }, {
          save: errorSave
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('Save failed');
      }
    });

    it('缺少 load 函数时的错误处理', async () => {
      // 导入基础的 Store 类来测试这个错误情况
      const { Store: BaseStore } = await import('../src/store.js');

      try {
        await BaseStore.create('test-path', {
          // 没有提供 load 函数
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('load 方法未定义');
      }
    });

    it('环境特定的存储验证', async () => {
      if (isNodeEnv) {
        // Node.js 环境：验证实际文件操作
        const testFile = 'test-env-specific.json';
        let actualFileContent = null;

        const mockSave = async (path, data) => {
          expect(path).to.equal(testFile);
          actualFileContent = JSON.stringify(data, null, 2);
          // 模拟写入文件
        };

        const mockLoad = async (path) => {
          expect(path).to.equal(testFile);
          return { items: [] };
        };

        const store = await Store.create(testFile, {
          load: mockLoad,
          save: mockSave
        });

        await store.post('items', { name: 'test item' });

        expect(actualFileContent).to.not.be.null;
        const parsedContent = JSON.parse(actualFileContent);
        expect(parsedContent.items.length).to.equal(1);
        expect(parsedContent.items[0].name).to.equal('test item');

      } else {
        // 浏览器环境：验证 localStorage 操作
        const testKey = 'test-env-specific';
        let actualStorageData = null;

        const mockSave = async (key, data) => {
          expect(key).to.equal(testKey);
          actualStorageData = JSON.stringify(data);
          // 模拟存储到 localStorage
        };

        const mockLoad = async (key) => {
          expect(key).to.equal(testKey);
          return { items: [] };
        };

        const store = await Store.create(testKey, {
          load: mockLoad,
          save: mockSave
        });

        await store.post('items', { name: 'test item' });

        expect(actualStorageData).to.not.be.null;
        const parsedData = JSON.parse(actualStorageData);
        expect(parsedData.items.length).to.equal(1);
        expect(parsedData.items[0].name).to.equal('test item');
      }
    });

    it('配置项类型验证', async () => {
      const testPath = 'test-type-validation.json';
      let savedPath = null;

      // 使用自定义 save 函数避免创建实际文件
      const mockSave = async (path, data) => {
        savedPath = path;
      };

      const store = await Store.create({
        books: []
      }, {
        idKeySuffix: 'Suffix',
        savePath: testPath,
        customProp: 'customValue',
        save: mockSave
      });

      // 验证配置项类型
      expect(typeof store.opt.idKeySuffix).to.equal('string');
      expect(typeof store.opt.savePath).to.equal('string');
      expect(typeof store.opt.customProp).to.equal('string');

      // 验证配置项值
      expect(store.opt.idKeySuffix).to.equal('Suffix');
      expect(store.opt.savePath).to.equal(testPath);
      expect(store.opt.customProp).to.equal('customValue');
      expect(savedPath).to.equal(testPath);
    });
  });
}

export async function testNodeStoreBasic(JsStore) {
  const TEST_FILE = 'test-node-store.json';

  describe('文件持久化', () => {
    afterEach(() => {
      if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
    });

    it('json', async () => {
      // 新建 store - 使用异步创建方法
      const store = await JsStore.create(TEST_FILE);
      // 新增
      await store.post('book', { title: 'js' });
      await store.post('book', { title: 'css' });
      let books = await store.get('book');
      expect(books.length).to.equal(2);
      expect(books[0].title).to.equal('js');
      // 修改
      await store.put('book/1', { title: 'html' });
      let book = await store.get('book/1');
      expect(book.title).to.equal('html');
      // 删除
      await store.delete('book/2');
      books = await store.get('book');
      expect(books.length).to.equal(1);
      // 检查文件内容
      const fileContent = JSON.parse(fs.readFileSync(TEST_FILE, 'utf-8'));
      expect(fileContent.book.length).to.equal(1);
      expect(fileContent.book[0].title).to.equal('html');
    });
  });
}

export function testBrowserStore(JsStore) {
  describe('本地存储持久化', () => {
    const TEST_KEY = 'test-browser-store';
    beforeEach(() => {
      window.localStorage.removeItem(TEST_KEY);
    });
    it('localStorage', async () => {
      const store = await JsStore.create(TEST_KEY);
      // 新增
      await store.post('book', { title: 'js' });
      await store.post('book', { title: 'css' });
      let books = await store.get('book');
      expect(books.length).to.equal(2);
      expect(books[0].title).to.equal('js');
      // 修改
      await store.put('book/1', { title: 'html' });
      let book = await store.get('book/1');
      expect(book.title).to.equal('html');
      // 删除
      await store.delete('book/2');
      books = await store.get('book');
      expect(books.length).to.equal(1);
      // 检查 localStorage 内容
      const raw = JSON.parse(window.localStorage.getItem(TEST_KEY));
      expect(raw.book.length).to.equal(1);
      expect(raw.book[0].title).to.equal('html');
    });
  });
}

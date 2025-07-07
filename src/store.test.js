import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
import { Store } from './store.js';

export function testStoreBasic(Store) {
  describe('Store 基础功能', () => {
    let store;
    beforeEach(() => {
      store = new Store({
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

    it('get 查询', async () => {
      const books = await store.get('book', { title: 'css' });
      expect(books.length).to.equal(1);
      expect(books[0].title).to.equal('css');
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
      const store = new Store({
        book: [
          { id: 1, title: 'css', author: 'A' },
          { id: 2, title: 'js', author: 'B' },
        ],
      });
      // 只更新 title 字段
      await store.patch('book/1', { title: 'css3' });
      const book = await store.get('book/1');
      expect(book).to.deep.equal({ id: 1, title: 'css3', author: 'A' });
      // 只更新 author 字段
      await store.patch('book/1', { author: 'C' });
      const book2 = await store.get('book/1');
      expect(book2).to.deep.equal({ id: 1, title: 'css3', author: 'C' });
    });

    it('get 多字段过滤', async () => {
      const store = new Store({
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
      const store = new Store({
        book: [
          { id: 1, title: 'css' },
          { id: 2, title: 'js' },
          { id: 3, title: 'html' },
        ],
      });
      // 模拟 id=1&id=2 这种情况
      const books = await store.get('book', { id: [1, 2] });
      expect(books.length).to.equal(2);
      expect(books.map(b => b.id)).to.include(1).and.include(2);
    });

    it('get 点语法深层字段过滤', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', author: { name: '张三' } },
          { id: 2, title: 'js', author: { name: '李四' } },
        ],
      });
      const books = await store.get('book', { 'author.name': '张三' });
      expect(books.length).to.equal(1);
      expect(books[0].author.name).to.equal('张三');
    });

    it('get 分页功能', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
          { id: 4, title: 'book4' },
          { id: 5, title: 'book5' },
          { id: 6, title: 'book6' },
        ],
      });
      
      // 测试默认分页（第1页，每页10条）
      const page1 = await store.get('book', { _page: 1 });
      expect(page1.length).to.equal(6);
      expect(page1[0].id).to.equal(1);
      
      // 测试指定每页数量
      const page1Limit2 = await store.get('book', { _page: 1, _limit: 2 });
      expect(page1Limit2.length).to.equal(2);
      expect(page1Limit2[0].id).to.equal(1);
      expect(page1Limit2[1].id).to.equal(2);
      
      // 测试第2页
      const page2Limit2 = await store.get('book', { _page: 2, _limit: 2 });
      expect(page2Limit2.length).to.equal(2);
      expect(page2Limit2[0].id).to.equal(3);
      expect(page2Limit2[1].id).to.equal(4);
      
      // 测试第3页（最后一页）
      const page3Limit2 = await store.get('book', { _page: 3, _limit: 2 });
      expect(page3Limit2.length).to.equal(2);
      expect(page3Limit2[0].id).to.equal(5);
      expect(page3Limit2[1].id).to.equal(6);
      
      // 测试超出范围的页
      const page4Limit2 = await store.get('book', { _page: 4, _limit: 2 });
      expect(page4Limit2.length).to.equal(0);
    });

    it('get 分页与过滤结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'js', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'design' },
          { id: 4, title: 'python', type: 'programming' },
          { id: 5, title: 'java', type: 'programming' },
        ],
      });
      
      // 先过滤再分页
      const result = await store.get('book', { 
        type: 'programming', 
        _page: 1, 
        _limit: 2 
      });
      expect(result.length).to.equal(2);
      expect(result[0].title).to.equal('js');
      expect(result[1].title).to.equal('python');
    });

    it('get 单字段排序', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', view: 100 },
          { id: 2, title: 'js', view: 200 },
          { id: 3, title: 'html', view: 50 },
        ],
      });
      
      // 升序排序
      const ascResult = await store.get('book', { _sort: 'view', _order: 'asc' });
      expect(ascResult[0].view).to.equal(50);
      expect(ascResult[1].view).to.equal(100);
      expect(ascResult[2].view).to.equal(200);
      
      // 降序排序
      const descResult = await store.get('book', { _sort: 'view', _order: 'desc' });
      expect(descResult[0].view).to.equal(200);
      expect(descResult[1].view).to.equal(100);
      expect(descResult[2].view).to.equal(50);
    });

    it('get 多字段排序', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', user: 'A', view: 100 },
          { id: 2, title: 'js', user: 'A', view: 200 },
          { id: 3, title: 'html', user: 'B', view: 50 },
          { id: 4, title: 'vue', user: 'B', view: 150 },
        ],
      });
      
      // 多字段排序：user降序，view升序
      const result = await store.get('book', { 
        _sort: 'user,view', 
        _order: 'desc,asc' 
      });
      
      // 期望结果：B用户在前（降序），然后按view升序
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
      const store = new Store({
        book: [
          { id: 1, title: 'js', type: 'programming', view: 100 },
          { id: 2, title: 'css', type: 'design', view: 200 },
          { id: 3, title: 'html', type: 'design', view: 50 },
          { id: 4, title: 'python', type: 'programming', view: 150 },
        ],
      });
      
      // 先过滤再排序
      const result = await store.get('book', { 
        type: 'design',
        _sort: 'view', 
        _order: 'asc' 
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(50);
      expect(result[1].view).to.equal(200);
    });

    it('get 排序与分页结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1', view: 100 },
          { id: 2, title: 'book2', view: 200 },
          { id: 3, title: 'book3', view: 50 },
          { id: 4, title: 'book4', view: 150 },
          { id: 5, title: 'book5', view: 300 },
        ],
      });
      
      // 先排序再分页
      const result = await store.get('book', { 
        _sort: 'view', 
        _order: 'desc',
        _page: 1, 
        _limit: 2 
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(300);
      expect(result[1].view).to.equal(200);
    });

    it('get 深层字段排序', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'css', author: { name: '张三', age: 30 } },
          { id: 2, title: 'js', author: { name: '李四', age: 25 } },
          { id: 3, title: 'html', author: { name: '王五', age: 35 } },
        ],
      });
      
      // 按作者年龄排序
      const result = await store.get('book', { 
        _sort: 'author.age', 
        _order: 'asc' 
      });
      
      expect(result[0].author.age).to.equal(25);
      expect(result[1].author.age).to.equal(30);
      expect(result[2].author.age).to.equal(35);
    });

    it('get 截取功能 - start到end', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
          { id: 4, title: 'book4' },
          { id: 5, title: 'book5' },
          { id: 6, title: 'book6' },
        ],
      });
      
      // 截取第2到第5条（索引1到4）
      const result = await store.get('book', { _start: 2, _end: 5 });
      expect(result.length).to.equal(3);
      expect(result[0].id).to.equal(3);
      expect(result[1].id).to.equal(4);
      expect(result[2].id).to.equal(5);
    });

    it('get 截取功能 - start加limit', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
          { id: 4, title: 'book4' },
          { id: 5, title: 'book5' },
          { id: 6, title: 'book6' },
        ],
      });
      
      // 从第20条开始，取10条（实际只有6条数据）
      const result = await store.get('book', { _start: 20, _limit: 10 });
      expect(result.length).to.equal(0);
      
      // 从第2条开始，取3条
      const result2 = await store.get('book', { _start: 2, _limit: 3 });
      expect(result2.length).to.equal(3);
      expect(result2[0].id).to.equal(3);
      expect(result2[1].id).to.equal(4);
      expect(result2[2].id).to.equal(5);
    });

    it('get 截取与过滤结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'js', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'design' },
          { id: 4, title: 'python', type: 'programming' },
          { id: 5, title: 'java', type: 'programming' },
        ],
      });
      
      // 先过滤再截取
      const result = await store.get('book', { 
        type: 'programming',
        _start: 1, 
        _end: 3 
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].title).to.equal('python');
      expect(result[1].title).to.equal('java');
    });

    it('get 截取与排序结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1', view: 100 },
          { id: 2, title: 'book2', view: 200 },
          { id: 3, title: 'book3', view: 50 },
          { id: 4, title: 'book4', view: 150 },
          { id: 5, title: 'book5', view: 300 },
        ],
      });
      
      // 先排序再截取
      const result = await store.get('book', { 
        _sort: 'view', 
        _order: 'desc',
        _start: 1, 
        _end: 4 
      });
      
      expect(result.length).to.equal(3);
      expect(result[0].view).to.equal(200);
      expect(result[1].view).to.equal(150);
      expect(result[2].view).to.equal(100);
    });

    it('get 截取边界情况', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
        ],
      });
      
      // 超出范围的截取
      const result1 = await store.get('book', { _start: 10, _end: 15 });
      expect(result1.length).to.equal(0);
      
      // 部分超出范围
      const result2 = await store.get('book', { _start: 1, _end: 10 });
      expect(result2.length).to.equal(2);
      expect(result2[0].id).to.equal(2);
      expect(result2[1].id).to.equal(3);
      
      // 负数索引（应该从0开始）
      const result3 = await store.get('book', { _start: -1, _end: 2 });
      expect(result3.length).to.equal(2);
      expect(result3[0].id).to.equal(1);
      expect(result3[1].id).to.equal(2);
    });

    it('get 范围查询 - gte和lte', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1', view: 2000 },
          { id: 2, title: 'book2', view: 4000 },
          { id: 3, title: 'book3', view: 6000 },
          { id: 4, title: 'book4', view: 8000 },
        ],
      });
      
      // 范围查询：view >= 3000 且 view <= 7000
      const result = await store.get('book', { 
        view_gte: 3000, 
        view_lte: 7000 
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(4000);
      expect(result[1].view).to.equal(6000);
    });

    it('get 排除查询 - ne', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1' },
          { id: 2, title: 'book2' },
          { id: 3, title: 'book3' },
        ],
      });
      
      // 排除 id = 1 的记录
      const result = await store.get('book', { id_ne: 1 });
      
      expect(result.length).to.equal(2);
      expect(result[0].id).to.equal(2);
      expect(result[1].id).to.equal(3);
    });

    it('get 模糊查询 - like单模式', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'javascript', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'markup' },
          { id: 4, title: 'python', type: 'programming' },
        ],
      });
      
      // 模糊查询：type 包含 'prog' 或 'design'
      const result = await store.get('book', { type_like: 'prog|design' });
      
      expect(result.length).to.equal(3);
      expect(result[0].title).to.equal('javascript');
      expect(result[1].title).to.equal('css');
      expect(result[2].title).to.equal('python');
    });

    it('get 模糊查询 - like多模式', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'javascript', type: 'programming' },
          { id: 2, title: 'css', type: 'design' },
          { id: 3, title: 'html', type: 'markup' },
          { id: 4, title: 'python', type: 'programming' },
        ],
      });
      
      // 模糊查询：title 包含 'script'
      const result = await store.get('book', { title_like: 'script' });
      
      expect(result.length).to.equal(1);
      expect(result[0].title).to.equal('javascript');
    });

    it('get 运算查询与过滤结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'js', type: 'programming', view: 1000 },
          { id: 2, title: 'css', type: 'design', view: 2000 },
          { id: 3, title: 'html', type: 'markup', view: 3000 },
          { id: 4, title: 'python', type: 'programming', view: 4000 },
        ],
      });
      
      // 组合查询：type包含'prog'，view>=2000，排除id=4
      const result = await store.get('book', { 
        type_like: 'prog',
        view_gte: 2000,
        id_ne: 4
      });
      
      expect(result.length).to.equal(0);
      
      // 另一个组合查询：type包含'prog'，view>=1000，排除id=1
      const result2 = await store.get('book', { 
        type_like: 'prog',
        view_gte: 1000,
        id_ne: 1
      });
      
      expect(result2.length).to.equal(1);
      expect(result2[0].id).to.equal(4);
    });

    it('get 运算查询与排序结合', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1', view: 1000 },
          { id: 2, title: 'book2', view: 3000 },
          { id: 3, title: 'book3', view: 2000 },
          { id: 4, title: 'book4', view: 4000 },
        ],
      });
      
      // 范围查询 + 排序
      const result = await store.get('book', { 
        view_gte: 1500,
        view_lte: 3500,
        _sort: 'view',
        _order: 'desc'
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].view).to.equal(3000);
      expect(result[1].view).to.equal(2000);
    });

    it('get 深层字段运算查询', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'book1', author: { name: '张三', age: 25 } },
          { id: 2, title: 'book2', author: { name: '李四', age: 30 } },
          { id: 3, title: 'book3', author: { name: '王五', age: 35 } },
        ],
      });
      
      // 深层字段范围查询
      const result = await store.get('book', { 
        'author.age_gte': 30,
        'author.name_like': '李|王'
      });
      
      expect(result.length).to.equal(2);
      expect(result[0].author.name).to.equal('李四');
      expect(result[1].author.name).to.equal('王五');
    });

    it('get 全文检索 _q参数', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'js', author: { name: '张三' }, desc: '编程' },
          { id: 2, title: 'css', author: { name: '李四' }, desc: '设计' },
          { id: 3, title: 'html', author: { name: '王五' }, desc: '标记语言' },
        ],
      });
      // 检索作者
      const result1 = await store.get('book', { _q: '张三' });
      expect(result1.length).to.equal(1);
      expect(result1[0].author.name).to.equal('张三');
      // 检索描述
      const result2 = await store.get('book', { _q: '设计' });
      expect(result2.length).to.equal(1);
      expect(result2[0].desc).to.equal('设计');
      // 检索不存在的内容
      const result3 = await store.get('book', { _q: '不存在' });
      expect(result3.length).to.equal(0);
      // 检索嵌套字段
      const result4 = await store.get('book', { _q: '王五' });
      expect(result4.length).to.equal(1);
      expect(result4[0].author.name).to.equal('王五');
      // 检索英文（不区分大小写）
      const result5 = await store.get('book', { _q: 'HTML' });
      expect(result5.length).to.equal(1);
      expect(result5[0].title).to.equal('html');
    });

    it('get 全文检索 _q参数 - 命中多条', async () => {
      const store = new Store({
        book: [
          { id: 1, title: 'js', author: { name: '张三' }, desc: '编程' },
          { id: 2, title: 'css', author: { name: '李四' }, desc: '设计' },
          { id: 3, title: 'html', author: { name: '王五' }, desc: '标记语言' },
          { id: 4, title: 'js高级', author: { name: '赵六' }, desc: '进阶' },
        ],
      });
      // 检索 'js'，应命中 id=1 和 id=4
      const result = await store.get('book', { _q: 'js' });
      expect(result.length).to.equal(2);
      expect(result.map(b => b.id)).to.include(1).and.include(4);
    });

    it('get posts?_embed=comments', async () => {
      const store = new Store({
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
      const result = await store.get('posts', { _embed: 'comments' });
      expect(result.length).to.equal(2);
      expect(result[0].comments.length).to.equal(2);
      expect(result[1].comments.length).to.equal(1);
      expect(result[0].comments[0].content).to.equal('c1');
      expect(result[1].comments[0].content).to.equal('c3');
    });

    it('get posts/1?_embed=comments', async () => {
      const store = new Store({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postId: 1, content: 'c1' },
          { id: 2, postId: 1, content: 'c2' },
        ],
      });
      const result = await store.get('posts/1', { _embed: 'comments' });
      expect(result.comments.length).to.equal(2);
      expect(result.comments[0].content).to.equal('c1');
    });

    it('get comments?_expand=post', async () => {
      const store = new Store({
        posts: [
          { id: 1, title: 'post1' },
          { id: 2, title: 'post2' },
        ],
        comments: [
          { id: 1, postId: 1, content: 'c1' },
          { id: 2, postId: 2, content: 'c2' },
        ],
      });
      const result = await store.get('comments', { _expand: 'post' });
      expect(result.length).to.equal(2);
      expect(result[0].post.title).to.equal('post1');
      expect(result[1].post.title).to.equal('post2');
    });

    it('get comments/1?_expand=post', async () => {
      const store = new Store({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postId: 1, content: 'c1' },
        ],
      });
      const result = await store.get('comments/1', { _expand: 'post' });
      expect(result.post.title).to.equal('post1');
    });

    it('get posts/1/comments 嵌套资源', async () => {
      const store = new Store({
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
      expect(result.length).to.equal(2);
      expect(result[0].content).to.equal('c1');
      expect(result[1].content).to.equal('c2');
    });

    it('post posts/1/comments 嵌套资源', async () => {
      const store = new Store({
        posts: [
          { id: 1, title: 'post1' },
        ],
        comments: [
          { id: 1, postId: 1, content: 'c1' },
        ],
      });
      const newComment = { content: 'c2' };
      const result = await store.post('posts/1/comments', newComment);
      expect(result.id).to.equal(2);
      expect(result.postId).to.equal(1);
      expect(result.content).to.equal('c2');
      // 验证已插入
      const comments = await store.get('posts/1/comments');
      expect(comments.length).to.equal(2);
      expect(comments[1].content).to.equal('c2');
    });

    it('delete /posts?id=1&id=2 批量删除', async () => {
      const store = new Store({
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
      const store = new Store({ posts: [] });
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
      const store = new Store({
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
      const store = new Store({
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
  describe('Store 拦截器功能', () => {
    let store;
    
    beforeEach(() => {
      store = new Store({
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
}

testStoreBasic(Store);
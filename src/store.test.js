import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from './store';

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
      expect(books.length).toBe(2);
    });

    it('get 详情', async () => {
      const book = await store.get('book/1');
      expect(book).toEqual({ id: 1, title: 'css' });
    });

    it('get 查询', async () => {
      const books = await store.get('book', { title: 'css' });
      expect(books.length).toBe(1);
      expect(books[0].title).toBe('css');
    });

    it('post 新增', async () => {
      await store.post('book', { title: 'html' });
      const books = await store.get('book');
      expect(books.length).toBe(3);
      expect(books[2].title).toBe('html');
    });

    it('put 更新', async () => {
      await store.put('book/1', { title: 'css3' });
      const books = await store.get('book');
      expect(books[0].title).toBe('css3');
    });

    it('delete 删除', async () => {
      await store.delete('book/1');
      const books = await store.get('book');
      expect(books.length).toBe(1);
      expect(books[0].id).toBe(2);
    });
  });
}

testStoreBasic(Store); 
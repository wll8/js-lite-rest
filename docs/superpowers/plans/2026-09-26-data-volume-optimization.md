# 数据量优化（五项）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec（`docs/superpowers/specs/2026-09-26-data-volume-optimization-design.md`）实现五项数据量优化：structuredClone 深拷贝、indent 序列化选项、mtime 跳过 reload、drain-flush 写合并、id 索引。

**Architecture:** 全部改动集中在 `src/store.ts`（Store 写队列 + JsonAdapter）与 `src/store.node.ts`（Node 序列化与指纹缓存）。持久化时机由「写方法内直接 save」改为「标脏 + 写队列排空时统一 flush」；id 查找由线性扫描改为惰性 Map 索引。

**Tech Stack:** TypeScript (ESM)、Rollup、Mocha + Chai、chai-as-promised

## Global Constraints

- 注释、commit message 均为简体中文（近期提交均为中文）
- **所有 git 提交必须先向用户确认 message 后执行（项目规则，覆盖本计划的默认提交步骤）**
- 代码风格：2 空格缩进、单引号、ESM、函数声明优先、@antfu/eslint-config
- 测试命令：`pnpm test`（Node 环境）、`pnpm test:dev:browser`（浏览器/JSDOM 环境）
- 测试需双环境兼容：用 `const isNodeEnv = typeof window === 'undefined'` 区分，浏览器不支持的用例用 `this.skip()`
- 测试辅助模式：`readStored(savePath)`（Node 读文件 / 浏览器读 localforage）、`cleanStorageData` 由 `base.test.js` 注入
- 新公开 API 仅 `StoreOptions.indent` 一个选项；`persist/flush/_autoPersist` 等均为内部实现
- 每个 Task 完成后全量测试必须通过再提交

---

### Task 1: deepClone 深拷贝工具（structuredClone + JSON 回落）

**Files:**
- Modify: `src/store.ts`（模块级工具函数区，`genId` 附近；替换 `get`、`_kvGet`、`getRaw` 三处调用点）
- Test: `test/modules/immutability.test.js`

**Interfaces:**
- Consumes: 无
- Produces: 模块级私有函数 `deepClone<T>(value: T): T`（store.ts 内部使用，不导出）

- [ ] **Step 1: 写回归测试（characterization test）**

在 `test/modules/immutability.test.js` 的 `describe('查询结果不可变性', ...)` 内追加：

```js
    it('含函数字段的数据 get 时不抛错，函数被清洗', async () => {
      const store = await JsLiteRest.create({
        books: [{ id: 1, title: 'a', hook: () => 'x' }],
      });
      const book = await store.get('books/1');
      expect(book.title).to.equal('a');
      expect(book.hook).to.equal(undefined);
    });
```

- [ ] **Step 2: 跑测试确认现状通过**

Run: `pnpm test`
Expected: 全部 PASS（JSON 方式本就静默丢弃函数）。此任务为内部实现替换，测试作为回归防护。

- [ ] **Step 3: 实现 deepClone 并替换三处调用点**

在 `src/store.ts` 的 `function genId()` 之前添加：

```ts
// 深拷贝：优先 structuredClone（快、无字符串中间态），
// 含函数/Symbol 等不可克隆值或环境不支持时回落 JSON 方式（丢弃非常规值）
function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // 回落到 JSON 方式
    }
  }
  return JSON.parse(JSON.stringify(value));
}
```

替换三处调用点（均在 `src/store.ts`）：

1. `JsonAdapter.get` 内：`return JSON.parse(JSON.stringify(result));` → `return deepClone(result);`
2. `Store._kvGet` 内：`return JSON.parse(JSON.stringify(value));` → `return deepClone(value);`
3. `JsonAdapter.getRaw` 内 `_embed/_expand` 的 `filteredData = JSON.parse(JSON.stringify(filteredData));` → `filteredData = deepClone(filteredData);`

- [ ] **Step 4: 跑全量测试**

Run: `pnpm test && pnpm test:dev:browser`
Expected: 全部 PASS

- [ ] **Step 5: 提交（message 需用户确认）**

```bash
git add src/store.ts test/modules/immutability.test.js
git commit -m "perf: 深拷贝改用 structuredClone，JSON 方式兜底"
```

---

### Task 2: indent 序列化选项（Node 默认紧凑）

**Files:**
- Modify: `src/store.ts`（`StoreOptions` 接口加 `indent`）
- Modify: `src/store.node.ts`（`create` 内联闭包 save；删除模块级 `save` 函数）
- Test: `test/modules/persistence.test.js`

**Interfaces:**
- Consumes: 无
- Produces: `StoreOptions.indent?: number`（正数生效，默认 undefined = 紧凑）；Task 3 会在同一位置改写 load/save 闭包

- [ ] **Step 1: 写失败测试**

在 `test/modules/persistence.test.js` 的 `describe('文件持久化', ...)` 内追加：

```js
    it('Node 默认落盘为紧凑 JSON，indent 选项恢复缩进', async function () {
      if (!isNodeEnv) this.skip();

      const compactStore = await JsLiteRest.create('test-indent-compact.json');
      await compactStore.post('book', { title: 'js' });
      const compactContent = fs.readFileSync('test-indent-compact.json', 'utf-8');
      expect(compactContent).to.equal(JSON.stringify(JSON.parse(compactContent)));
      await cleanStorageData('test-indent-compact.json');

      const prettyStore = await JsLiteRest.create('test-indent-pretty.json', { indent: 2 });
      await prettyStore.post('book', { title: 'css' });
      const prettyContent = fs.readFileSync('test-indent-pretty.json', 'utf-8');
      expect(prettyContent).to.equal(JSON.stringify(JSON.parse(prettyContent), null, 2));
      await cleanStorageData('test-indent-pretty.json');
    });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test`
Expected: FAIL（现状默认缩进，compactContent 断言不匹配）

- [ ] **Step 3: 实现**

`src/store.ts` 的 `StoreOptions` 接口加字段（`overwrite` 之后）：

```ts
  // Node 文件序列化缩进：默认紧凑；设置正数（如 2）恢复缩进格式
  indent?: number;
```

`src/store.node.ts`：删除模块级 `save` 函数，`create` 改为：

```ts
// 创建函数
async function create<T extends DataSchema = DataSchema>(
  data: T | string = {} as T,
  opt: Partial<StoreOptions> = {}
): Promise<Store<T>> {
  // 序列化缩进：默认紧凑，indent 为正数时启用
  const indent = typeof opt.indent === 'number' && opt.indent > 0 ? opt.indent : undefined;
  const mergedOpt = {
    load,
    save: (key: string, d: any) => fs.writeFile(key, JSON.stringify(d, null, indent), 'utf-8'),
    ...opt,
  };
  // 暂以 any 兼容 Store.create 现有签名；稍后将把 Store.create 的 data 参数改为 T | string
  const store = await Store.create<T>(data as any, mergedOpt);
  store.use(interceptor.lite);
  return store;
}
```

注意：`...opt` 在最后，用户自定义 `save` 仍可覆盖默认（此时 `indent` 不生效，符合约定）。

- [ ] **Step 4: 跑全量测试**

Run: `pnpm test && pnpm test:dev:browser`
Expected: 全部 PASS

- [ ] **Step 5: 提交（message 需用户确认）**

```bash
git add src/store.ts src/store.node.ts test/modules/persistence.test.js
git commit -m "perf: Node 端默认紧凑序列化，新增 indent 选项"
```

---

### Task 3: mtime 指纹跳过 reload（仅 Node）

**Files:**
- Modify: `src/store.node.ts`（`create` 内 per-instance 闭包重写 `load`；`save` 闭包内更新指纹）
- Test: `test/modules/sync.test.js`

**Interfaces:**
- Consumes: Task 2 的 `create` 内联闭包结构（本任务在其上加指纹缓存）
- Produces: 无新公开接口；行为不变、性能提升

- [ ] **Step 1: 写回归测试**

在 `test/modules/sync.test.js` 的 `describe('写前重读（防止丢失更新）', ...)` 内追加：

```js
      it('save 后的指纹缓存不漏检外部直写', async () => {
        const store = await JsLiteRest.create(TEST_KEY);
        await store.post('books', { title: '本页写入' });

        // 模拟其他标签页直写存储后，本页继续写，外部修改必须保留
        await applyExternalChange(TEST_KEY, (data) => {
          data.logs = [{ id: 'ext-1', text: '外部写入' }];
        });

        await store.post('users', { name: 'Alice' });

        const stored = await readStored(TEST_KEY);
        expect(stored.logs).to.have.lengthOf(1);
        expect(stored.users).to.have.lengthOf(1);
      });
```

- [ ] **Step 2: 跑测试确认现状通过（characterization）**

Run: `pnpm test`
Expected: 全部 PASS

- [ ] **Step 3: 实现**

`src/store.node.ts`：删除模块级 `load` 函数，`create` 的 `mergedOpt` 改为（每实例独立缓存，避免多实例共享内存引用互相污染）：

```ts
  // 每实例独立的文件指纹缓存：save 后记忆 mtime+size，load 时未变化直接
  // 返回缓存引用，跳过读盘与 JSON.parse。放 create 闭包内，多实例互不影响；
  // 外部直写文件会导致指纹变化而正常重读
  const stampCache = new Map<string, { stamp: string; data: any }>();
  const readStamp = (stat: { mtimeMs: number; size: number }) => `${stat.mtimeMs}:${stat.size}`;

  const mergedOpt = {
    load: async (key: string) => {
      if (!existsSync(key)) {
        await fs.writeFile(key, '{}', 'utf-8');
      }
      const stat = await fs.stat(key);
      const stamp = readStamp(stat);
      const cached = stampCache.get(key);
      if (cached && cached.stamp === stamp) {
        return cached.data;
      }
      const parsed = JSON.parse(await fs.readFile(key, 'utf-8'));
      stampCache.set(key, { stamp, data: parsed });
      return parsed;
    },
    save: async (key: string, d: any) => {
      await fs.writeFile(key, JSON.stringify(d, null, indent), 'utf-8');
      // 落盘后更新指纹，使下一次 load 能命中缓存
      const stat = await fs.stat(key);
      stampCache.set(key, { stamp: readStamp(stat), data: d });
    },
    ...opt,
  };
```

注意：用户通过 `...opt` 覆盖 `load/save` 时不经过缓存，行为与现状一致。

- [ ] **Step 4: 跑全量测试（重点观察 sync.test.js 全部用例）**

Run: `pnpm test && pnpm test:dev:browser`
Expected: 全部 PASS（sync.test.js 的 `applyExternalChange` 直写场景是指纹机制的回归防护）

- [ ] **Step 5: 提交（message 需用户确认）**

```bash
git add src/store.node.ts test/modules/sync.test.js
git commit -m "perf: Node 端 save 后记忆文件指纹，reload 未变化时跳过读盘"
```

---

### Task 4: drain-flush 写合并

**Files:**
- Modify: `src/store.ts`（JsonAdapter 加 `persist/flush/_dirty/_autoPersist`；9 处写方法 `await this.save()` → `await this.persist()`；Store 加 `_pendingCount`、`_flushDirty`、`_persistAdapter`；`_enqueue` 加排空检查；`_initialize` 接管 `_autoPersist`；`_kvSet/_kvDelete` 落盘点改 `_persistAdapter`）
- Test: `test/modules/concurrency.test.js`

**Interfaces:**
- Consumes: 无
- Produces: `JsonAdapter.persist(): Promise<void>`（写方法持久化入口）、`JsonAdapter.flush(): Promise<void>`（Store 排空时调用）、`JsonAdapter._autoPersist: boolean`（Store 接管标志）；Task 5 依赖 Task 4 改造后的写方法结构

- [ ] **Step 1: 写失败测试**

在 `test/modules/concurrency.test.js` 追加（`readStored`、`isNodeEnv` 已在该文件定义）：

```js
    // 带落盘计数的自定义 save（供落盘次数断言使用）
    function createWithCountingSave(savePath, onSave) {
      return JsLiteRest.create(savePath, {
        save: async (key, data) => {
          onSave();
          if (isNodeEnv) {
            await fs.promises.writeFile(key, JSON.stringify(data), 'utf-8');
          } else {
            await JsLiteRest.lib.localforage.setItem(key, data);
          }
        },
      });
    }

    it('并发批量写合并为一次落盘', async () => {
      let saveCount = 0;
      const store = await createWithCountingSave(TEST_KEY, () => saveCount++);
      const total = 50;
      await Promise.all(
        Array.from({ length: total }, (_, i) => store.post('users', { name: `u-${i}` }))
      );
      expect(saveCount).to.equal(1);
      const stored = await readStored(TEST_KEY);
      expect(stored.users).to.have.lengthOf(total);
    });

    it('串行单发写每笔落盘一次且 await 返回时已落盘', async () => {
      let saveCount = 0;
      const store = await createWithCountingSave(TEST_KEY, () => saveCount++);
      await store.post('users', { name: 'a' });
      await store.post('users', { name: 'b' });
      expect(saveCount).to.equal(2);
      const stored = await readStored(TEST_KEY);
      expect(stored.users.map(u => u.name)).to.deep.equal(['a', 'b']);
    });

    it('落盘失败后由后续写任务补落', async () => {
      let failFirst = true;
      const store = await JsLiteRest.create(TEST_KEY, {
        save: async (key, data) => {
          if (failFirst) {
            failFirst = false;
            throw new Error('落盘失败');
          }
          if (isNodeEnv) {
            await fs.promises.writeFile(key, JSON.stringify(data), 'utf-8');
          } else {
            await JsLiteRest.lib.localforage.setItem(key, data);
          }
        },
      });
      await expect(store.post('users', { name: 'a' })).to.be.rejected;
      await store.post('users', { name: 'b' });
      const stored = await readStored(TEST_KEY);
      expect(stored.users.map(u => u.name)).to.include('b');
    });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test`
Expected: FAIL（「合并为一次落盘」断言 saveCount=1，现状为 50）

- [ ] **Step 3: 实现 JsonAdapter 侧**

`src/store.ts` 的 `JsonAdapter` 类：

字段（`data: T;` 之后）：

```ts
  // 待落盘标志与自动落盘开关：独立使用 JsonAdapter 时直接落盘；
  // 经 Store 创建后由写队列接管持久化时机（排空时统一 flush）
  _dirty = false;
  _autoPersist = true;
```

新方法（`save` 方法之后）：

```ts
  // 写方法内的持久化入口：自动模式直接落盘（独立使用 JsonAdapter），受管模式仅标脏
  async persist(): Promise<void> {
    if (this._autoPersist) {
      await this.save();
      return;
    }
    this._dirty = true;
  }

  // Store 在写队列排空时调用：有待落盘修改才真正落盘
  async flush(): Promise<void> {
    if (!this._dirty) return;
    this._dirty = false;
    try {
      await this.save();
    } catch (error) {
      // 落盘失败恢复标志，由后续写任务的排空检查重试
      this._dirty = true;
      throw error;
    }
  }
```

替换 `JsonAdapter` 各写方法内的 `await this.save();` → `await this.persist();`，共 9 处：`post`（批量、嵌套、普通）、`put`（批量、普通）、`delete`（批量、普通）、`patch`（批量、普通）。

- [ ] **Step 4: 实现 Store 侧**

`src/store.ts` 的 `Store` 类：

字段（`_writeQueue` 声明之后）：

```ts
  // 写队列排队计数：任务收尾时为 1 表示队列即将排空，执行统一落盘
  private _pendingCount = 0;
```

`_enqueue` 方法整体替换为：

```ts
  // 将任务加入写队列串行执行：同一实例的写操作按发起顺序依次完成，
  // 保证"重读→修改→保存"全程不被其他写操作或外部同步打断。
  // 注意：任务内不要调用本实例的其他写方法（会排队等待自身，造成死锁）。
  private _enqueue<R>(task: () => Promise<R>): Promise<R> {
    this._pendingCount++;
    const run = this._writeQueue.then(async () => {
      try {
        const result = await task();
        // 队列排空时统一落盘：同一事件循环内的并发写合并为一次 I/O
        if (this._pendingCount === 1) {
          await this._flushDirty();
        }
        return result;
      } finally {
        this._pendingCount--;
      }
    });
    // 队尾只追踪完成状态：前序任务失败不阻塞后续任务
    this._writeQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  // 将待落盘修改写入存储：仅在适配器支持 flush（受管 JsonAdapter）时生效
  private async _flushDirty(): Promise<void> {
    const adapter = this.opt.adapter as any;
    if (typeof adapter?.flush !== 'function') return;
    await adapter.flush();
  }

  // 请求适配器持久化：受管 JsonAdapter 仅标脏，其他适配器直接 save
  private async _persistAdapter(): Promise<void> {
    const adapter: any = this.opt.adapter;
    if (typeof adapter?.persist === 'function') {
      await adapter.persist();
    } else {
      await adapter?.save();
    }
  }
```

`_initialize` 中 `this.opt.adapter = this.opt.adapter || new JsonAdapter<T>(finalData as T, this.opt);` 之后添加：

```ts
    // 写队列接管持久化时机：由排空时统一 flush，并发批量写合并为一次落盘
    if (this.opt.adapter instanceof JsonAdapter) {
      this.opt.adapter._autoPersist = false;
    }
```

`_kvSet` 内 `await this.opt.adapter!.save();` → `await this._persistAdapter();`
`_kvDelete` 内 `await this.opt.adapter!.save();` → `await this._persistAdapter();`

注意保持不变的部分：`_initialize` 的初始保存仍是 `await this.opt.adapter.save()`（直接落盘，不在队列中）；`_syncFromExternal` 不产生写、无需改动。

- [ ] **Step 5: 跑全量测试**

Run: `pnpm test && pnpm test:dev:browser`
Expected: 全部 PASS（重点：concurrency.test.js 既有 6 个用例与新 3 个、persistence、sync）

- [ ] **Step 6: 提交（message 需用户确认）**

```bash
git add src/store.ts test/modules/concurrency.test.js
git commit -m "perf: 写队列排空时统一落盘，并发批量写合并为一次 I/O"
```

---

### Task 5: id 索引（顶层表 Map 索引）

**Files:**
- Modify: `src/store.ts`（JsonAdapter 加索引字段与 4 个私有方法；`reload` 失效索引；`getRaw`/`put`/`patch`/`delete` 的查找点替换；写方法增量维护）
- Test: 新建 `test/modules/perf-index.test.js`

**Interfaces:**
- Consumes: Task 4 改造后的 `JsonAdapter` 写方法结构（`persist` 调用点）
- Produces: 无新公开接口

- [ ] **Step 1: 写测试（新建文件）**

创建 `test/modules/perf-index.test.js`：

```js
import chai from 'chai';
const expect = chai.expect;

import fs from 'fs';

function fn({ JsLiteRest, cleanStorageData }) {
  const isNodeEnv = typeof window === 'undefined';

  async function readStored(savePath) {
    if (isNodeEnv) {
      return JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    }
    return await JsLiteRest.lib.localforage.getItem(savePath);
  }

  describe('id 索引正确性', function () {
    this.timeout(10000);

    const TEST_KEY = 'test-perf-index';

    afterEach(async () => {
      await cleanStorageData(TEST_KEY);
    });

    it('2000 条规模下按 id 读写删结果与线性查找一致', async () => {
      const total = 2000;
      const seed = Array.from({ length: total }, (_, i) => ({ id: i + 1, title: `t-${i}`, group: i % 7 }));
      // 初始数据对象 + overwrite，直接以大数据集建库（逐条 post 太慢）
      const store = await JsLiteRest.create({ books: seed }, { savePath: TEST_KEY, overwrite: true });
      // 按 id 读
      for (const id of [1, 500, 1000, 2000]) {
        const book = await store.get(`books/${id}`);
        expect(book).to.not.equal(null);
        expect(book.id).to.equal(id);
      }
      expect(await store.get('books/99999')).to.equal(null);

      // patch 后读回
      await store.patch('books/500', { title: 'patched' });
      const patched = await store.get('books/500');
      expect(patched.title).to.equal('patched');
      expect(patched.group).to.equal(500 % 7);

      // delete 后读不到，其余仍在
      await store.delete('books/1000');
      expect(await store.get('books/1000')).to.equal(null);
      const rest = await store.get('books');
      expect(rest).to.have.lengthOf(total - 1);

      // 落盘内容与内存一致
      const stored = await readStored(TEST_KEY);
      expect(stored.books).to.have.lengthOf(total - 1);
    });

    it('重复 id 的记录取第一个（与 findIndex 语义一致）', async () => {
      // 原始 Store 类内存模式，注入重复 id 数据
      const raw = await JsLiteRest.Store.create(
        { dup: [{ id: 'x', tag: 1 }, { id: 'x', tag: 2 }] }
      );
      const hit = await raw.get('dup/x');
      expect(hit.tag).to.equal(1);
      await raw.delete('dup/x');
      const rest = await raw.get('dup');
      expect(rest).to.have.lengthOf(1);
      expect(rest[0].tag).to.equal(2);
    });

    it('数字 id 与字符串路径互查', async () => {
      const raw = await JsLiteRest.Store.create(
        { nums: [{ id: 42, v: 'a' }] }
      );
      const hit = await raw.get('nums/42');
      expect(hit.v).to.equal('a');
    });

    it('外部直写存储后索引重建，本地写不串数据', async () => {
      const store = await JsLiteRest.create(TEST_KEY);
      const book = await store.post('books', { title: 'a' });
      // 外部新增一条记录（绕过本实例索引）
      if (isNodeEnv) {
        const data = JSON.parse(fs.readFileSync(TEST_KEY, 'utf-8'));
        data.books.push({ id: 'ext-1', title: 'ext' });
        fs.writeFileSync(TEST_KEY, JSON.stringify(data), 'utf-8');
      } else {
        const data = await JsLiteRest.lib.localforage.getItem(TEST_KEY);
        data.books.push({ id: 'ext-1', title: 'ext' });
        await JsLiteRest.lib.localforage.setItem(TEST_KEY, data);
      }
      // 本地修改外部新增的记录，写前重读 + 索引重建后应命中
      await store.patch('books/ext-1', { title: 'ext-patched' });
      const stored = await readStored(TEST_KEY);
      const ext = stored.books.find(b => b.id === 'ext-1');
      expect(ext.title).to.equal('ext-patched');
      expect(stored.books.find(b => String(b.id) === String(book.id)).title).to.equal('a');
    });
  });
}

export default fn;
```

注意：`perf-index.test.js` 需在 `test/base.test.js` 注册（`import` + `testMain` 内调用），与其他模块一致。

- [ ] **Step 2: 注册并跑测试确认失败**

`test/base.test.js` 追加导入与调用（`sync` 之后）：

```js
import perfIndex from './modules/perf-index.test.js';
```

```js
  perfIndex({ JsLiteRest, cleanStorageData });
```

Run: `pnpm test`
Expected: 全部 PASS（本任务为内部实现替换，测试先行作为 characterization 基线——线性查找下这些用例本就应通过；实现索引后再次运行确认行为不变）

- [ ] **Step 3: 实现**

`src/store.ts` 的 `JsonAdapter` 类：

字段（`_autoPersist` 之后）：

```ts
  // 顶层表 id 索引：表名 -> (String(id) -> 记录引用)；reload 整体失效，惰性重建
  _idIndex: Map<string, Map<string, any>> = new Map();
```

私有方法（`getRelationKey` 之后）：

```ts
  // 顶层表的 id 索引：惰性构建，重复 id 取第一个（与 findIndex 语义一致）
  private getTopIndex(table: string): Map<string, any> | null {
    const arr = this.data[table];
    if (!Array.isArray(arr)) return null;
    let index = this._idIndex.get(table);
    if (!index) {
      index = new Map();
      for (const item of arr) {
        const key = String(item?.id);
        if (!index.has(key)) index.set(key, item);
      }
      this._idIndex.set(table, index);
    }
    return index;
  }

  // 顶层表按 id 查记录：索引命中 O(1)，非顶层/未建索引回退线性查找
  private findItemById(table: string, id: string): any {
    const arr = this.data[table];
    if (!Array.isArray(arr)) return undefined;
    const index = this.getTopIndex(table);
    if (index) {
      const key = String(id);
      return index.has(key) ? index.get(key) : undefined;
    }
    return arr.find((item: any) => String(item.id) === String(id));
  }

  // 数组中按 id 定位下标：顶层表走索引（引用反查位置），嵌套数组回退线性查找
  private findIndexById(table: string, arr: any[], id: any): number {
    if (arr === this.data[table]) {
      const index = this.getTopIndex(table);
      if (index) {
        const item = index.get(String(id));
        return item ? arr.indexOf(item) : -1;
      }
    }
    return arr.findIndex((item: any) => String(item.id) === String(id));
  }

  // 顶层表记录变更后同步索引（未构建时不动作，留待惰性重建）
  private indexSet(table: string, item: any): void {
    const index = this._idIndex.get(table);
    if (index) index.set(String(item?.id), item);
  }

  private indexDelete(table: string, id: any): void {
    const index = this._idIndex.get(table);
    if (index) index.delete(String(id));
  }
```

`reload` 方法内在 `this.data = latest;` 之后添加：

```ts
        // 内存数据整体替换，已构建的 id 索引全部失效
        this._idIndex.clear();
```

查找点替换（全部在 `src/store.ts`）：

1. `getRaw` 主循环中段：按 id 的 `find` 发生在「上层结果为数组」的段。以数组身份比较区分顶层表与嵌套数组，仅顶层表走索引。将循环内：

```ts
      } else if (Array.isArray(cur)) {
        cur = cur.find((item: any) => String(item.id) === seg);
      } else {
```

改为：

```ts
      } else if (Array.isArray(cur)) {
        // 顶层表按 id 走索引，嵌套数组保持线性查找
        if (cur === this.data[segs[0]]) {
          const hit = this.findItemById(segs[0], seg);
          cur = hit === undefined ? null : hit;
        } else {
          cur = cur.find((item: any) => String(item.id) === seg);
        }
      } else {
```

2. `put` 单条：`const idx = cur.findIndex((item: any) => String(item.id) === key);` → `const idx = this.findIndexById(segs[0], cur, key);`；成功替换后 `cur[idx] = { ...cur[idx], ...data };` 之后加 `this.indexSet(segs[0], cur[idx]);`

3. `patch` 单条：同 `put`（查找替换 + `indexSet`）

4. `delete` 单条：`const idx = cur.findIndex((item: any) => String(item.id) === key);` → `const idx = this.findIndexById(segs[0], cur, key);`；`const del = cur.splice(idx, 1)[0];` 之后加 `this.indexDelete(segs[0], del.id);`

5. `put` 批量：`const idx = arr.findIndex((x: any) => String(x.id) === String(item.id));` → `const idx = this.findIndexById(segs[0], arr, item.id);`；`arr[idx] = { ...arr[idx], ...item };` 之后加 `this.indexSet(segs[0], arr[idx]);`

6. `patch` 批量：同 `put` 批量（查找替换 + `indexSet`）

7. `delete` 批量：`const idx = arr.findIndex((item: any) => String(item.id) === String(id));` → `const idx = this.findIndexById(segs[0], arr, id);`；`const del = arr.splice(idx, 1)[0];` 之后加 `this.indexDelete(segs[0], del.id);`

8. `post` 批量：`arr.push(newItem);` 之后加 `this.indexSet(segs[0], newItem);`

9. `post` 单条：`cur[key].push(data);` 之后加 `this.indexSet(segs[0], data);`

10. `post` 嵌套：`arr.push(newData);` 之后加 `this.indexSet(segs[2], newData);`

- [ ] **Step 4: 跑全量测试**

Run: `pnpm test && pnpm test:dev:browser`
Expected: 全部 PASS（重点：perf-index 4 个用例、basic/operations/batch 既有 CRUD 用例、sync 重读用例）

- [ ] **Step 5: 提交（message 需用户确认）**

```bash
git add src/store.ts test/modules/perf-index.test.js test/base.test.js
git commit -m "perf: 顶层表 id 索引，按 id 读取 O(1)，写操作引用定位"
```

---

### Task 6: 文档更新与构建收尾

**Files:**
- Modify: `docs/api/create-store.md`（选项章节加 `indent`）
- Modify: `docs/superpowers/specs/2026-09-26-data-volume-optimization-design.md`（补记一处实现发现，见 Step 1）

**Interfaces:**
- Consumes: Task 1–5 的全部产出
- Produces: 文档与构建产物验证

- [ ] **Step 1: spec 补记**

spec「五项设计 → ③ id 索引」小节末尾追加一行，修正性能预期（实现发现：数组保序约束下 splice/替换需引用反查位置，写路径为常数级优化而非严格 O(1)）：

```markdown
- 性能修正：按 id 读为 O(1)；put/patch/delete 因数组保序需 `indexOf` 引用反查位置，为常数级优化（引用比较快于逐条 String 转换），非严格 O(1)
```

- [ ] **Step 2: 更新 create-store 文档**

在 `docs/api/create-store.md` 的 `### overwrite` 小节之后追加：

````markdown
### indent

Node.js 环境下 JSON 文件的序列化缩进。默认紧凑格式（体积更小）；设置为正整数可恢复缩进，便于手工阅读与 diff。

``` js
const store = await JsLiteRest.create('./data/db.json', {
  indent: 2, // 落盘文件带 2 空格缩进
})
```

> 浏览器端（localforage）存储的是对象本身，此选项不生效。
>
> 并发说明：同一事件循环内的多次并发写（如 `Promise.all` 批量导入）会合并为一次落盘；批次全部完成后数据必定已写入存储，批次中单个写请求返回时可能尚未落盘（毫秒级窗口）。串行写每次都立即落盘。
````

- [ ] **Step 3: 构建与产物测试**

Run: `pnpm build && pnpm typecheck && pnpm test:build && pnpm test:build:browser`
Expected: 构建成功，全部 PASS

- [ ] **Step 4: 提交（message 需用户确认）**

```bash
git add docs/api/create-store.md docs/superpowers/specs/2026-09-26-data-volume-optimization-design.md
git commit -m "docs: 补充 indent 选项与并发落盘语义说明"
```

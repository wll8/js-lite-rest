# 数据量优化设计（五项）

- 日期：2026-09-26
- 状态：已评审（设计阶段）
- 范围：存储体积与数据量增长场景下的性能优化，共 5 项；不含分表存储（第 6 项）与乐观锁

## 背景与目标

js-lite-rest 当前每次写操作 = 全量 `JSON.parse`（写前 reload）+ 全量 `JSON.stringify`（落盘），查询为线性扫描，`get` 出口用 `JSON.parse(JSON.stringify())` 深拷贝。数据量增长时写放大呈 O(全库) 级。本设计在不改变库「lite」定位（纯前端、零依赖、单文件）的前提下降低存储体积与高频写 I/O。

## 范围决策记录

| 项 | 决策 | 理由 |
|---|---|---|
| 分表存储（原第 6 项） | 不做 | 结构级改动大，等前置项收益验证后再议 |
| 乐观锁 | 不做 | 同实例竞态已由写队列覆盖；多标签页窗口已极小；文件存储无原子 CAS，完整实现需写后校验+重放，成本高、API 破坏性强。mtime 指纹是其前置基础设施，将来需要时在此基础上扩展 |
| 写合并语义 | drain-flush（写队列排空时落盘） | 原方案「微任务窗口合并 + flush()」会破坏 await 落盘语义且存在过早 flush 落旧快照的坑；drain-flush 在保住「单发写 await 返回 = 已落盘」的同时，把并发批量写 I/O 从 N 次并为 1 次 |
| 序列化默认值 | 默认紧凑，`opt.indent` 开缩进 | 体积收益全量用户享受；已确认接受落盘格式变化（仅格式，`JSON.parse` 无感知） |

## 五项设计

### ① 紧凑序列化（`StoreOptions.indent`）

- 新增 `opt.indent?: number`，默认 `undefined`（紧凑）；传正数（如 `2`）恢复缩进
- 落点：`src/store.node.ts` 的 `create` 内基于 opt 生成闭包 save：`JSON.stringify(data, null, indent)`；`JsonAdapter`/`Store` 核心零改动
- 浏览器端 localforage 存对象，不受影响
- `indent` 宽松处理：非正数回退紧凑，不报错

### ② drain-flush 写合并

- `JsonAdapter` 各写方法（post/put/patch/delete 及批量）内的 `await this.save()` 改为标记脏（`_dirty = true`），不再直接落盘
- 排空检查统一下沉到 `Store._enqueue` 的写任务包装层（`_request` 写路径与 `_kvSet/_kvDelete` 走同一包装，覆盖 kv 写）：任务成功收尾处检查——队列只剩自己且 `_dirty` → `await adapter.save()` 落盘一次并清脏标志；仍有排队任务 → 跳过
- 任务失败时脏标志保持、由后续写任务的排空检查补落（失败请求的数据不保证落盘，与现状一致）
- 落盘失败保持标志并照常 reject（下一个写任务的排空检查自然重试）
- `_flushDirty` 只调 `adapter.save()`，自定义适配器同样获得合并
- `_initialize` 的初始保存保持直接落盘（不在写队列中）
- 404 路径（put/delete 未命中）不标脏、不落盘
- 内存模式（无 load/save）：`save()` 为 no-op，标脏后落盘清标志，无害
- 不提供 `flush()` API——语义上不需要

### ③ id 索引（`JsonAdapter` 内部）

- 按表惰性维护 `Map<String(id), item>`；`reload` 替换 `data` 后整体标脏，下次访问 O(n) 重建一次
- 替换点：`getRaw` 路径中段按 id 的 `find`；`put/patch/delete`（含批量）的 `findIndex`
- 增量维护：post push 后 `set`；put/patch 替换后 `set` 新引用；delete splice 后 `delete`——批量循环内增量更新，不反复重建
- 重复 id 保持「取第一个」，与现有 `findIndex` 语义一致；键统一 `String(id)`，兼容 `1` 与 `'1'`
- 只覆盖顶层表（`info.getTables()` 认可的顶层数组）；`books[1].comments` 等嵌套路径的按 id 查找保持线性扫描
- 性能修正：按 id 读为 O(1)；put/patch/delete 因数组保序需 `indexOf` 引用反查位置，为常数级优化（引用比较快于逐条 String 转换），非严格 O(1)

### ④ mtime 跳过 reload（仅 Node 端）

- 全部封装在 `src/store.node.ts` 的 `load`/`save` 闭包内：
  - `save` 完成后 `stat` 记忆指纹 `mtimeMs:size` 并缓存本次数据引用
  - `load` 时比对指纹：未变化直接返回缓存引用（零读盘、零 parse）；变化则真读
- 外部直写文件 → 指纹变化 → 正常重读，现有「写前重读防丢失更新」机制与测试不受影响
- 多实例同文件：各实例独立记忆，他人写入导致指纹变化即重读
- 低精度文件系统（FAT 秒级 mtime）理论漏检窗口 = 「外部写入且文件大小完全相同」，注释披露，不做轮询
- `JsonAdapter`/`Store` 零改动；自定义 `load/save` 不经过此路径，无影响
- 浏览器端不做：localforage 存对象无 parse 成本，且版本号方案会破坏「外部直写存储」的变更检测（现有测试依赖）

### ⑤ structuredClone 深拷贝

- 新增 `deepClone()` 工具：优先 `structuredClone`，try-catch 回落 `JSON.parse(JSON.stringify())`（兜住含函数/Symbol 的非常规数据与旧环境）
- 替换点：`JsonAdapter.get` 出口、`Store._kvGet`、`getRaw` 中 `_embed/_expand` 的数据副本

## 语义变化披露

1. 默认落盘格式从缩进变紧凑（仅格式差异，读取无感知）
2. 并发批次（如 `Promise.all` 多个写）中，除最后一个外，单个请求 resolve 时数据可能尚未落盘，窗口 = 同批次剩余任务的执行时间（毫秒级）；批次整体完成（`Promise.all` resolve）时必定已落盘；单发串行写语义完全不变

除上述两点外，API、数据格式、持久化时机均无变化。新增公开面仅 `StoreOptions.indent` 一个选项。

## 测试计划

| 域 | 文件 | 用例 |
|---|---|---|
| 序列化 | `test/modules/persistence.test.js` | 默认落盘为紧凑格式（文件内容 === `JSON.stringify(obj)`）；`indent: 2` 恢复缩进 |
| drain-flush | `test/modules/concurrency.test.js` | 自定义 save 计数：50 并发 post 恰好 1 次落盘；串行单发每笔 1 次；`Promise.all` 完成后读文件全量在；单发 `await` 后立即可读文件 |
| id 索引 | 新建 `test/modules/perf-index.test.js` | 2000 条规模下 get/put/patch/delete 结果与线性查找对拍一致；重复 id 取第一个；外部改文件后本地写仍正确（覆盖索引重建路径） |
| mtime 跳过 | 已有 `test/modules/sync.test.js` 回归 + 补充 | 外部直写文件（`applyExternalChange`）→ 指纹变化 → 写前重读照常生效；同实例连续写正确性 |
| structuredClone | `test/modules/immutability.test.js` | get 返回深拷贝（已有）；含函数字段的数据 fallback 不抛错、函数被清洗 |

## 实施顺序

⑤ structuredClone → ① 紧凑序列化 → ④ mtime → ② drain-flush → ③ id 索引

前三项彼此独立、改动局部；后两项均动写路径且 ③ 依赖 ② 改造后的方法结构。每步跑全量双环境测试（`pnpm test`、`pnpm test:dev:browser`），收尾 `pnpm build` + `pnpm test:build` + `pnpm test:build:browser`。

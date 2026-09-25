# 多标签页同步

浏览器中同一页面的多个标签页各自持有独立的内存数据副本，一个标签页写入后，其他标签页可能读到旧数据，甚至在下一次写入时覆盖外部修改。js-lite-rest 通过**写前重读**与 **BroadcastChannel 广播**解决这一问题。

## 工作机制

1. **写前重读**：每次写操作（`post` / `put` / `patch` / `delete` / `kv.set` / `kv.delete`）执行前，先从存储加载最新数据，在其上应用变更后保存，避免覆盖其他标签页的修改。
2. **变更广播**：写操作完成后通过 `BroadcastChannel` 通知其他标签页。
3. **自动刷新**：其他标签页收到通知后重新加载存储数据，替换内存副本，并触发 `onChange` 回调。

```
标签页 A 写操作:
  重读最新数据 → 应用变更 → 保存 → 广播变更
                                        ↓
标签页 B:  收到通知 → 重读存储刷新内存 → 触发 onChange 回调
```

> 该机制默认开启，无需额外配置。`BroadcastChannel` 不可用的环境会自动降级为仅写前重读（仍能防止丢失更新）。Node.js 环境下写前重读同样生效，可防止多进程写入同一 JSON 文件时互相覆盖。

## onChange() - 监听数据变更

当存储中的数据被外部（其他标签页）修改并同步到当前实例时触发。

```javascript
const store = await JsLiteRest.create();

// 监听外部变更，适合在此刷新界面
const unsubscribe = store.onChange((info) => {
  console.log('数据已被其他标签页更新', info); // { source: 'external' }
  renderList();
});
```

### 参数

**callback** `(info?: { source: string }) => void`

- `info.source`：变更来源，当前为 `'external'`（外部标签页写入）。

### 返回值

返回一个取消监听函数，调用后不再接收通知。

```javascript
const unsubscribe = store.onChange((info) => { /* ... */ });

// 不再需要监听时
unsubscribe();
```

## 使用示例

两个标签页操作同一份数据：

```javascript
// 标签页 B：监听变更并刷新列表
const storeB = await JsLiteRest.create();
storeB.onChange(() => renderBooks(await storeB.get('books')));

// 标签页 A：写入数据
const storeA = await JsLiteRest.create();
await storeA.post('books', { title: '来自标签页 A 的书' });
// 标签页 B 会自动感知并触发 onChange，无需手动刷新
```

## 边界说明

- `onChange` 仅在外部变更同步时触发，当前标签页自己的写操作不会触发。
- 写前重读消除了绝大部分丢失更新，但两个标签页**同一毫秒内并发写入**仍存在极小的竞态窗口；如需严格的写入串行化，可在业务层配合 [Web Locks API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Locks_API) 使用。
- 自定义适配器如未实现可选的 `reload()` 方法，将自动跳过写前重读，行为与旧版本一致。

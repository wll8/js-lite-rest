# js-lite-rest 导入测试

本目录包含对 js-lite-rest 各种环境和格式的导入测试。

## 测试概览

所有测试已通过 ✅

| 环境 | 格式 | 测试文件 | 状态 |
|------|------|----------|------|
| Node.js | CommonJS (.cjs) | `test-cjs.cjs` | ✅ 通过 |
| Node.js | ES Module (.mjs) | `test-esm.mjs` | ✅ 通过 |
| 浏览器 | ES Module | `test-browser-esm.html` | ✅ 通过 |
| 浏览器 | UMD | `test-browser-umd.html` | ✅ 通过 |

## 运行测试

### Node.js 环境测试

```bash
# CommonJS 测试
node test/import-tests/test-cjs.cjs

# ES Module 测试
node test/import-tests/test-esm.mjs
```

### 浏览器环境测试

浏览器测试需要启动本地服务器（因为 ES Module 需要 HTTP 协议）：

```bash
# 启动测试服务器
node test/import-tests/server.mjs
```

然后在浏览器中访问：
- ES Module 测试: http://localhost:3456/test/import-tests/test-browser-esm.html
- UMD 测试: http://localhost:3456/test/import-tests/test-browser-umd.html

## 测试内容

每个测试都验证以下功能：

### CommonJS 测试 (test-cjs.cjs)
- ✅ require() 导入成功
- ✅ JsLiteRest.create 方法存在
- ✅ 创建 store 实例
- ✅ GET 操作
- ✅ POST 操作
- ✅ 数据持久化
- ✅ 数据清理

### ES Module 测试 (test-esm.mjs)
- ✅ ES Module import 成功
- ✅ JsLiteRest.create 方法存在
- ✅ 创建 store 实例
- ✅ GET 操作
- ✅ PUT 操作
- ✅ DELETE 操作
- ✅ 数据验证
- ✅ 数据清理

### 浏览器 ESM 测试 (test-browser-esm.html)
- ✅ 动态 import 成功
- ✅ JsLiteRest.create 方法存在
- ✅ JsLiteRest.lib.localforage 存在
- ✅ 创建 store 实例
- ✅ GET 操作
- ✅ PATCH 操作
- ✅ 数据验证
- ✅ 数据清理（localforage）

### UMD 测试 (test-browser-umd.html)
- ✅ UMD 全局对象 JsLiteRest 存在
- ✅ JsLiteRest.create 方法存在
- ✅ JsLiteRest.lib.localforage 存在
- ✅ 创建 store 实例
- ✅ GET 操作
- ✅ POST 批量操作
- ✅ 数据验证
- ✅ DELETE 操作
- ✅ 数据清理（localforage）

## 导入方式示例

### Node.js CommonJS
```javascript
const JsLiteRest = require('js-lite-rest');
const store = await JsLiteRest.create({ /* data */ });
```

### Node.js ES Module
```javascript
import JsLiteRest from 'js-lite-rest';
const store = await JsLiteRest.create({ /* data */ });
```

### 浏览器 ES Module
```html
<script type="module">
  import JsLiteRest from './dist/js-lite-rest.browser.mjs';
  const store = await JsLiteRest.create({ /* data */ });
</script>
```

### 浏览器 UMD (script 标签)
```html
<script src="./dist/js-lite-rest.umd.js"></script>
<script>
  const store = await JsLiteRest.create({ /* data */ });
</script>
```

## 构建文件说明

| 文件 | 用途 | 环境 |
|------|------|------|
| `dist/js-lite-rest.cjs` | CommonJS 格式 | Node.js require() |
| `dist/js-lite-rest.mjs` | ES Module 格式（自动检测） | Node.js import |
| `dist/js-lite-rest.browser.mjs` | 浏览器专用 ES Module | 浏览器 import |
| `dist/js-lite-rest.umd.js` | UMD 格式 | 浏览器 `<script>` 标签 |

## package.json 导出配置

项目使用条件导出，确保在不同环境下自动选择正确的构建文件：

```json
{
  "main": "dist/js-lite-rest.cjs",
  "module": "dist/js-lite-rest.mjs",
  "browser": "dist/js-lite-rest.browser.mjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": {
        "import": "./dist/js-lite-rest.browser.mjs",
        "require": "./dist/js-lite-rest.cjs"
      },
      "import": "./dist/js-lite-rest.mjs",
      "require": "./dist/js-lite-rest.cjs",
      "default": "./dist/js-lite-rest.mjs"
    },
    "./umd": "./dist/js-lite-rest.umd.js"
  }
}
```

## 测试结果

所有环境的导入测试均已通过，确保 js-lite-rest 在各种使用场景下都能正常工作。

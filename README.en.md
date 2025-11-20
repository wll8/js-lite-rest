# js-lite-rest

[![npm version](https://badge.fury.io/js/js-lite-rest.svg)](https://badge.fury.io/js/js-lite-rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight frontend RESTful CRUD library for standalone applications and prototype development. Complete data CRUD operations without backend server.

**📚 [Documentation](https://wll8.github.io/js-lite-rest/) | 🎮 [Live Demo](https://wll8.github.io/js-lite-rest/html-demo/)**

> [中文文档](./README.md)

## ✨ Features

- 🚀 **Lightweight**: Zero dependencies, only a few KB after compression
- 🌐 **Cross-platform**: Supports both Node.js and browser environments
- 📦 **Multiple Storage**: Supports memory, file system, and localStorage storage
- 🔄 **RESTful API**: Provides standard HTTP-style CRUD operation interface
- 🎯 **TypeScript Support**: Complete type definitions for better development experience
- 🔧 **Extensible**: Supports middleware and custom adapters
- ⚡ **Async Operations**: All operations are asynchronous for better performance
- 🔗 **Relational Queries**: Supports nested resources and relational data queries
- 📝 **Batch Operations**: Supports batch CRUD operations

## 📦 Installation

```bash
npm install js-lite-rest
```

Or use other package managers:

```bash
yarn add js-lite-rest
pnpm add js-lite-rest
```

### CDN Import

```html
<!-- ES Module (Browser version with built-in localforage) -->
<script type="module">
  import JsLiteRest from 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.mjs';
  const store = await JsLiteRest.create();
</script>

<!-- UMD (Global Variable, self-contained, no extra dependencies) -->
<script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.umd.js"></script>
<script>
  // Use global variable JsLiteRest
  const store = await JsLiteRest.create();
</script>
```

## 📚 Multi-Environment Support

js-lite-rest provides multiple build formats for seamless usage across different environments:

| Environment | Format | File | Usage |
|-------------|--------|------|-------|
| Node.js | CommonJS | `js-lite-rest.cjs` | `require('js-lite-rest')` |
| Node.js | ES Module | `js-lite-rest.mjs` | `import JsLiteRest from 'js-lite-rest'` |
| Browser | ES Module | `js-lite-rest.browser.mjs` | `import JsLiteRest from '...'` |
| Browser | UMD | `js-lite-rest.umd.js` | `<script src="...">` |

**Automatic Environment Detection**: When using `import` or `require`, the appropriate build file is automatically selected based on the environment.

**Browser Environment Features**:
- ✅ Browser version includes built-in [localforage](https://localforage.github.io/localForage/), supporting IndexedDB, WebSQL, localStorage
- ✅ Automatically selects the best storage solution for larger storage capacity
- ✅ Access underlying storage API via `JsLiteRest.lib.localforage`

## 🚀 Quick Start

### Node.js Environment

```js
import JsLiteRest from 'js-lite-rest';

// Create store instance, data will be saved to file
const store = await JsLiteRest.create({
  books: [
    { id: 1, title: 'JavaScript: The Definitive Guide', author: 'David Flanagan' },
    { id: 2, title: 'Node.js in Action', author: 'Mike Cantelon' }
  ]
});

// Query all books
const books = await store.get('books');
console.log(books); // Returns all books

// Get specific book
const book = await store.get('books/1');
console.log(book); // { id: 1, title: 'JavaScript: The Definitive Guide', author: 'David Flanagan' }

// Add new book (auto-generate ID)
const newBook = await store.post('books', { title: 'Vue.js in Action', author: 'John Doe' });
console.log(newBook); // { id: 3, title: 'Vue.js in Action', author: 'John Doe' }

// Update book
await store.put('books/1', { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford' });

// Partial update
await store.patch('books/1', { author: 'Douglas Crockford' });

// Delete book
await store.delete('books/2');
```

### Browser Environment

```html
<!DOCTYPE html>
<html>
<head>
  <title>js-lite-rest Example</title>
  <!-- Use UMD version, self-contained with no extra dependencies -->
  <script src="https://unpkg.com/js-lite-rest/dist/js-lite-rest.umd.js"></script>
  <script>
    async function demo() {
      // Use localStorage storage in browser
      const store = await JsLiteRest.create();

      // Add user data
      await store.post('users', { name: 'Alice', email: 'alice@example.com' });
      await store.post('users', { name: 'Bob', email: 'bob@example.com' });

      // Query all users
      const users = await store.get('users');
      console.log('All users:', users);

      // Query specific user
      const user = await store.get('users/1');
      console.log('User 1:', user);
    }

    // Execute after page load
    document.addEventListener('DOMContentLoaded', demo);
  </script>
</head>
<body>
  <h1>js-lite-rest Browser Example</h1>
  <p>Open console to view output</p>
</body>
</html>
```

## 📖 API Documentation

### JsLiteRest.create(data?, options?)

Create a new store instance.

#### Parameters

**data** (optional)
- **Type**: `string | object | null`
- **Default**: `{}`

Data source configuration:
- **String**:
  - Node.js environment: Used as JSON file path
  - Browser environment: Used as localStorage key
- **Object**: Use this object directly as initial data
- **null**: Use custom adapter (needs to be configured in options)
- **Not provided**: Use default storage location
  - Browser: localStorage key `js-lite-rest`
  - Node.js: `js-lite-rest.json` file in current directory

**options** (optional)
- **Type**: `StoreOptions`

Configuration options:
- `idKeySuffix`: ID key suffix, default is `'Id'`
- `savePath`: Custom save path
- `load`: Custom load function
- `save`: Custom save function
- `adapter`: Custom adapter

### Store Instance Methods

#### GET Operations

```js
// Get all records
await store.get('users');

// Get specific record
await store.get('users/1');

// Nested resource query
await store.get('posts/1/comments');
```

#### POST Operations

```js
// Add single record
await store.post('users', { name: 'Alice', email: 'alice@example.com' });

// Batch add
await store.post('users', [
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);

// Nested resource add
await store.post('posts/1/comments', { content: 'Great article!' });
```

#### PUT Operations

```js
// Complete record replacement
await store.put('users/1', { name: 'Alice Smith', email: 'alice.smith@example.com' });

// Batch update
await store.put('users', [
  { id: 1, name: 'Alice Updated' },
  { id: 2, name: 'Bob Updated' }
]);
```

#### PATCH Operations

```js
// Partial record update
await store.patch('users/1', { name: 'Alice Johnson' });
```

#### DELETE Operations

```js
// Delete single record
await store.delete('users/1');

// Batch delete
await store.delete('users', ['user1', 'user2', 'user3']);
```

## 🔧 Advanced Usage

### Middleware

Use middleware to execute custom logic before and after requests:

```js
const store = await JsLiteRest.create();

// Add logging middleware
store.use(async (args, next, opt) => {
  const [method, path] = args;
  console.log(`${method.toUpperCase()} ${path}`);

  const result = await next();
  console.log('Result:', result);

  return result;
});

// Add validation middleware
store.use(async (args, next, opt) => {
  const [method, path, data] = args;

  if (method === 'post' && path === 'users') {
    if (!data.email) {
      throw new Error('Email is required');
    }
  }

  return next();
});
```

### Custom Adapter

```js
// Create custom adapter
class CustomAdapter {
  constructor(config) {
    this.config = config;
  }

  async get(path) {
    // Custom get logic
  }

  async post(path, data) {
    // Custom create logic
  }

  // ... other methods
}

// Use custom adapter
const store = await JsLiteRest.create(null, {
  adapter: new CustomAdapter({ /* configuration */ })
});
```

### Relational Data

Supports nested resources and relational queries:

```js
const store = await JsLiteRest.create({
  posts: [
    { id: 1, title: 'First Article', authorId: 1 },
    { id: 2, title: 'Second Article', authorId: 2 }
  ],
  comments: [
    { id: 1, content: 'Great article!', postId: 1 },
    { id: 2, content: 'I agree', postId: 1 }
  ]
});

// Get all comments for an article
const comments = await store.get('posts/1/comments');
console.log(comments); // Returns all comments with postId 1
```

## 🛠️ Development

### Requirements

- Node.js 20+
- pnpm 10+

### Development Scripts

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test                    # Node.js environment dev test
pnpm test:dev:browser        # Browser environment dev test
pnpm test:build              # Node.js environment build test
pnpm test:build:browser      # Browser environment build test

# Build project
pnpm build

# Develop documentation
pnpm docs:dev

# Build documentation
pnpm docs:build
```

### Test Coverage

The project includes a comprehensive test suite covering all environments and formats:
- ✅ **121 functional tests**: Covering all CRUD operations, middleware, interceptors, etc.
- ✅ **4 environment tests**: Node.js (CJS/ESM) + Browser (ESM/UMD)
- ✅ **32 import tests**: Validating various use cases

### Tech Stack

- **Build Tool**: Rollup
- **Testing Framework**: Mocha + Chai
- **Code Style**: @antfu/eslint-config
- **Documentation**: VitePress
- **Package Manager**: pnpm

## 📋 TODO

- [x] JSON Adapter
- [x] Browser Support
- [x] Middleware System
- [x] Node.js Support
- [x] TypeScript Type Definitions
- [x] Batch Operations
- [x] Nested Resources
- [ ] SQLite Adapter
- [ ] Data Validation
- [ ] Query Filters

## 🔗 Related Projects

- [Dexie](https://github.com/dexie/Dexie.js) - Modern browser IndexedDB wrapper
- [PouchDB](https://pouchdb.com/) - Database for browsers and Node.js
- [JSStore](https://jsstore.net/) - SQL-like IndexedDB wrapper
- [Lovefield](https://github.com/google/lovefield) - Google's relational database library

## 📄 License

[MIT](./LICENSE) © [xw](https://github.com/wll8)

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

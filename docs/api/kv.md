# KV 模式

KV（键值对）模式为 js-lite-rest 提供了简单直观的键值对操作接口，使用点语法轻松访问和操作嵌套数据。

## 概述

KV 模式通过 `store.kv` 对象提供以下方法：

- `get(key, defaultValue)` - 获取指定键的值
- `set(key, value)` - 设置指定键的值  
- `delete(key)` - 删除指定键

## 数据结构示例

```javascript
const store = await JsLiteRest.create({
  book: [
    { id: 1, title: 'css' },
    { id: 2, title: 'js' }
  ],
  config: {
    theme: 'dark',
    language: 'zh',
    settings: {
      autoSave: true,
      notifications: {
        email: true,
        push: false
      }
    }
  }
});
```

## get() - 获取值

使用点语法获取嵌套数据的值。

```javascript
// 获取简单配置
const theme = await store.kv.get('config.theme');
console.log(theme); // 'dark'

// 获取深层嵌套值
const autoSave = await store.kv.get('config.settings.autoSave');
console.log(autoSave); // true

const emailNotification = await store.kv.get('config.settings.notifications.email');
console.log(emailNotification); // true

// 获取数组中的元素
const firstBook = await store.kv.get('book.0');
console.log(firstBook); // { id: 1, title: 'css' }

const firstBookTitle = await store.kv.get('book.0.title');
console.log(firstBookTitle); // 'css'
```

### 默认值

当键不存在时，可以提供默认值：

```javascript
// 获取不存在的键，返回默认值
const theme = await store.kv.get('config.nonexistent', 'light');
console.log(theme); // 'light'

// 不提供默认值时返回 undefined
const missing = await store.kv.get('config.missing');
console.log(missing); // undefined
```

## set() - 设置值

设置指定路径的值，如果路径不存在会自动创建。

```javascript
// 设置简单值
await store.kv.set('config.theme', 'light');

// 设置深层嵌套值
await store.kv.set('config.settings.notifications.push', true);

// 创建新的嵌套路径
await store.kv.set('config.newSection.newKey', 'newValue');

// 修改数组中的元素
await store.kv.set('book.0.title', 'css3');
```

### 自动创建路径

如果设置的路径不存在，会自动创建相应的嵌套结构：

```javascript
// 在不存在的路径上设置值
await store.kv.set('config.advanced.features.darkMode', true);

// 等价于：
// config.advanced = { features: { darkMode: true } }
```

## delete() - 删除值

删除指定路径的值。

```javascript
// 删除配置项
await store.kv.delete('config.settings.notifications.email');

// 验证删除结果
const email = await store.kv.get('config.settings.notifications.email');
console.log(email); // undefined

// 其他值仍然存在
const push = await store.kv.get('config.settings.notifications.push');
console.log(push); // false (之前设置的值)
```

### 安全删除

删除不存在的路径不会报错：

```javascript
// 删除不存在的键，不会抛出错误
await store.kv.delete('config.nonexistent');
await store.kv.delete('config.settings.nonexistent.deep');
```

## 与常规 API 的协同工作

KV 模式与常规的 CRUD API 完全兼容，数据持久化是一致的：

```javascript
// 通过 KV 模式修改配置
await store.kv.set('config.theme', 'blue');

// 通过常规 API 验证
const config = await store.get('config');
console.log(config.theme); // 'blue'

// 通过常规 API 修改
await store.patch('config', { version: '1.0' });

// 通过 KV 模式验证
const version = await store.kv.get('config.version');
console.log(version); // '1.0'
```

## 完整示例

### 应用配置管理

```javascript
import JsLiteRest from 'js-lite-rest';

async function setupConfig() {
  const store = await JsLiteRest.create({
    config: {
      ui: {
        theme: 'light',
        language: 'en'
      },
      features: {
        notifications: true,
        autoSave: false
      }
    }
  });

  // 获取当前主题
  const currentTheme = await store.kv.get('config.ui.theme', 'light');
  console.log('当前主题:', currentTheme);

  // 切换主题
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await store.kv.set('config.ui.theme', newTheme);
  console.log('主题已切换为:', newTheme);

  // 启用新功能
  await store.kv.set('config.features.experimental.aiAssist', true);
  console.log('AI 助手功能已启用');

  // 获取所有通知设置
  const notifications = await store.kv.get('config.features.notifications');
  console.log('通知设置:', notifications);

  // 重置某个功能
  await store.kv.delete('config.features.experimental');
  console.log('实验性功能已重置');

  return store;
}

setupConfig();
```

### 用户偏好设置

```javascript
async function userPreferences() {
  const store = await JsLiteRest.create({
    users: [
      {
        id: 1,
        name: 'Alice',
        preferences: {
          display: {
            density: 'compact',
            showAvatars: true
          },
          privacy: {
            shareActivity: false,
            allowMessages: true
          }
        }
      }
    ]
  });

  // 获取用户偏好
  const density = await store.kv.get('users.0.preferences.display.density');
  console.log('显示密度:', density); // 'compact'

  // 更新隐私设置
  await store.kv.set('users.0.preferences.privacy.shareActivity', true);
  
  // 添加新的偏好设置
  await store.kv.set('users.0.preferences.notifications.email', false);
  
  // 获取完整的用户偏好
  const preferences = await store.kv.get('users.0.preferences');
  console.log('用户偏好:', preferences);
}
```

### 动态配置系统

```javascript
class ConfigManager {
  constructor(store) {
    this.store = store;
  }

  async get(key, defaultValue) {
    return await this.store.kv.get(`config.${key}`, defaultValue);
  }

  async set(key, value) {
    await this.store.kv.set(`config.${key}`, value);
    console.log(`配置 ${key} 已更新为:`, value);
  }

  async toggle(key) {
    const current = await this.get(key, false);
    await this.set(key, !current);
    return !current;
  }

  async reset(key) {
    await this.store.kv.delete(`config.${key}`);
    console.log(`配置 ${key} 已重置`);
  }
}

// 使用示例
async function useConfigManager() {
  const store = await JsLiteRest.create({
    config: {
      features: {
        darkMode: false,
        autoSave: true
      }
    }
  });

  const config = new ConfigManager(store);

  // 切换暗色模式
  const darkMode = await config.toggle('features.darkMode');
  console.log('暗色模式:', darkMode ? '开启' : '关闭');

  // 设置新功能
  await config.set('features.beta.newFeature', true);

  // 获取配置
  const autoSave = await config.get('features.autoSave');
  console.log('自动保存:', autoSave);

  // 重置 beta 功能
  await config.reset('features.beta');
}
```

## 性能考虑

### 1. 路径解析

KV 模式会解析点分隔的路径，对于频繁访问的深层路径，考虑缓存：

```javascript
// 频繁访问的路径可以缓存
const userPrefsPath = 'users.0.preferences.display';
const cachedValue = await store.kv.get(userPrefsPath);

// 或者直接使用常规 API 获取对象再操作
const user = await store.get('users/1');
const display = user.preferences.display;
```

### 2. 批量操作

对于多个相关的设置，考虑批量更新：

```javascript
// 不推荐：多次单独更新
await store.kv.set('config.ui.theme', 'dark');
await store.kv.set('config.ui.fontSize', 'large');
await store.kv.set('config.ui.compact', true);

// 推荐：批量更新
const config = await store.get('config');
config.ui = {
  ...config.ui,
  theme: 'dark',
  fontSize: 'large',
  compact: true
};
await store.put('config', config);
```

## 限制和注意事项

1. **数组索引**: 只能使用数字索引访问数组元素，如 `array.0`, `array.1`
2. **键名限制**: 键名不能包含点号（`.`），因为点号用作路径分隔符
3. **类型保持**: 设置值时会保持原有的数据类型
4. **自动创建**: 设置不存在的路径会自动创建对象结构

## 相关 API

- [CRUD 操作](/api/crud) - 了解基本的数据操作
- [Info API](/api/info) - 获取存储信息
- [创建 Store](/api/create-store) - Store 的创建和配置
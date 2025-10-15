// CommonJS 环境测试
const fs = require('fs');

console.log('\n========== CommonJS 环境测试 ==========');

async function testCJS() {
  try {
    // 测试 1: 导入主包
    const JsLiteRest = require('../../dist/js-lite-rest.cjs');
    console.log('✓ CommonJS require() 成功');

    // 测试 2: 检查导出结构
    if (JsLiteRest && JsLiteRest.create) {
      console.log('✓ JsLiteRest.create 方法存在');
    } else {
      throw new Error('JsLiteRest.create 方法不存在');
    }

    // 测试 3: 创建 store 实例
    const store = await JsLiteRest.create({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    }, {
      savePath: 'test-cjs-store.json'
    });
    console.log('✓ 成功创建 store 实例');

    // 测试 4: GET 操作
    const users = await store.get('users');
    if (Array.isArray(users) && users.length === 2) {
      console.log(`✓ GET 操作成功，获取到 ${users.length} 条数据`);
    } else {
      throw new Error('GET 操作失败');
    }

    // 测试 5: POST 操作
    const newUser = await store.post('users', { name: 'Charlie' });
    if (newUser && newUser.name === 'Charlie') {
      console.log('✓ POST 操作成功');
    } else {
      throw new Error('POST 操作失败');
    }

    // 测试 6: 验证数据持久化
    const updatedUsers = await store.get('users');
    if (updatedUsers.length === 3) {
      console.log(`✓ 数据持久化成功，当前有 ${updatedUsers.length} 条数据`);
    } else {
      throw new Error('数据持久化失败');
    }

    // 清理测试数据
    if (fs.existsSync('test-cjs-store.json')) {
      fs.unlinkSync('test-cjs-store.json');
      console.log('✓ 测试数据清理完成');
    }

    console.log('\n========== CommonJS 测试全部通过 ==========\n');
    process.exit(0);

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    console.error(error.stack);

    // 清理测试数据
    try {
      if (fs.existsSync('test-cjs-store.json')) {
        fs.unlinkSync('test-cjs-store.json');
      }
    } catch (e) {
      // ignore
    }

    process.exit(1);
  }
}

testCJS();

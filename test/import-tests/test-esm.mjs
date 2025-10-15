// ES Module (Node.js) 环境测试
import fs from 'fs';
import JsLiteRest from '../../dist/js-lite-rest.mjs';

console.log('\n========== ES Module (Node.js) 环境测试 ==========');

async function testESM() {
  try {
    // 测试 1: 检查导入
    console.log('✓ ES Module import 成功');

    // 测试 2: 检查导出结构
    if (JsLiteRest && JsLiteRest.create) {
      console.log('✓ JsLiteRest.create 方法存在');
    } else {
      throw new Error('JsLiteRest.create 方法不存在');
    }

    // 测试 3: 创建 store 实例
    const store = await JsLiteRest.create({
      products: [
        { id: 1, name: 'Laptop', price: 999 },
        { id: 2, name: 'Mouse', price: 25 }
      ]
    }, {
      savePath: 'test-esm-store.json'
    });
    console.log('✓ 成功创建 store 实例');

    // 测试 4: GET 操作
    const products = await store.get('products');
    if (Array.isArray(products) && products.length === 2) {
      console.log(`✓ GET 操作成功，获取到 ${products.length} 条数据`);
    } else {
      throw new Error('GET 操作失败');
    }

    // 测试 5: PUT 操作
    const updated = await store.put('products/1', { id: 1, name: 'Laptop Pro', price: 1299 });
    if (updated && updated.name === 'Laptop Pro') {
      console.log('✓ PUT 操作成功');
    } else {
      throw new Error('PUT 操作失败');
    }

    // 测试 6: DELETE 操作
    const deleted = await store.delete('products/2');
    if (deleted && deleted.id === 2) {
      console.log('✓ DELETE 操作成功');
    } else {
      throw new Error('DELETE 操作失败');
    }

    // 测试 7: 验证最终数据
    const finalProducts = await store.get('products');
    if (finalProducts.length === 1 && finalProducts[0].name === 'Laptop Pro') {
      console.log('✓ 所有操作验证成功');
    } else {
      throw new Error('数据验证失败');
    }

    // 清理测试数据
    if (fs.existsSync('test-esm-store.json')) {
      fs.unlinkSync('test-esm-store.json');
      console.log('✓ 测试数据清理完成');
    }

    console.log('\n========== ES Module 测试全部通过 ==========\n');
    process.exit(0);

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    console.error(error.stack);

    // 清理测试数据
    try {
      if (fs.existsSync('test-esm-store.json')) {
        fs.unlinkSync('test-esm-store.json');
      }
    } catch (e) {
      // ignore
    }

    process.exit(1);
  }
}

testESM();

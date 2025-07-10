import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyTypes() {
  try {
    const sourceFile = path.resolve(__dirname, '../types/index.d.ts');
    const targetFile = path.resolve(__dirname, '../dist/index.d.ts');
    
    // 确保 dist 目录存在
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    
    // 复制文件
    await fs.copyFile(sourceFile, targetFile);
    
    console.log('✅ TypeScript 定义文件已复制到: dist/index.d.ts');
  } catch (error) {
    console.error('❌ 复制类型定义文件失败:', error.message);
    process.exit(1);
  }
}

copyTypes();

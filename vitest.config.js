import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 启用调试模式
    globals: true,
    environment: 'node',
    
    // 调试相关配置
    setupFiles: [],
    reporters: ['verbose'],
    
    // 禁用并行执行，便于调试
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    
    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/'
      ]
    }
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': './src'
    }
  }
}); 
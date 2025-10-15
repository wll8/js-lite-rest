import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default defineConfig([
  // Types generation (类型定义文件)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'esm', inlineDynamicImports: true },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        declarationMap: true,
        rootDir: 'src',
        emitDeclarationOnly: true,
        sourceMap: false
      })
    ],
  },
  // ESM 格式 (现代环境首选)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/js-lite-rest.mjs', format: 'esm', sourcemap: true, inlineDynamicImports: true },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        rootDir: 'src',
        sourceMap: true
      }),
      nodeResolve(),
      commonjs()
    ],
  },
  // CJS 格式 (Node.js 兼容性)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/js-lite-rest.cjs', format: 'cjs', sourcemap: true, inlineDynamicImports: true, exports: 'default' },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        rootDir: 'src',
        sourceMap: true
      }),
      nodeResolve(),
      commonjs()
    ],
  },
  // UMD 格式 (浏览器 <script> 标签直接使用)
  {
    input: 'src/index.browser.ts',
    output: [
      { 
        file: 'dist/js-lite-rest.umd.js', 
        format: 'umd', 
        name: 'JsLiteRest', 
        sourcemap: true, 
        inlineDynamicImports: true,
        exports: 'default'
      },
    ],
    external: [],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        rootDir: 'src',
        sourceMap: true
      }),
      nodeResolve(),
      commonjs()
    ],
  },
]); 
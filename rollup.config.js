import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default defineConfig([
  // Types generation (主类型文件)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'esm' },
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
  // Node
  {
    input: 'src/store.node.ts',
    output: [
      { file: 'dist/js-lite-rest.node.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/js-lite-rest.node.cjs.js', format: 'cjs', sourcemap: true },
    ],
    external: ['fs', 'fs/promises'],
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
  // Browser
  {
    input: 'src/store.browser.ts',
    output: [
      { file: 'dist/js-lite-rest.browser.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/js-lite-rest.browser.umd.js', format: 'umd', name: 'JsLiteRest', sourcemap: true },
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
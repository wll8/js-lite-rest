import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig([
  // Node
  {
    input: 'src/store.node.js',
    output: [
      { file: 'dist/js-store.node.esm.js', format: 'esm' },
      { file: 'dist/js-store.node.cjs.js', format: 'cjs' },
    ],
    external: ['fs'],
    plugins: [nodeResolve(), commonjs()],
  },
  // Browser
  {
    input: 'src/store.browser.js',
    output: [
      { file: 'dist/js-store.browser.esm.js', format: 'esm' },
      { file: 'dist/js-store.browser.umd.js', format: 'umd', name: 'BrowserStore' },
    ],
    external: [],
    plugins: [nodeResolve(), commonjs()],
  },
]); 
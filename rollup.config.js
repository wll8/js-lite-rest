import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig([
  // Node
  {
    input: 'src/store.node.js',
    output: [
      { file: 'dist/js-lite-rest.node.esm.js', format: 'esm' },
      { file: 'dist/js-lite-rest.node.cjs.js', format: 'cjs' },
    ],
    external: ['fs'],
    plugins: [nodeResolve(), commonjs()],
  },
  // Browser
  {
    input: 'src/store.browser.js',
    output: [
      { file: 'dist/js-lite-rest.browser.esm.js', format: 'esm' },
      { file: 'dist/js-lite-rest.browser.umd.js', format: 'umd', name: 'JsLiteRest' },
    ],
    external: [],
    plugins: [nodeResolve(), commonjs()],
  },
]); 
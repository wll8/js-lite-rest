import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  input: 'src/index.js',
  output: [
    {
      file: 'dist/js-store.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/js-store.esm.js',
      format: 'esm',
    },
    {
      file: 'dist/js-store.umd.js',
      format: 'umd',
      name: 'JsStore',
    },
  ],
  plugins: [nodeResolve(), commonjs()],
}); 
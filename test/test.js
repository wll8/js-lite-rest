import { testMain, testNodeStoreBasic, testBrowserStore } from './base.test.js';

// 支持通过 -- 传递自定义参数
const args = process.argv;
const sepIndex = args.indexOf('--');
const userArgs = sepIndex !== -1 ? args.slice(sepIndex + 1) : [];
const mode = userArgs[0] || 'dev'; // dev 或 build
const env = userArgs[1] || 'node'; // node 或 browser

console.log(`Running tests in ${mode} mode for ${env} environment`);

async function setupJSDOM() {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
}

if (mode === 'dev') {
  if (env === 'node') {
    const JsStore = (await import('../src/store.node.js')).default;
    testMain(JsStore);
    testNodeStoreBasic(JsStore);
  } else if (env === 'browser') {
    await setupJSDOM();
    const JsStore = (await import('../src/store.browser.js')).default;
    testMain(JsStore);
    testBrowserStore(JsStore);
  }
} else if (mode === 'build') {
  if (env === 'node') {
    const JsStore = (await import('../dist/js-store.node.esm.js')).default;
    testMain(JsStore);
    testNodeStoreBasic(JsStore);
  } else if (env === 'browser') {
    await setupJSDOM();
    const JsStore = (await import('../dist/js-store.browser.esm.js')).default;
    testMain(JsStore);
    testBrowserStore(JsStore);
  }
} 
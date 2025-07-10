import fs from 'fs';
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

const envMap = {
  async node(path) {
    const create = (await import(path)).default;
    testMain({ create }, {
      afterEach() {
        const savePath = `js-lite-rest.json`
        if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
      }
    });
    testNodeStoreBasic({ create });
  },
  async browser(path) {
    await setupJSDOM();
    const create = (await import(path)).default;
    testMain({ create }, {
      afterEach() {
        const savePath = `js-lite-rest`
        window.localStorage.removeItem(savePath);
      }
    });
    testBrowserStore({ create });
  },
}

if (mode === 'dev') {
  if (env === 'node') {
    await envMap[env]('../src/store.node.js')
  } else if (env === 'browser') {
    await envMap[env]('../src/store.browser.js')
  }
} else if (mode === 'build') {
  if (env === 'node') {
    await envMap[env]('../dist/js-lite-rest.node.esm.js')
  } else if (env === 'browser') {
    await envMap[env]('../dist/js-lite-rest.browser.esm.js')
  }
} 
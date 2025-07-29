import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'js-lite-rest',
  description: '纯前端 RESTful 风格增删改查库',
  lang: 'zh-CN',
  base: '/js-lite-rest/',

  head: [
    // 全局嵌入 UMD 版本供控制台调试使用
    ['script', { src: 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js' }],
    // UnoCSS CDN
    ['script', { src: 'https://cdn.jsdelivr.net/npm/@unocss/runtime/uno.global.js' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.css' }]
  ],

  themeConfig: {
    // logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: 'API 文档', link: '/api/' },
      { text: '示例', link: 'https://wll8.github.io/js-lite-rest/html-demo/' },
      { text: '测试', link: 'https://wll8.github.io/js-lite-rest/test-results/mochawesome-results.html' },
      {
        text: '更多',
        items: [
          { text: 'GitHub', link: 'https://github.com/wll8/js-lite-rest' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/js-lite-rest' }
        ]
      }
    ],

    sidebar: {
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: '快速开始', link: '/api/' },
            { text: '创建 Store', link: '/api/create-store' },
            { text: 'CRUD 操作', link: '/api/crud' },
            { text: '查询过滤', link: '/api/query' },
            { text: '关系操作', link: '/api/relations' },
            { text: '中间件', link: '/api/middleware' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wll8/js-lite-rest' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 xw'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/wll8/js-lite-rest/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  // 自定义配置
  vite: {
    define: {
      // 在所有页面中全局可用的变量
      __JS_LITE_REST_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.1')
    }
  },

  // 构建配置
  outDir: '../dist/docs',

  // 开发服务器配置
  server: {
    port: 5173,
    host: true
  },

  // 静态资源配置
  assetsDir: 'assets',

  // 确保静态文件可访问
  publicDir: 'public'
})

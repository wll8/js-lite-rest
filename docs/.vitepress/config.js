import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'js-lite-rest',
  description: '纯前端 RESTful 风格增删改查库',
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // 全局嵌入 UMD 版本供控制台调试使用
    ['script', { src: 'https://unpkg.com/js-lite-rest/dist/js-lite-rest.browser.umd.js' }],
    // UnoCSS CDN
    ['script', { src: 'https://cdn.jsdelivr.net/npm/@unocss/runtime/uno.global.js' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.css' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: 'API 文档', link: '/api/' },
      { text: '示例', link: '/demo/' },
      { text: '测试', link: '/test/' },
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
            { text: '配置选项', link: '/api/options' }
          ]
        }
      ],
      '/demo/': [
        {
          text: '示例',
          items: [
            { text: '示例首页', link: '/demo/' },
            { text: '基础 CRUD', link: '/html-demo/basic-crud.html' },
            { text: '博客系统', link: '/html-demo/blog-system.html' },
            { text: '中间件示例', link: '/html-demo/middleware.html' },
            { text: '性能测试', link: '/html-demo/performance.html' },
            { text: '查询功能', link: '/html-demo/query-features.html' },
            { text: '关系操作', link: '/html-demo/relations.html' }
          ]
        }
      ],
      '/test/': [
        {
          text: '测试',
          items: [
            { text: '测试概览', link: '/test/' },
            { text: '测试报告', link: '/test/report' },
            { text: '在线报告', link: '/test-results/mochawesome-results.html' }
          ]
        }
      ]
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

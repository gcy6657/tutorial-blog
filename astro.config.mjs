// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // 博客正式网址
  // TODO: 绑定域名后改成教程站的正式网址
  site: 'https://example.com',
  integrations: [mdx()],
  // 改成系列结构之前的旧网址，跳转到新地址，避免别人收藏的链接失效
  redirects: {
    '/blog/archlinux双系统安装': '/series/archlinux/archlinux双系统安装/',
    '/blog/archlinux美化': '/series/archlinux/archlinux美化/',
    '/blog/linux基础教程': '/series/archlinux/linux基础教程/',
    '/blog/archlinux软件生态': '/series/archlinux/archlinux软件生态/',
  },
  // 关闭本地预览时页面底部的 Astro 开发工具栏
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});

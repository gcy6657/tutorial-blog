// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // 博客正式网址
  // TODO: 绑定域名后改成教程站的正式网址
  site: 'https://example.com',
  integrations: [mdx()],
  // 关闭本地预览时页面底部的 Astro 开发工具栏
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});

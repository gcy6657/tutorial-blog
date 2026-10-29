# 红苹果的教程

基于 [Astro](https://astro.build) 的静态博客，托管在 Cloudflare Pages。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run check    # 类型检查
```

## 写文章

在 `src/content/blog/` 新建 `xxx.md`（或 `.mdx`），文件名即网址 `/blog/xxx/`：

```yaml
---
title: 标题
description: 简介（可选）
pubDate: 2026-10-28
updatedDate: 2026-11-01   # 可选
tags: [标签1, 标签2]
draft: false              # true 时只在 npm run dev 中可见
---
```

## 想改界面，改哪里

| 想改的东西 | 文件 |
|---|---|
| 博客名、首页大标题、简介、你的名字、底部链接 | `src/config.ts`（每项都有注释） |
| 颜色（背景、文字、链接色，浅色/深色各一套） | `src/styles/global.css` 顶部的 `:root` 和 `[data-theme='dark']` |
| 字体、字号、行距、页面宽度 | `src/styles/global.css` 里的 `html` 和 `--max-width` |
| 顶部导航菜单（增删菜单项） | `src/layouts/BaseLayout.astro` 里的 `nav` 列表 |
| 页头、页脚的布局 | `src/layouts/BaseLayout.astro` |
| 首页的结构（如「最新文章」标题、显示几篇） | `src/pages/index.astro` |
| 文章列表每一项长什么样 | `src/components/PostList.astro` |
| 文章详情页的布局 | `src/layouts/PostLayout.astro` |
| 关于页 / 归档页 / 标签页 / 404 页 | `src/pages/` 下对应的文件 |
| 网站小图标 | 替换 `public/favicon.svg` |

`.astro` 文件分两部分：最上面 `---` 之间是取数据的代码，下面是 HTML 结构，最底部的 `<style>` 只对这个文件生效。
改之前先运行 `npm run dev`，边改边在 http://localhost:4321 看效果，满意了再推送。

`astro.config.mjs` 里的 `site` 是网站正式网址，一般不用动。

## 评论（Giscus）

1. GitHub 仓库设为 public，在 Settings → Features 打开 Discussions
2. 安装 [giscus App](https://github.com/apps/giscus) 到该仓库
3. 在 <https://giscus.app/zh-CN> 填入仓库，得到 `repo`、`repoId`、`categoryId`，填进 `src/config.ts` 的 `GISCUS`

## 部署（Cloudflare Pages）

1. 把代码推到 GitHub
2. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git，选择仓库
3. Framework preset 选 **Astro**（Build command `npm run build`，Output directory `dist`）
4. 之后每次 push 到 main 自动发布；Node 版本由 `.node-version` 指定

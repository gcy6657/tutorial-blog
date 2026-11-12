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

网站由「系列」和「单篇文章」组成：首页列出所有系列卡片，点进系列页是章节目录，点章节进入正文；不属于任何系列的文章列在首页下方的「其他文章」里。

### 单篇文章

在 `src/content/blog/` 根目录新建 `xxx.md`（或 `.mdx`），网址是 `/blog/xxx/`：

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

### 系列章节

1. 新建系列：在 `src/content/series/` 新建 `<系列名>.md`，正文是系列页顶部的介绍：

   ```yaml
   ---
   title: 系列标题
   description: 首页卡片上显示的简介
   order: 3        # 首页上的排列顺序，数字小的在前
   ---
   ```

2. 写章节：在 `src/content/blog/<系列名>/` 新建 `xxx.md`，网址是 `/series/<系列名>/xxx/`。frontmatter 和单篇文章一样，再加一个 `chapter: 1` 表示第几章（决定章节顺序）。

目录名必须和 `src/content/series/` 里的文件名一致，否则构建时会报错提醒。

> 移动文章会改变它的网址。如果旧网址可能已经被别人收藏，在 `astro.config.mjs` 的 `redirects` 里加一条从旧地址到新地址的跳转。

## 想改界面，改哪里

| 想改的东西 | 文件 |
|---|---|
| 博客名、首页大标题、简介、你的名字、底部链接 | `src/config.ts`（每项都有注释） |
| 颜色（背景、文字、链接色，浅色/深色各一套） | `src/styles/global.css` 顶部的 `:root` 和 `[data-theme='dark']` |
| 字体、字号、行距、页面宽度 | `src/styles/global.css` 里的 `html` 和 `--max-width` |
| 顶部导航菜单（增删菜单项） | `src/layouts/BaseLayout.astro` 里的 `nav` 列表 |
| 页头、页脚的布局 | `src/layouts/BaseLayout.astro` |
| 首页的结构（系列卡片、「其他文章」列表） | `src/pages/index.astro` |
| 系列页（章节目录）的布局 | `src/pages/series/[series]/index.astro` |
| 章节页里的「本系列」章节侧栏 | `src/components/SeriesNav.astro` |
| 文章列表每一项长什么样 | `src/components/PostList.astro` |
| 文章 / 章节正文页的布局 | `src/layouts/PostLayout.astro` |
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

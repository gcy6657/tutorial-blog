import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 文章：放在 src/content/blog/ 根目录的是单篇文章；
// 放在 src/content/blog/<系列名>/ 子目录里的是该系列的章节，<系列名> 要和 src/content/series/ 里的文件名一致。
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // 系列里的第几章，决定章节顺序；单篇文章不用填
    chapter: z.number().int().positive().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 系列：每个系列一个 .md 文件，正文是系列页顶部的介绍
const series = defineCollection({
  loader: glob({ base: './src/content/series', pattern: '*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // 首页上的排列顺序，数字小的在前
    order: z.number().default(100),
  }),
});

export const collections = { blog, series };

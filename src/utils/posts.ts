import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;
export type SeriesEntry = CollectionEntry<'series'>;

export interface Series {
  entry: SeriesEntry;
  /** 按章节号排好序的章节 */
  chapters: Post[];
}

/** 已发布文章，按发布时间倒序。开发模式下也显示草稿，方便预览。 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 文章所属系列的 id（即子目录名）；单篇文章返回 undefined */
export function seriesIdOf(post: Post): string | undefined {
  const slash = post.id.indexOf('/');
  return slash === -1 ? undefined : post.id.slice(0, slash);
}

/** 章节在系列内的网址片段（去掉系列目录前缀） */
export function chapterSlugOf(post: Post): string {
  return post.id.slice(post.id.indexOf('/') + 1);
}

export function postUrl(post: Post): string {
  const seriesId = seriesIdOf(post);
  return seriesId ? `/series/${seriesId}/${chapterSlugOf(post)}/` : `/blog/${post.id}/`;
}

export function seriesUrl(seriesId: string): string {
  return `/series/${seriesId}/`;
}

/** 不属于任何系列的单篇文章，按发布时间倒序 */
export async function getStandalonePosts(): Promise<Post[]> {
  return (await getPublishedPosts()).filter((post) => !seriesIdOf(post));
}

/** 所有至少有一章已发布的系列，按 order 排序 */
export async function getAllSeries(): Promise<Series[]> {
  const [entries, posts] = await Promise.all([getCollection('series'), getPublishedPosts()]);
  const seriesIds = new Set(entries.map((e) => e.id));
  for (const post of posts) {
    const id = seriesIdOf(post);
    if (id && !seriesIds.has(id)) {
      throw new Error(`文章 ${post.id} 所在的系列「${id}」没有对应的 src/content/series/${id}.md`);
    }
  }
  return entries
    .map((entry) => ({
      entry,
      chapters: posts
        .filter((post) => seriesIdOf(post) === entry.id)
        .sort((a, b) => (a.data.chapter ?? Infinity) - (b.data.chapter ?? Infinity) || a.data.pubDate.valueOf() - b.data.pubDate.valueOf()),
    }))
    .filter((s) => s.chapters.length > 0)
    .sort((a, b) => a.entry.data.order - b.entry.data.order);
}

/** 系列最近一次发布或更新的日期 */
export function seriesUpdatedAt(series: Series): Date {
  return new Date(Math.max(...series.chapters.map((c) => (c.data.updatedDate ?? c.data.pubDate).valueOf())));
}

export function groupByYear(posts: Post[]): [number, Post[]][] {
  const groups = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getUTCFullYear();
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]);
}

export function collectTags(posts: Post[]): Map<string, Post[]> {
  const tags = new Map<string, Post[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.set(tag, [...(tags.get(tag) ?? []), post]);
    }
  }
  return new Map([...tags.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
}

/** 字数（中文按字、英文按词）与预计阅读分钟数 */
export function readingStats(body = ''): { words: number; minutes: number } {
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '');
  const cjk = text.match(/[㐀-鿿豈-﫿]/g)?.length ?? 0;
  const latin = text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return { words: cjk + latin, minutes: Math.max(1, Math.round(cjk / 400 + latin / 200)) };
}

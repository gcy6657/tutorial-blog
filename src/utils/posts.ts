import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** 已发布文章，按发布时间倒序。开发模式下也显示草稿，方便预览。 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
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
  const cjk = text.match(/[㐀-鿿豈-﫿]/g)?.length ?? 0;
  const latin = text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return { words: cjk + latin, minutes: Math.max(1, Math.round(cjk / 400 + latin / 200)) };
}

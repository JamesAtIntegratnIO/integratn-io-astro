import { getCollection, type CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

// Published posts, newest first. Drafts never reach a page, a list or the feed.
export async function publishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (post) => !post.data.draft);
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.data.title.localeCompare(b.data.title),
  );
}

export const postHref = (post: Post) => `/blog/${post.id}/`;
export const day = (date: Date) => date.toISOString().slice(0, 10);

// Each distinct value of a list field (tags, categories) or a single field (series),
// with the posts carrying it, in name order.
export function groupBy(posts: Post[], field: 'tags' | 'categories' | 'series'): Map<string, Post[]> {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const value = post.data[field];
    const names = Array.isArray(value) ? value : value ? [value] : [];
    for (const name of names) {
      groups.set(name, [...(groups.get(name) ?? []), post]);
    }
  }
  return new Map([...groups].sort(([a], [b]) => a.localeCompare(b)));
}

// "docker-training" reads as "Docker Training".
export const titleCase = (slug: string) =>
  slug.split(/[-_]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

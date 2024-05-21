import { getCollection } from "astro:content";
type PostData = {
  title: string;
  description: string;
  pubDate: Date;
  heroImage: string;
  tags?: string[];
  updatedDate?: Date;
  series?: string;
  categories?: string[];
  draft?: boolean;
};

export async function countPostElement(property: keyof PostData): Promise<{ name: string; count: number }[]> {
  const allPosts = await getCollection('posts');

  return allPosts.reduce((acc: { name: string; count: number }[], post) => {
    const postDataProperty = post.data[property];

    if (Array.isArray(postDataProperty)) {
      postDataProperty.forEach((name) => {
        console.log(`name: ${name}`)
        const existingTag = acc.find((t) => t.name === name);
        if (existingTag) {
          existingTag.count++;
        } else {
          acc.push({ name, count: 1 });
        }
      });
    }
    acc.forEach((tag) => {
      console.log(`name: ${tag.name}`);
    });
    return acc;
  }, []);
}

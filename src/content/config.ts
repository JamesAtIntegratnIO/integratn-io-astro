import { defineCollection, z } from 'astro:content';

const postCollection = defineCollection({
	// type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		tags: z.array(z.string()).optional(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		series: z.string().optional(),
		categories: z.array(z.string()).optional(),
	}),
});

export const collections = { 'posts': postCollection };

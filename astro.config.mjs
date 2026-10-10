import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://integratn.io',
  integrations: [mdx(), sitemap(), robotsTxt()],
  // The blog moved under /blog. Every old address still lands on its page.
  redirects: {
    '/posts': '/blog',
    '/posts/[...slug]': '/blog/[...slug]',
    '/tags': '/blog/tags',
    '/tags/[tag]': '/blog/tags/[tag]',
    '/series': '/blog/series',
    '/series/[series]': '/blog/series/[series]',
    '/categories': '/blog/categories',
    '/categories/[category]': '/blog/categories/[category]',
  },
});

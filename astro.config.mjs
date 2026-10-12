import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://integratn.io',
  integrations: [
    mdx(),
    // Tag and category listings are noindex (thin, overlapping pages), so the sitemap leaves them out.
    sitemap({ filter: (page) => !/\/blog\/(tags|categories)\//.test(page) }),
    robotsTxt(),
  ],
  // Code blocks carry both GitHub themes as variables; site.css picks one by display mode.
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
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

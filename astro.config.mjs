import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import tailwind from "@astrojs/tailwind";
import netlify from '@astrojs/netlify/static';

// https://astro.build/config
export default defineConfig({
  site: 'https://integratn.io',
  integrations: [mdx(), sitemap(), tailwind()],
  adapter: netlify(),
});
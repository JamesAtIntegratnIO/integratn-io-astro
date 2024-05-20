import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import tailwind from "@astrojs/tailwind";
import netlify from '@astrojs/netlify/static';
import robotsTxt from 'astro-robots-txt';


// https://astro.build/config
export default defineConfig({
  site: 'https://integratn.io',
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    robotsTxt()
  ],
  adapter: netlify(),
});

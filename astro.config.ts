import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site';
import { SHIKI_THEMES } from './src/lib/shiki';

export default defineConfig({
  site: SITE.url,
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { themes: SHIKI_THEMES, defaultColor: false, wrap: false },
  },
});

import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site';
import { SHIKI_THEMES } from './src/lib/shiki';

/** public/ is copied verbatim; strip files of draft evidence so unpublished material is not served. */
const stripDraftEvidenceFiles: AstroIntegration = {
  name: 'strip-draft-evidence-files',
  hooks: {
    'astro:build:done': ({ dir }) => {
      if (process.env.SHOW_DRAFTS === 'true') return;
      const evDir = new URL('./src/content/evidence/', import.meta.url);
      for (const f of readdirSync(evDir).filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))) {
        const fm = readFileSync(new URL(f, evDir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
        if (/^draft:\s*true\b/m.test(fm))
          rmSync(fileURLToPath(new URL(`files/${f.slice(0, -4)}/`, dir)), { recursive: true, force: true });
      }
    },
  },
};

export default defineConfig({
  site: SITE.url,
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap(), stripDraftEvidenceFiles],
  markdown: {
    shikiConfig: { themes: SHIKI_THEMES, defaultColor: false, wrap: false },
  },
});

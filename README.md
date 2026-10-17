# Case Files — investigative blog

Astro 7 static site. Markdown/MDX posts, plus an evidence shelf of raw files (datasets, code, charts) with build-computed hashes. Node >= 22.12.

```sh
npm install
npm run dev          # drafts visible
npm run verify       # astro check + evidence parity + build
npm run build:drafts # build including drafts (previews only)
```

## Add a post
Create `src/content/posts/<slug>.mdx`. Required frontmatter: `title`, `description`, `date`. Optional: `kicker`, `updated`, `draft`, `tags` (kebab-case), `evidence` (ids of evidence entries), `sources`, `series`.
Cite with `import Cite from '../../components/Cite.astro'` then `<Cite id="source-id" />`; the id must exist in the post's `sources` frontmatter or the build fails. Footnotes (`[^1]`) work for asides. `draft: true` posts show in `astro dev` and with `SHOW_DRAFTS=true`, and are excluded from `npm run build`, RSS and the sitemap.

## Add an evidence item
1. Put files in `public/files/<id>/` (served at `/files/<id>/<file>`).
2. Create `src/content/evidence/<id>.mdx` declaring every file under `files`, with exactly one `role: primary`. `synthetic` is required; synthetic items need `provenance.generator`.
3. Size and SHA-256 are computed at build; never type them. `npm run check` fails on orphan dirs, entries without files, and undeclared files.
Embed in a post with `<EvidenceEmbed id="<id>" />`.

## Add an island
Copy `src/components/islands/SwarmReplay.astro` and `src/islands/swarm-replay.ts`, add the name to the `island` enum in `src/content.config.ts`, and register the component in `src/layouts/Evidence.astro`. Keep the IntersectionObserver + dynamic `import()` pattern so d3 stays out of the shared bundle.

## Deploy
Set `SITE.url` in `src/site.ts` first (and the Sitemap line in `public/robots.txt`). `base` is `/`, so use a custom domain or a user site.
- Cloudflare Pages: build `npm run build`, output `dist`, env `NODE_VERSION=22`; `_headers` applies.
- GitHub Pages: official `withastro/action` workflow. `_headers` is ignored (the `.py` View link may download).
- Netlify: build `npm run build`, publish `dist`, `NODE_VERSION=22`; `_headers` applies.

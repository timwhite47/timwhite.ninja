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
Cite with `import Cite from '../../components/Cite.astro'` then `<Cite id="source-id" />`; the id must exist in the post's `sources` frontmatter or the build fails. Allowed `lang` values for code previews: python, javascript, typescript, json, csv, shell, markdown, text. Footnotes (`[^1]`) work for asides. `draft: true` posts show in `astro dev` and with `SHOW_DRAFTS=true`, and are excluded from `npm run build`, RSS and the sitemap.

## Add an evidence item
1. Put files in `public/files/<id>/` (served at `/files/<id>/<file>`).
2. Create `src/content/evidence/<id>.mdx` declaring every file under `files`, with exactly one `role: primary`. `synthetic` is required; synthetic items need `provenance.generator`.
3. Size and SHA-256 are computed at build; never type them. `npm run check` fails on orphan dirs, entries without files, and undeclared files.
Allowed values: `kind` = dataset | code | chart | factsheet; `license` = CC-BY-4.0 | CC-BY-SA-4.0 | CC0-1.0 | MIT | Apache-2.0 | All-Rights-Reserved; file `role` = primary | supporting | script | rendered; file `lang` = python | javascript | typescript | json | csv | shell | markdown | text. `draft: true` evidence has no page, is excluded from lists, and its `public/files/<id>/` directory is stripped from the production build (set `SHOW_DRAFTS=true` to keep it); a published post cannot embed it. Broken `evidence`/`related` references fail the build.
Embed in a post (add the imports under the frontmatter):
```mdx
import EvidenceEmbed from '../../components/EvidenceEmbed.astro';
import SwarmReplay from '../../components/islands/SwarmReplay.astro';

<EvidenceEmbed id="<id>" />
<SwarmReplay evidence="<id>" caption="..." />
```

## Add an island
Copy `src/components/islands/SwarmReplay.astro` and `src/islands/swarm-replay.ts`, add the name to the `island` enum in `src/content.config.ts`, and register the component in `src/layouts/Evidence.astro`. Keep the IntersectionObserver + dynamic `import()` pattern so d3 stays out of the shared bundle.

## Deploy
Live at `https://timwhite.ninja` via GitHub Pages: `.github/workflows/deploy.yml` builds and deploys on every push to `main`. `SITE.url` in `src/site.ts` and `public/CNAME` carry the domain. DNS, Pages settings and email authentication are in [SETUP.md](SETUP.md).

GitHub Pages ignores `public/_headers`, so the `.py` "View" link may download instead of displaying. Cloudflare Pages or Netlify would honor it (build `npm run build`, output `dist`, `NODE_VERSION=22`).

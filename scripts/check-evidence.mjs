// Evidence parity check. Node built-ins only.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const filesDir = path.join(root, 'public/files');
const evDir = path.join(root, 'src/content/evidence');
const postsDir = path.join(root, 'src/content/posts');
const errors = [];

const dirs = existsSync(filesDir)
  ? readdirSync(filesDir).filter((d) => statSync(path.join(filesDir, d)).isDirectory())
  : [];
const entries = existsSync(evDir)
  ? readdirSync(evDir).filter((f) => f.endsWith('.mdx') && !f.startsWith('_')).map((f) => f.slice(0, -4))
  : [];

for (const d of dirs) if (!entries.includes(d)) errors.push(`orphan dir public/files/${d}/ has no src/content/evidence/${d}.mdx`);
for (const e of entries) if (!dirs.includes(e)) errors.push(`evidence entry ${e}.mdx has no public/files/${e}/ directory`);

for (const d of dirs.filter((d) => entries.includes(d))) {
  const text = readFileSync(path.join(evDir, `${d}.mdx`), 'utf8');
  for (const f of readdirSync(path.join(filesDir, d))) {
    if (!text.includes(f)) errors.push(`undeclared file public/files/${d}/${f} is not mentioned in ${d}.mdx`);
  }
}

for (const dir of [postsDir, evDir]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const text = readFileSync(path.join(dir, f), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const body = text.slice(fm.length);
    // strip JSX comments so documentation examples are not checked
    const live = body.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    for (const m of live.matchAll(/<Cite\s+id="([^"]+)"/g)) {
      if (!new RegExp(`id:\\s*["']?${m[1]}["']?(?![\\w-])`).test(fm))
        errors.push(`${path.relative(root, path.join(dir, f))}: <Cite id="${m[1]}"> has no matching source in frontmatter`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `check-evidence: ${e}`).join('\n'));
  process.exit(1);
}
console.log(`check-evidence: ${dirs.length} evidence dirs in parity with ${entries.length} entries (${dirs.join(', ')})`);

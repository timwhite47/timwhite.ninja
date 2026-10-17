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
  const fmText = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const declared = new Set([...fmText.matchAll(/path:\s*["']?([A-Za-z0-9._-]+)/g)].map((m) => m[1]));
  for (const f of readdirSync(path.join(filesDir, d))) {
    if (!declared.has(f)) errors.push(`undeclared file public/files/${d}/${f} is not declared under files: in ${d}.mdx`);
  }
}

for (const dir of [postsDir, evDir]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const text = readFileSync(path.join(dir, f), 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = m?.[1] ?? '';
    const body = text.slice(m ? m[0].length : 0);
    const rel = path.relative(root, path.join(dir, f));
    const refDir = (field, targetDir) => {
      const arr = fm.match(new RegExp(`^${field}:\\s*\\[([^\\]]*)\\]`, 'm'));
      if (!arr) return;
      for (const id of arr[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean))
        if (!existsSync(path.join(targetDir, `${id}.mdx`)))
          errors.push(`${rel}: ${field} references unknown "${id}"`);
    };
    if (dir === postsDir) refDir('evidence', evDir);
    else refDir('related', postsDir);
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

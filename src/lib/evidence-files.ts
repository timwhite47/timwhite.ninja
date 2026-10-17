import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';
import type { BundledLanguage } from 'shiki';

export interface ResolvedFile {
  path: string;
  label: string;
  role: 'primary' | 'supporting' | 'script' | 'rendered';
  url: string;
  abs: string;
  bytes: number;
  sha256: string;
  mediaType: string;
  lang: BundledLanguage | 'text';
}

const MEDIA: Record<string, string> = {
  csv: 'text/csv',
  json: 'application/json',
  py: 'text/x-python',
  js: 'text/javascript',
  ts: 'text/plain',
  ipynb: 'application/x-ipynb+json',
  svg: 'image/svg+xml',
  png: 'image/png',
  md: 'text/markdown',
  txt: 'text/plain',
};

const LANG: Record<string, BundledLanguage | 'text'> = {
  csv: 'csv',
  json: 'json',
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  sh: 'shell',
  md: 'markdown',
  txt: 'text',
};

const ext = (p: string) => p.split('.').pop()?.toLowerCase() ?? '';

export function resolveFiles(entry: CollectionEntry<'evidence'>): ResolvedFile[] {
  return entry.data.files.map((f) => {
    const rel = `public/files/${entry.id}/${f.path}`;
    const abs = path.join(process.cwd(), rel);
    if (!existsSync(abs)) {
      throw new Error(`evidence "${entry.id}" declares "${f.path}" but ${rel} does not exist`);
    }
    const buf = readFileSync(abs);
    const e = ext(f.path);
    return {
      path: f.path,
      label: f.label,
      role: f.role,
      url: `/files/${entry.id}/${f.path}`,
      abs,
      bytes: statSync(abs).size,
      sha256: createHash('sha256').update(buf).digest('hex'),
      mediaType: MEDIA[e] ?? 'application/octet-stream',
      lang: f.lang ?? LANG[e] ?? 'text',
    };
  });
}

import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sourcesSchema, tagSchema } from './schemas/source';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string().min(1).max(120),
      description: z.string().min(1).max(300),
      kicker: z.string().max(60).optional(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      tags: z.array(tagSchema).default([]),
      evidence: z.array(reference('evidence')).default([]),
      sources: sourcesSchema,
      series: z.string().optional(),
    })
    .refine((d) => !d.updated || d.updated >= d.date, { message: 'updated precedes date' }),
});

export const evidenceKind = z.enum(['dataset', 'code', 'chart', 'factsheet']);
export const licenseId = z.enum([
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'CC0-1.0',
  'MIT',
  'Apache-2.0',
  'All-Rights-Reserved',
]);
export const fileRole = z.enum(['primary', 'supporting', 'script', 'rendered']);
export const previewLang = z.enum([
  'python',
  'javascript',
  'typescript',
  'json',
  'csv',
  'shell',
  'markdown',
  'text',
]);

const evidenceFile = z.object({
  path: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  label: z.string().min(1),
  role: fileRole.default('supporting'),
  lang: previewLang.optional(),
});

const evidence = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/evidence' }),
  schema: z
    .object({
      title: z.string().min(1).max(120),
      summary: z.string().min(1).max(300),
      kind: evidenceKind,
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      synthetic: z.boolean(),
      license: licenseId,
      tags: z.array(tagSchema).default([]),
      files: z
        .array(evidenceFile)
        .min(1)
        .refine((f) => f.filter((x) => x.role === 'primary').length === 1, {
          message: 'exactly one primary file',
        })
        .refine((f) => new Set(f.map((x) => x.path)).size === f.length, {
          message: 'duplicate file path',
        }),
      provenance: z.object({
        method: z.string().min(1),
        generator: z
          .object({
            tool: z.string(),
            version: z.string().optional(),
            seed: z.union([z.string(), z.number()]).optional(),
            command: z.string().optional(),
          })
          .optional(),
        producedAt: z.coerce.date(),
        caveats: z.array(z.string()).default([]),
      }),
      sources: sourcesSchema,
      related: z.array(reference('posts')).default([]),
      island: z.enum(['swarm-replay']).optional(),
      figure: z
        .object({
          file: z.string(),
          alt: z.string().min(1),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .optional(),
    })
    .superRefine((d, ctx) => {
      if (d.synthetic && !d.provenance.generator)
        ctx.addIssue({
          code: 'custom',
          message: 'synthetic evidence must declare provenance.generator',
          path: ['provenance', 'generator'],
        });
      if (d.kind === 'chart' && !d.figure)
        ctx.addIssue({ code: 'custom', message: 'chart requires figure', path: ['figure'] });
      if (d.figure && !d.files.some((f) => f.path === d.figure!.file))
        ctx.addIssue({
          code: 'custom',
          message: 'figure.file must be listed in files',
          path: ['figure', 'file'],
        });
      if (d.kind === 'factsheet' && d.sources.length === 0)
        ctx.addIssue({
          code: 'custom',
          message: 'a factsheet without sources is an opinion',
          path: ['sources'],
        });
      if (
        d.kind === 'code' &&
        !d.files.some((f) => f.role === 'primary' && /\.(py|js|ts|sh|ipynb)$/.test(f.path))
      )
        ctx.addIssue({
          code: 'custom',
          message: 'code evidence needs a primary code file',
          path: ['files'],
        });
    }),
});

export const collections = { posts, evidence };

import { z } from 'astro/zod';

export const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const tagSchema = z.string().regex(kebab).min(2).max(32);

export const sourceSchema = z.object({
  id: z.string().regex(kebab),
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().optional(),
  author: z.string().optional(),
  date: z.coerce.date().optional(),
  accessed: z.coerce.date(),
  archive: z.url().optional(),
  note: z.string().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const sourcesSchema = z
  .array(sourceSchema)
  .default([])
  .refine((l) => new Set(l.map((s) => s.id)).size === l.length, { message: 'duplicate source id' });

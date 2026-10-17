import { getCollection, type CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'posts'> | CollectionEntry<'evidence'>;

export function isPublished(e: Entry): boolean {
  return !e.data.draft || import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';
}

const byDateDesc = <T extends Entry>(a: T, b: T) => b.data.date.valueOf() - a.data.date.valueOf();

export async function getPosts(): Promise<CollectionEntry<'posts'>[]> {
  return (await getCollection('posts')).filter(isPublished).sort(byDateDesc);
}

export async function getEvidence(): Promise<CollectionEntry<'evidence'>[]> {
  return (await getCollection('evidence')).filter(isPublished).sort(byDateDesc);
}

export interface TagBucket {
  posts: CollectionEntry<'posts'>[];
  evidence: CollectionEntry<'evidence'>[];
}

export async function collectTags(): Promise<Map<string, TagBucket>> {
  const map = new Map<string, TagBucket>();
  const bucket = (t: string) => {
    let b = map.get(t);
    if (!b) map.set(t, (b = { posts: [], evidence: [] }));
    return b;
  };
  for (const p of await getPosts()) for (const t of p.data.tags) bucket(t).posts.push(p);
  for (const e of await getEvidence()) for (const t of e.data.tags) bucket(t).evidence.push(e);
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/** Published evidence referenced by a post. */
export async function evidenceForPost(post: CollectionEntry<'posts'>) {
  const ids = new Set(post.data.evidence.map((r) => r.id));
  return (await getEvidence()).filter((e) => ids.has(e.id));
}

/** Published posts that reference an evidence item (from either direction). Never returns drafts. */
export async function postsForEvidence(entry: CollectionEntry<'evidence'>) {
  const related = new Set(entry.data.related.map((r) => r.id));
  return (await getPosts()).filter(
    (p) => related.has(p.id) || p.data.evidence.some((r) => r.id === entry.id),
  );
}

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'posts'> | CollectionEntry<'evidence'>;

export function isPublished(e: Entry): boolean {
  return !e.data.draft || import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';
}

const byDateDesc = <T extends Entry>(a: T, b: T) => b.data.date.valueOf() - a.data.date.valueOf();

let refsChecked: Promise<void> | undefined;

/** Fail the build when any `evidence` / `related` reference points at a missing entry. */
function assertRefs(): Promise<void> {
  refsChecked ??= (async () => {
    const check = async (
      coll: 'posts' | 'evidence',
      id: string,
      field: string,
      target: 'posts' | 'evidence',
      refs: { id: string }[],
    ) => {
      for (const ref of refs) {
        if (!(await getEntry(target, ref.id)))
          throw new Error(`${coll}/${id}: ${field} references unknown "${ref.id}"`);
      }
    };
    for (const p of await getCollection('posts')) await check('posts', p.id, 'evidence', 'evidence', p.data.evidence);
    for (const e of await getCollection('evidence')) await check('evidence', e.id, 'related', 'posts', e.data.related);
  })();
  return refsChecked;
}

export async function getPosts(): Promise<CollectionEntry<'posts'>[]> {
  await assertRefs();
  return (await getCollection('posts')).filter(isPublished).sort(byDateDesc);
}

export async function getEvidence(): Promise<CollectionEntry<'evidence'>[]> {
  await assertRefs();
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

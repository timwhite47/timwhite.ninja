import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/collections';
import { SITE } from '../site';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: SITE.title,
    description: SITE.tagline,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: `/posts/${p.id}/`,
      categories: p.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}

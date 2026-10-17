import { defineMiddleware } from 'astro:middleware';
import { getEntry } from 'astro:content';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const slug = ctx.params.slug;
  if (ctx.routePattern === '/posts/[slug]' && slug) {
    ctx.locals.sources = (await getEntry('posts', slug))?.data.sources ?? [];
  } else if (ctx.routePattern === '/evidence/[slug]' && slug) {
    ctx.locals.sources = (await getEntry('evidence', slug))?.data.sources ?? [];
  } else {
    ctx.locals.sources = [];
  }
  return next();
});

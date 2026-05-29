import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const getByProduct = query({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    return await ctx.db.query('reviews')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect()
      .then((r) => r.filter((rev) => rev.isApproved));
  },
});

export const getStats = query({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    const reviews = await ctx.db.query('reviews')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect()
      .then((r) => r.filter((rev) => rev.isApproved));
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return { avg: Math.round(avg * 10) / 10, count: reviews.length };
  },
});

async function recomputeRating(ctx: MutationCtx, productId: Id<'products'>) {
  const reviews = (await ctx.db.query('reviews').withIndex('by_product', (q) => q.eq('productId', productId)).collect()).filter((r) => r.isApproved);
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  await ctx.db.patch(productId, { rating: avg, reviewCount: count });
}

export const create = mutation({
  args: {
    productId: v.id('products'),
    authorName: v.string(),
    rating: v.number(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('reviews', {
      ...args,
      isApproved: true,
      createdAt: Date.now(),
    });
    await recomputeRating(ctx, args.productId);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('reviews') },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (review) await recomputeRating(ctx, review.productId);
  },
});

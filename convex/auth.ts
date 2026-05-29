import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Constant-time credential comparison (Web Crypto is available in Convex runtime).
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) throw new Error('Admin not configured');

    // Constant-time comparison to avoid timing attacks (both always evaluated)
    const emailMatch = await safeEqual(args.email.toLowerCase(), adminEmail.toLowerCase());
    const passMatch = await safeEqual(args.password, adminPassword);
    if (!emailMatch || !passMatch) {
      throw new Error('Սխալ էլ. փոստ կամ գաղտնաբառ');
    }

    let user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', adminEmail.toLowerCase()))
      .unique();

    if (!user) {
      const id = await ctx.db.insert('users', {
        name: 'Admin',
        email: adminEmail.toLowerCase(),
        role: 'admin',
        isActive: true,
        createdAt: Date.now(),
      });
      user = (await ctx.db.get(id))!;
    }

    const sessionToken = crypto.randomUUID();
    await ctx.db.patch(user._id, {
      sessionToken,
      sessionExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return { userId: user._id, sessionToken, name: user.name, email: user.email, role: user.role };
  },
});

export const me = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Use index — no full table scan
    const user = await ctx.db
      .query('users')
      .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
      .unique();
    if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) return null;
    return { id: user._id, name: user.name, email: user.email, role: user.role };
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { sessionToken: undefined, sessionExpiry: undefined });
    }
  },
});

import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { api } from './_generated/api';

function fmt(n: number): string {
  return n.toLocaleString('hy-AM');
}

export const sendOrderNotification = internalAction({
  args: {
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    total: v.number(),
    itemsCount: v.number(),
  },

  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get, {});
    const token = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    if (!token || !chatId) return;

    const text = [
      `<b>🛒 Նոր պատվեր</b>`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>📝 Պատվերի համար՝</b> <code>${args.orderNumber}</code>`,
      `<b>👤 Անուն՝</b> ${args.customerName}`,
      `<b>📞 Հեռախոս՝</b> ${args.customerPhone}`,
      `<b>📦 Ապրանքների քանակ՝</b> ${args.itemsCount} հատ`,
      `<b>💰 Ընդհանուր գումար՝</b> <b>${fmt(args.total)} ֏</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `<a href="https://autoparts.am/admin/orders">📋 Դիտել բոլոր պատվերները</a>`,
    ].join('\n');

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
    } catch {}
  },
});

export const sendTest = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const caller = await ctx.runQuery(api.auth.me, { sessionToken: args.sessionToken });
    if (!caller || caller.role !== 'admin') throw new Error('Admin access required');

    const settings = await ctx.runQuery(api.settings.get, {});
    const token = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    if (!token || !chatId) throw new Error('Telegram կարգավորումներ չկան');
    const testHtml = [
      `<b>✅ AutoParts — Թեստային հաղորդագրություն</b>`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>Բոտը աշխատում է՝</b> ✅`,
      `<b>🕐 Ժամը՝</b> ${new Date().toLocaleString('hy-AM')}`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `<i>Շնորհակալություն, որ ընտրել եք մեզ</i> 🚗`,
    ].join('\n');
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: testHtml, parse_mode: 'HTML' }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!res.ok || !data?.ok) throw new Error(data?.description || `Telegram error (HTTP ${res.status})`);
    return true;
  },
});

export const sendDailyReport = action({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(api.settings.get, {});
    const token = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    if (!token || !chatId) return;
    const orders = await ctx.runQuery(api.orders.listAdmin, { sessionToken: '__internal__' }).catch(() => [] as Array<Record<string, unknown>>);
    const today = orders.filter((o: Record<string, unknown>) => Number(o.createdAt) > Date.now() - 86400000);
    const revenue = today.reduce((s: number, o: Record<string, unknown>) => s + Number(o.total), 0);
    const text = [
      `<b>📊 Օրվա հաշվետվություն</b>`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>📦 Պատվերներ այսօր՝</b> ${today.length}`,
      `<b>💰 Եկամուտ՝</b> ${fmt(revenue)} ֏`,
      `<b>🕐 Ամսաթիվ՝</b> ${new Date().toLocaleDateString('hy-AM')}`,
      `━━━━━━━━━━━━━━━━━━`,
      `<a href="https://autoparts.am/admin/orders">📋 Դիտել բոլոր պատվերները</a>`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  },
});

export const sendLowStockAlert = action({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(api.settings.get, {});
    const token = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    const threshold = settings?.lowStockThreshold ?? 5;
    if (!token || !chatId) return;
    // Note: simplified check — in production would query products with stock <= threshold
    const text = [
      `<b>⚠️ Ցածր պաշարի մասին ծանուցում</b>`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>Շեմ՝</b> ${threshold} հատ`,
      `<a href="https://autoparts.am/admin/products">📋 Դիտել ապրանքները</a>`,
      `━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  },
});

export const sendCartRecovery = action({
  args: { sessionToken: v.string(), cartItems: v.number(), cartTotal: v.number() },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get, {});
    const token = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    if (!token || !chatId) return;
    const text = [
      `<b>🛒 Լքված զամբյուղ</b>`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>📦 Ապրանքներ՝</b> ${args.cartItems} հատ`,
      `<b>💰 Գումար՝</b> ${fmt(args.cartTotal)} ֏`,
      `<a href="https://autoparts.am/cart">🛒 Վերադառնալ զամբյուղ</a>`,
      `━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  },
});

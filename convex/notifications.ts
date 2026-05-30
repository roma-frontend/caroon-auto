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
      `━━━━━━━━━━━━━━━`,
      `<b>📝 Համար:</b> <code>${args.orderNumber}</code>`,
      `<b>👤 Հաճախորդ:</b> ${args.customerName}`,
      `<b>📞 Հեռախոս:</b> ${args.customerPhone}`,
      `<b>📦 Ապրանքներ:</b> ${args.itemsCount} հատ`,
      `<b>💰 Գումար:</b> <b>${fmt(args.total)} ֏</b>`,
      `━━━━━━━━━━━━━━━`,
      ``,
      `<a href="https://autoparts.am/admin/orders">📋 Բացել պատվերները</a>`,
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
      `<b>✅ AutoParts — Թեստային ծանուցում</b>`,
      ``,
      `━━━━━━━━━━━━━━━`,
      `<b>Բոտը աշխատում է:</b> ✅`,
      `<b>🕐 Ժամանակ:</b> ${new Date().toLocaleString('hy-AM')}`,
      `━━━━━━━━━━━━━━━`,
      ``,
      `<i>Շնորհակալություն մեզ հետ լինելու համար</i> 🚗`,
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

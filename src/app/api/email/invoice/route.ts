import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function requireAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token || !process.env.JWT_SECRET) return false;
    const { payload } = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
  }

  let body: { to?: string; orderNumber?: string; total?: string; bankAccount?: string; bankName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { to, orderNumber, total, bankAccount, bankName } = body;
  if (!to || !orderNumber || !total) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // HTML-escape all user-supplied values
  const html = `
    <h2>Պատվեր #${escapeHtml(orderNumber)}</h2>
    <p>Ընդհատված պատվեր: <strong>${escapeHtml(total)} ֏</strong></p>
    <h3>Բանկային հաշիվ:</h3>
    <p>Բանկ: ${escapeHtml(bankName ?? '')}<br/>Հաշիվ: <code>${escapeHtml(bankAccount ?? '')}</code></p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Caroon <noreply@caroon.am>',
      to: escapeHtml(to),
      subject: `Պատվեր #${escapeHtml(orderNumber)}`,
      html,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  return NextResponse.json({ success: true });
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ShoppingBag, DollarSign, Clock, FileDown, Search, Phone, MessageSquare, Smartphone, FileSpreadsheet, CheckCircle, Truck, Package } from 'lucide-react';
import { formatPrice, formatDateHy } from '@/lib/formatters';
import { toast } from 'sonner';
import { Id } from '../../../../convex/_generated/dataModel';
import { useReveal, revealStyle } from '@/lib/motion';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/hooks/useSettings';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Սպասում', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Հաստատվել է', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Կատարվում է', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Ուղարկվել է', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Առաքված', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Չեղյալ', color: 'bg-red-100 text-red-800' },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  awaiting: { label: 'Սպասում', color: 'bg-orange-100 text-orange-800' },
  paid: { label: 'Վճարվել է', color: 'bg-green-100 text-green-800' },
  refunded: { label: 'Վերադարձվել է', color: 'bg-red-100 text-red-800' },
};

const PAYMENT_LABELS: Record<string, string> = { cash: 'Կանխիկ', card: 'Քարտով', idram: 'Idram', easypay: 'EasyPay', transfer: 'Բանկային փոխանցում' };

function escapeHtml(str: string): string {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function exportPDF(o: Record<string, unknown>) {
  const html = [
    '<html><head><meta charset="utf-8"><title>Invoice</title>',
    '<style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:auto}',
    'h1{color:#333}table{width:100%;border-collapse:collapse;margin:20px 0}',
    'th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}',
    '.total{font-size:1.3em;font-weight:bold;text-align:right;margin-top:20px}</style></head><body>',
    `<h1>Invoice #${escapeHtml(String(o.orderNumber))}</h1>`,
    `<p><strong>Name:</strong> ${escapeHtml(String(o.customerName))}<br>`,
    `${escapeHtml(String(o.customerPhone))}<br>${escapeHtml(String(o.customerEmail))}<br>`,
    `${escapeHtml(String(o.shippingAddress))}</p>`,
    `<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>`,
    (o.items as Array<Record<string, unknown>> || []).map((i: Record<string, unknown>) =>
      `<tr><td>${escapeHtml(String(i.name))}</td><td>${Number(i.quantity)}</td><td>${Number(i.price).toLocaleString()} ֏</td><td>${(Number(i.price) * Number(i.quantity)).toLocaleString()} ֏</td></tr>`
    ).join(''),
    `</tbody></table><p class="total">Total: ${Number(o.total).toLocaleString()} ֏</p></body></html>`,
  ].join('\n');
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
  else {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 3000);
  }
}

function OrderCard({ order, sessionToken, index, settings }: { order: Record<string, unknown>; sessionToken: string; index: number; settings: ReturnType<typeof useSettings> }) {
  const { ref, visible } = useReveal();
  const updateStatus = useMutation(api.orders.updateStatus);
  const status = STATUS_MAP[order.status as string] ?? STATUS_MAP.pending;
  const payment = PAYMENT_MAP[order.paymentStatus as string] ?? PAYMENT_MAP.awaiting;

  return (
    <div ref={ref} style={revealStyle(visible, index * 0.03)}>
      <div className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-all hover:shadow-md">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-bold">{String(order.orderNumber)}</span>
            <Badge className={`${status.color} border-0 text-[10px]`}>{status.label}</Badge>
            <Badge className={`${payment.color} border-0 text-[10px]`}>{payment.label}</Badge>
            {order.paymentMethod ? <Badge variant="outline" className="text-[10px]">{PAYMENT_LABELS[String(order.paymentMethod)] || String(order.paymentMethod)}</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm font-medium">{String(order.customerName)}</p>
          <p className="text-xs text-muted-foreground">{String(order.customerPhone)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-primary">{formatPrice(Number(order.total))}</p>
          <p className="text-xs text-muted-foreground">{formatDateHy(Number(order.createdAt))}</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex gap-1">
            <Select value={String(order.status)} onValueChange={(v) => { if (v) updateStatus({ sessionToken, id: order._id as Id<'orders'>, status: v as 'pending' }); }}>
              <SelectTrigger className="h-7 w-24 text-[10px]"><span>{STATUS_MAP[String(order.status)]?.label ?? String(order.status)}</span></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant={order.paymentStatus === 'paid' ? 'outline' : 'default'} className="h-7 gap-1 text-[10px] px-2" onClick={() => updateStatus({ sessionToken, id: order._id as Id<'orders'>, paymentStatus: order.paymentStatus === 'paid' ? 'awaiting' as const : 'paid' as const })}>
              {order.paymentStatus === 'paid' ? '✗' : '✓'}
            </Button>
          </div>
          <div className="flex gap-1">
            <a href={`tel:${String(order.customerPhone)}`} className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent"><Phone className="h-3 w-3" /></a>
            {settings?.whatsapp && <a href={`https://wa.me/${String(order.customerPhone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md border text-green-600 hover:bg-green-50"><MessageSquare className="h-3 w-3" /></a>}
            <button onClick={() => exportPDF(order as { orderNumber: string; customerName: string; customerPhone: string; customerEmail: string; shippingAddress: string; items: { name: string; price: number; quantity: number }[]; total: number; createdAt: number })} className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent"><FileDown className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { sessionToken } = useAuth();
  const orders = useQuery(api.orders.listAdmin, sessionToken ? { sessionToken } : 'skip');
  const settings = useSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const totalRevenue = orders?.reduce((s, o) => s + o.total, 0) ?? 0;
  const paidOrders = orders?.filter((o) => o.paymentStatus === 'paid').length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === 'pending').length ?? 0;

  const filtered = orders?.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(o.orderNumber).toLowerCase().includes(q) || String(o.customerName).toLowerCase().includes(q) || String(o.customerPhone).includes(q);
    }
    return true;
  });

  const statCards = [
    { label: 'Ընդհանուր', value: orders?.length ?? 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Վճարված', value: paidOrders, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Սպասող', value: pendingOrders, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Եկամուտ', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Պատվերների վահանակ</h1>
        <a href="/api/export/orders" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <FileSpreadsheet className="h-4 w-4" /> CSV
        </a>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg}`}>
                  <Icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & filter */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Որոնել պատվեր..." className="h-9 pl-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v !== null) setStatusFilter(v); }}>
          <SelectTrigger className="h-9 w-32 text-xs"><span>{statusFilter === 'all' ? 'Բոլորը' : STATUS_MAP[statusFilter]?.label || statusFilter}</span></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Բոլորը</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {filtered?.map((order, i) => <OrderCard key={String(order._id)} order={order as Record<string, unknown>} sessionToken={sessionToken ?? ''} index={i} settings={settings} />)}
      </div>

      {filtered?.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">Պատվերներ չեն գտնվել</p>
        </div>
      )}
    </div>
  );
}

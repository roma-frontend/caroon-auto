'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Sparkles, Zap, Truck, Clock, Gift, Percent, Bell, Star } from 'lucide-react';
import Link from 'next/link';

type AnnouncementStyle = 'info' | 'sale' | 'promo' | 'dark' | 'custom';

interface AnnouncementConfig {
  text?: string;
  type?: AnnouncementStyle;
  link?: string;
  linkText?: string;
  dismissible?: boolean;
  icon?: 'sparkles' | 'zap' | 'truck' | 'clock' | 'gift' | 'percent' | 'bell' | 'star';
  gradient?: string;
  /** Legacy plain text fallback */
  _raw?: string;
}

function parseAnnouncement(raw: string): AnnouncementConfig {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {}
  return { text: raw, type: 'info', _raw: raw };
}

const STYLES: Record<AnnouncementStyle, { bg: string; text: string; glow: string }> = {
  info: {
    bg: 'bg-gradient-to-r from-primary/90 via-primary to-primary/90',
    text: 'text-primary-foreground',
    glow: 'bg-primary/20',
  },
  sale: {
    bg: 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500',
    text: 'text-white',
    glow: 'bg-rose-400/20',
  },
  promo: {
    bg: 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500',
    text: 'text-white',
    glow: 'bg-violet-400/20',
  },
  dark: {
    bg: 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900',
    text: 'text-neutral-100',
    glow: 'bg-white/5',
  },
  custom: {
    bg: 'bg-gradient-to-r from-primary/90 via-primary to-primary/90',
    text: 'text-primary-foreground',
    glow: 'bg-primary/20',
  },
};

const ICONS = {
  sparkles: Sparkles,
  zap: Zap,
  truck: Truck,
  clock: Clock,
  gift: Gift,
  percent: Percent,
  bell: Bell,
  star: Star,
};

function ShinyOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -inset-[100%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),rgba(255,255,255,0.12),rgba(255,255,255,0.06),transparent)]" style={{ animation: 'announcement-shimmer 4s ease-in-out infinite' }} />
    </div>
  );
}

export function AnnouncementBar({ raw, phone }: { raw?: string | null; phone?: string | null }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (raw) {
      const key = `announcement_dismissed_${btoa(raw).slice(0, 32)}`;
      setDismissed(localStorage.getItem(key) === '1');
    }
  }, [raw]);

  if (!raw || dismissed) return null;

  const config = parseAnnouncement(raw);
  const style = STYLES[config.type ?? 'info'];
  const Icon = config.icon ? ICONS[config.icon] : null;

  const dismiss = () => {
    const key = `announcement_dismissed_${btoa(raw).slice(0, 32)}`;
    localStorage.setItem(key, '1');
    setDismissed(true);
  };

  const content = (
    <div className={`relative overflow-hidden ${style.bg} ${style.text}`}>
      <ShinyOverlay />

      <div className="mx-auto flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs font-medium leading-tight"
        style={{ maxWidth: 'var(--container-max)' }}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}

        <span className="line-clamp-1 sm:line-clamp-none">{config.text}</span>

        {config.link && (
          <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap underline-offset-2 hover:underline">
            {config.linkText || 'Իմանալ ավելին'} <ArrowRight className="h-3 w-3" />
          </span>
        )}

        {phone && !config.link && (
          <span className="hidden sm:inline opacity-60">• {phone}</span>
        )}

        {config.dismissible !== false && (
          <button onClick={dismiss} className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100 hover:bg-black/10" aria-label="Close">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  if (config.link && !config.dismissible) {
    return (
      <Link href={config.link} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

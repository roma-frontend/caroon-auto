'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Disc3, CircleDot, Droplet, Filter, Lightbulb, BatteryCharging, Wrench, Gauge, Package, ChevronRight } from 'lucide-react';
import { useReveal, cardRevealStyle } from '@/lib/motion';

interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  productCount?: number;
  index?: number;
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tires: Disc3,
  discs: CircleDot,
  oils: Droplet,
  filters: Filter,
  brakes: Gauge,
  lamps: Lightbulb,
  batteries: BatteryCharging,
  accessories: Wrench,
};

export const CATEGORY_COLORS: Record<string, string> = {
  tires: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  discs: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  oils: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  filters: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  brakes: 'bg-red-500/15 text-red-600 dark:text-red-400',
  lamps: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  batteries: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  accessories: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
};

export function CategoryCard({ name, slug, description, productCount, index = 0 }: CategoryCardProps) {
  const { ref, visible } = useReveal();
  const Icon = CATEGORY_ICONS[slug] ?? Package;
  const color = CATEGORY_COLORS[slug] ?? 'bg-primary/10 text-primary';

  return (
    <Link href={`/categories/${slug}`}>
      <div ref={ref} style={cardRevealStyle(visible, index * 0.06)}>
        <div className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-tight transition-colors duration-200 group-hover:text-primary">{name}</h3>
            {productCount !== undefined ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{productCount} ապրանք</p>
            ) : description ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

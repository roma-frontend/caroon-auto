'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Id } from '../../convex/_generated/dataModel';
import { PRODUCT } from '@/lib/constants';

type FilterValues = Record<string, unknown>;
type Filters = { categoryId?: Id<'categories'>; minPrice?: number; maxPrice?: number; inStockOnly?: boolean; onSale?: boolean; minRating?: number; sort?: string; attributes?: FilterValues };

interface Props {
  categoryId?: Id<'categories'>;
  onFilterChange: (filters: Filters) => void;
  activeFilters: Filters;
}

export function ProductFilters({ categoryId, onFilterChange, activeFilters }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['category', 'price', 'sort', 'sale', 'rating']));
  const selectedCat = activeFilters.categoryId ?? categoryId;
  const filterDefs = useQuery(api.filters.getByCategory, selectedCat ? { categoryId: selectedCat } : 'skip');
  const categories = useQuery(api.categories.list, {});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const updateAttr = (slug: string, value: unknown) => {
    const attrs = { ...(activeFilters.attributes || {}) } as FilterValues;
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete attrs[slug];
    } else {
      attrs[slug] = value;
    }
    onFilterChange({ ...activeFilters, attributes: Object.keys(attrs).length > 0 ? attrs : undefined });
  };

  const toggleMultiselect = (slug: string, option: string) => {
    const attrs = (activeFilters.attributes || {}) as FilterValues;
    const current = (attrs[slug] as string[]) || [];
    const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
    updateAttr(slug, next);
  };

  const activeCount = (activeFilters.categoryId ? 1 : 0) + (activeFilters.minPrice ? 1 : 0) + (activeFilters.maxPrice ? 1 : 0) + (activeFilters.inStockOnly ? 1 : 0) + (activeFilters.onSale ? 1 : 0) + (activeFilters.minRating ? 1 : 0) + Object.keys(activeFilters.attributes || {}).length;

  const reset = () => onFilterChange({ sort: activeFilters.sort });

  return (
    <div className="mb-6">
      {/* Toggle + Sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {PRODUCT.filters}
          {activeCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">{activeCount}</Badge>}
        </Button>

        {/* Sort buttons */}
        <div className="flex gap-1 ml-auto">
          {[
            { key: 'newest', label: PRODUCT.sortNewest },
            { key: 'priceAsc', label: PRODUCT.sortPriceAsc },
            { key: 'priceDesc', label: PRODUCT.sortPriceDesc },
            { key: 'popular', label: PRODUCT.sortPopular },
          ].map((s) => (
            <Button key={s.key} variant={activeFilters.sort === s.key ? 'default' : 'ghost'} size="sm"
              onClick={() => onFilterChange({ ...activeFilters, sort: activeFilters.sort === s.key ? undefined : s.key })}
            >{s.label}</Button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {open && (
        <div className="mt-4 rounded-xl border bg-card p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">{PRODUCT.filters}</h3>
            <div className="flex gap-2">
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-xs h-7">
                  <RotateCcw className="h-3 w-3" /> Չեղարկել
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Category */}
            {!categoryId && categories && (
              <FilterSection title={'Կատեգորիա'} sectionKey="category" expanded={expandedSections} toggle={toggleSection}>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => {
                    const active = activeFilters.categoryId === c._id;
                    return (
                      <Badge key={c._id} variant={active ? 'default' : 'outline'}
                        className="cursor-pointer text-xs transition-colors hover:bg-primary/10"
                        onClick={() => onFilterChange({ ...activeFilters, categoryId: active ? undefined : c._id, attributes: undefined })}
                      >{c.name}</Badge>
                    );
                  })}
                </div>
              </FilterSection>
            )}

            {/* Price range */}
            <FilterSection title={'Գին'} sectionKey="price" expanded={expandedSections} toggle={toggleSection}>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {([[0, 10000], [10000, 30000], [30000, 60000], [60000, 0]] as [number, number][]).map(([min, max], i) => (
                  <Badge key={i} variant="outline" className="cursor-pointer text-xs transition-colors hover:bg-primary/10"
                    onClick={() => onFilterChange({ ...activeFilters, minPrice: min || undefined, maxPrice: max || undefined })}>
                    {max ? `${min / 1000}–${max / 1000} հազ ֏` : `${min / 1000} հազ ֏-ից`}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="number" placeholder="Նվազագույն" className="h-8 text-sm" value={activeFilters.minPrice ?? ''}
                  onChange={(e) => onFilterChange({ ...activeFilters, minPrice: e.target.value ? Number(e.target.value) : undefined })} />
                <Input type="number" placeholder="Առավելագույն" className="h-8 text-sm" value={activeFilters.maxPrice ?? ''}
                  onChange={(e) => onFilterChange({ ...activeFilters, maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </FilterSection>

            {/* In stock */}
            <FilterSection title={'Մնացորդ'} sectionKey="stock" expanded={expandedSections} toggle={toggleSection}>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded border-input" checked={!!activeFilters.inStockOnly}
                  onChange={(e) => onFilterChange({ ...activeFilters, inStockOnly: e.target.checked || undefined })} />
                {'Միայն առկա ապրանքներ'}
              </label>
            </FilterSection>

            {/* On sale */}
            <FilterSection title={'Զեղչ'} sectionKey="sale" expanded={expandedSections} toggle={toggleSection}>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded border-input" checked={!!activeFilters.onSale}
                  onChange={(e) => onFilterChange({ ...activeFilters, onSale: e.target.checked || undefined })} />
                {'Միայն զեղչված'}
              </label>
            </FilterSection>

            {/* Min rating */}
            <FilterSection title={'Գնահատական'} sectionKey="rating" expanded={expandedSections} toggle={toggleSection}>
              <div className="flex flex-wrap gap-1.5">
                {[4, 3, 2, 1].map((r) => (
                  <Badge key={r} variant={activeFilters.minRating === r ? 'default' : 'outline'}
                    className="cursor-pointer text-xs transition-colors hover:bg-primary/10"
                    onClick={() => onFilterChange({ ...activeFilters, minRating: activeFilters.minRating === r ? undefined : r })}>{r}★+</Badge>
                ))}
              </div>
            </FilterSection>

            {/* Dynamic category filters */}
            {filterDefs?.map((def) => (
              <FilterSection key={def._id} title={def.name} sectionKey={def.slug} expanded={expandedSections} toggle={toggleSection}>
                {def.type === 'select' && def.options && (
                  <div className="flex flex-wrap gap-1.5">
                    {def.options.map((opt) => {
                      const active = ((activeFilters.attributes as FilterValues)?.[def.slug]) === opt;
                      return (
                        <Badge key={opt} variant={active ? 'default' : 'outline'}
                          className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                          onClick={() => updateAttr(def.slug, active ? null : opt)}
                        >{opt}</Badge>
                      );
                    })}
                  </div>
                )}
                {def.type === 'multiselect' && def.options && (
                  <div className="flex flex-wrap gap-1.5">
                    {def.options.map((opt) => {
                      const selected = ((activeFilters.attributes as FilterValues)?.[def.slug] as string[]) || [];
                      const active = selected.includes(opt);
                      return (
                        <Badge key={opt} variant={active ? 'default' : 'outline'}
                          className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                          onClick={() => toggleMultiselect(def.slug, opt)}
                        >{opt}</Badge>
                      );
                    })}
                  </div>
                )}
                {def.type === 'boolean' && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="rounded border-input"
                      checked={!!((activeFilters.attributes as FilterValues)?.[def.slug])}
                      onChange={(e) => updateAttr(def.slug, e.target.checked || undefined)} />
                    {def.name}
                  </label>
                )}
                {def.type === 'range' && (
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Նվազ" className="h-8 text-sm"
                      onChange={(e) => updateAttr(def.slug, e.target.value ? Number(e.target.value) : null)} />
                    {def.unit && <span className="text-xs text-muted-foreground self-center">{def.unit}</span>}
                  </div>
                )}
              </FilterSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, sectionKey, expanded, toggle, children }: {
  title: string; sectionKey: string; expanded: Set<string>; toggle: (k: string) => void; children: React.ReactNode;
}) {
  const isOpen = expanded.has(sectionKey);
  return (
    <div className="space-y-2">
      <button onClick={() => toggle(sectionKey)} className="flex w-full items-center justify-between text-sm font-medium hover:text-primary transition-colors">
        {title}
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {isOpen && <div className="pt-1">{children}</div>}
    </div>
  );
}

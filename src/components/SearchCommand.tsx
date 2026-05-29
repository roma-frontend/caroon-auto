'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { formatPrice } from '@/lib/formatters';
import { Package } from 'lucide-react';

export function SearchCommand({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const term = q.trim();
  const results = useQuery(api.products.list, term.length >= 2 ? { search: term, limit: 8 } : 'skip');

  const go = (slug: string) => { onOpenChange(false); setQ(''); router.push(`/products/${slug}`); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Որոնում">
      <Command shouldFilter={false}>
        <CommandInput value={q} onValueChange={setQ} placeholder="Որոնել ապրանքներ..." />
        <CommandList>
          {term.length < 2 ? (
            <CommandEmpty>Մուտքագրեք առնվազն 2 նիշ</CommandEmpty>
          ) : results === undefined ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Որոնում...</div>
          ) : results.length === 0 ? (
            <CommandEmpty>Ոչ մի արդյունք</CommandEmpty>
          ) : (
            <CommandGroup heading="Ապրանքներ">
              {results.map((p) => (
                <CommandItem key={p._id} value={p._id} onSelect={() => go(p.slug)} className="gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-primary">{formatPrice(p.price)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

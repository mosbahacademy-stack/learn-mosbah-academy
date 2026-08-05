import Link from 'next/link';

import { cn } from '@/lib/utils';

type SectionNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-2xl border px-4 py-2 text-sm font-medium transition-colors',
            item.active
              ? 'border-brand-deep bg-brand-deep text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-brand/5 hover:text-brand'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
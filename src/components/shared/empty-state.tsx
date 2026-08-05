import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-brand/10 p-3 text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
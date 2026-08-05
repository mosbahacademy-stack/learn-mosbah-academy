import Link from 'next/link';

import { signOutAction } from '@/features/auth/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DashboardHeader({ badge, title, description, homeHref }: { badge: string; title: string; description?: string; homeHref: string }) {
  return (
    <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-white/20 bg-brand-deep px-6 py-6 shadow-glow">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.13),transparent_28%),radial-gradient(circle_at_88%_80%,rgba(245,130,32,0.2),transparent_30%)]" />
      <div className="fade-up">
        <Badge className="bg-white/12 text-white">{badge}</Badge>
        <h1 className="mt-3 text-3xl font-bold text-white">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200">{description}</p> : null}
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <Button variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20" asChild>
          <Link href={homeHref}>الرئيسية</Link>
        </Button>
        <form action={signOutAction}>
          <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white" type="submit">تسجيل الخروج</Button>
        </form>
      </div>
    </div>
  );
}
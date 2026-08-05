import Link from 'next/link';
import { ChartColumnBig, Sparkles, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BrandFooter } from '@/components/layout/brand-footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getLandingStats() {
  try {
    const supabase = createSupabaseAdminClient();
    const [studentsRes, coursesRes, lessonsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('lessons').select('id', { count: 'exact', head: true })
    ]);
    return [
      [String(studentsRes.count ?? 0), 'طالب مسجّل'],
      [String(coursesRes.count ?? 0), 'دورة منشورة'],
      [String(lessonsRes.count ?? 0), 'درس متاح']
    ] as [string, string][];
  } catch {
    return [['0', 'طالب مسجّل'], ['0', 'دورة منشورة'], ['0', 'درس متاح']] as [string, string][];
  }
}

const authFeatures: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Sparkles, text: 'متابعة دورية' },
  { icon: UsersRound, text: 'كادر متخصص' },
  { icon: ChartColumnBig, text: 'برامج متطورة' }
];

export async function AuthShell({ children }: { children: React.ReactNode }) {
  const highlights = await getLandingStats();
  return (
    <main className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef3fb_45%,#f8fbff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[65vh] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-brand-deep p-8 shadow-glow sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_88%_75%,rgba(245,130,32,0.22),transparent_28%)]" />
          <div className="relative z-10">
            <Badge className="bg-white/12 text-white">أكاديمية مصباح</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
              رحلتك نحو التميز والتفوق الدراسي تبدأ من هنا.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              محتوى تعليمي شامل، متابعة دقيقة، وبيئة تفاعلية حديثة صُممت لترافقك خطوة بخطوة نحو أفضل النتائج.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map(([value, label]) => (
                <Card key={label} className="rounded-[1.5rem] border-white/20 bg-white/12 p-4 backdrop-blur">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-200">{label}</div>
                </Card>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {authFeatures.map(({ icon: Icon, text }) => (
                <div key={text} className="rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur">
                  <Icon className="mb-3 h-5 w-5 text-accent" />
                  {text}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-2 text-sm text-slate-200">
              <div>
                العودة إلى <Link href="/" className="font-medium text-accent hover:underline">الصفحة الرئيسية</Link>
              </div>
              <div>واتساب: 0655198992</div>
              <div>البريد: mosbahacademy@gmail.com</div>
            </div>
          </div>
        </section>

        {children}
      </div>
      <BrandFooter />
    </main>
  );
}
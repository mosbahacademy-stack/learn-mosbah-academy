import Link from 'next/link';
import { ArrowLeft, BookOpen, BrainCircuit, GraduationCap, MapPinned, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrandFooter } from '@/components/layout/brand-footer';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getLandingStats() {
  try {
    const supabase = createSupabaseAdminClient();
    const [studentsRes, coursesRes, lessonsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('lessons').select('id', { count: 'exact', head: true })
    ]);
    return {
      students: studentsRes.count ?? 0,
      courses: coursesRes.count ?? 0,
      lessons: lessonsRes.count ?? 0
    };
  } catch {
    return { students: 0, courses: 0, lessons: 0 };
  }
}

const programs = [
  {
    icon: GraduationCap,
    title: 'الدعم المدرسي',
    tag: 'الأكثر طلبًا'
  },
  {
    icon: BookOpen,
    title: 'اللغات الأجنبية',
    tag: 'لغات'
  },
  {
    icon: BrainCircuit,
    title: 'الذكاء الاصطناعي',
    tag: 'جديد'
  },
  {
    icon: MapPinned,
    title: 'البرمجة والإعلام الآلي',
    tag: 'تقنية'
  }
];

export default async function HomePage() {
  const stats = await getLandingStats();
  const statItems: [string, string][] = [
    [stats.students.toString(), 'طالب مسجّل'],
    [stats.courses.toString(), 'دورة منشورة'],
    [stats.lessons.toString(), 'درس متاح']
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-brand-deep px-6 py-8 shadow-glow sm:px-10 sm:py-12">
        <div className="pulse-orb absolute -left-20 bottom-4 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="pulse-orb absolute -right-12 top-8 h-56 w-56 rounded-full bg-brand/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_85%_75%,rgba(255,143,41,0.16),transparent_28%)]" />

        <header className="relative z-20 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700 sm:gap-7">
            <Link href="/" className="transition-colors hover:text-brand">الرئيسية</Link>
            <a href="#about" className="transition-colors hover:text-brand">من نحن</a>
            <a href="#programs" className="transition-colors hover:text-brand">البرامج</a>
            <a href="#gallery" className="transition-colors hover:text-brand">المعرض</a>
            <a href="#contact" className="transition-colors hover:text-brand">تواصل معنا</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <a href="https://wa.me/213655198992" target="_blank" rel="noreferrer">واتساب</a>
            </Button>
            <div className="text-right">
              <p className="text-sm font-semibold text-brand-deep">أكاديمية مصباح</p>
              <p className="text-xs text-slate-500">للتعليم والتطوير</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="fade-up space-y-6 text-right">
            <Badge className="bg-white/12 text-white">ضيّ طريقك نحو التميز والإبداع</Badge>
            <h1 className="max-w-2xl text-3xl font-black leading-snug text-white sm:text-[2.6rem]">
              التعليم الذي يصنع مستقبلًا أفضل داخل منصة واحدة
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-200">
              انضم إلى أكاديمية مصباح واستفد من محتوى تعليمي منظم، متابعة دقيقة، وبيئة تساعدك على التقدم خطوة بخطوة نحو التميز.
            </p>
            <div className="flex flex-wrap items-center justify-start gap-3">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/login">
                  المنصة التعليمية
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white/45 bg-white/8 text-white hover:bg-white/15" asChild>
                <Link href="/register">سجل الآن</Link>
              </Button>
            </div>
            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              {statItems.map(([value, label]) => (
                <div key={label} className="rounded-[1.5rem] border border-white/20 bg-white/12 px-4 py-5 backdrop-blur">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-200">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="fade-up-delay relative overflow-hidden border-slate-100 bg-white/95 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">مرحبًا بك</p>
                  <h2 className="text-2xl font-bold text-ink">ابدأ رحلتك اليوم</h2>
                </div>
                <div className="rounded-2xl bg-brand/10 p-3 text-brand">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ['📚', 'دروس مرئية منظمة تتابعها بالتسلسل بكل سهولة'],
                  ['✅', 'تتبّع تقدمك في كل دورة وتعرف مستواك الحقيقي'],
                  ['🏆', 'اختبارات تقييم تساعدك على قياس فهمك وتطوير نفسك']
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-right">
                    <span className="text-xl">{icon}</span>
                    <p className="text-sm leading-7 text-slate-700">{text}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl bg-gradient-to-l from-brand to-accent p-5 text-white text-right">
                <p className="text-sm/6 opacity-90">هل أنت مستعد؟</p>
                <p className="mt-2 text-lg font-semibold">سجّل الآن وابدأ التعلم مجانًا في خطوات قليلة</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="programs" className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge>برامجنا</Badge>
            <h2 className="mt-4 text-3xl font-bold text-ink">برامج تعليمية تناسب مختلف الفئات</h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              واجهة المنصة مهيأة لاستيعاب الدعم المدرسي، اللغات، الذكاء الاصطناعي، والبرمجة بنفس الوضوح الموجود في موقع الأكاديمية.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/register">دخول الطالب</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {programs.map(({ icon: Icon, title, tag }) => (
            <Card key={title} className="overflow-hidden border-slate-100 bg-slate-50 transition-transform duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-2xl bg-brand/10 p-3 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">{tag}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">تنظيم حديث للمحتوى، تقدم دراسي واضح، وتجربة استخدام عربية مريحة.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="contact">
        <BrandFooter />
      </section>
    </main>
  );
}
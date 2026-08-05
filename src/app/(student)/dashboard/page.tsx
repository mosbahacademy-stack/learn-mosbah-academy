import Link from 'next/link';
import { BookOpen, Clock3, PlayCircle, Trophy } from 'lucide-react';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { requireRole } from '@/lib/auth';
import { formatPercent } from '@/lib/formatters';
import { getStudentDashboardData } from '@/lib/lms-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireRole('student');
  const data = await getStudentDashboardData(supabase, user.id, profile);

  const summary = [
    [Clock3, String(data.activeEnrollments), 'التحاقات نشطة'],
    [Trophy, String(data.quizAttempts), 'محاولات اختبار'],
    [PlayCircle, String(data.completedLessons), 'دروس مكتملة']
  ] as const;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader badge="لوحة الطالب" title={`مرحبًا بك، ${data.studentName}`} description="الوصول إلى الدروس والتقدّم والاختبارات من مكان واحد." homeHref="/" />

      <SectionNav
        items={[
          { href: '/dashboard', label: 'لوحة الطالب', active: true },
          { href: data.courses[0] ? `/courses/${data.courses[0].id}` : '/dashboard', label: 'أقرب دورة' }
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-5">
          <Card className="mesh-surface overflow-hidden border-white/70">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              {summary.map(([Icon, value, label]) => (
                <div key={label} className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 backdrop-blur">
                  <Icon className="mb-3 h-5 w-5 text-brand" />
                  <div className="text-xl font-bold text-ink">{value}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="لا توجد دورات مفعلة بعد" description="سيظهر محتواك الدراسي هنا فور إسنادك إلى دورة من لوحة الإدارة." />
          ) : null}

          {data.courses.map((course) => (
            <Card key={course.id} className="transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.nextLessonTitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>نسبة الإنجاز</span>
                  <span>{formatPercent(course.progress)}</span>
                </div>
                <Progress value={course.progress} />
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{course.completedLessons} من {course.totalLessons} دروس مكتملة</span>
                  <span>{course.totalLessons === 0 ? 'بانتظار إضافة الدروس' : 'جاهز للاستئناف'}</span>
                </div>
                <Button asChild>
                  <Link href={`/courses/${course.id}`}>
                    استئناف التعلم
                    <PlayCircle className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <aside className="space-y-5">
          <Card className="mesh-surface">
            <CardHeader>
              <CardTitle>ملخص سريع</CardTitle>
              <CardDescription>أهم أرقام التعلم الحالية.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                [String(data.completedLessons), 'دروس مكتملة'],
                [String(data.quizAttempts), 'محاولات اختبار'],
                [String(data.activeEnrollments), 'دورات فعالة']
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xl font-bold text-ink">{value}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>خطة اليوم</CardTitle>
              <CardDescription>{data.courses[0]?.nextLessonTitle ?? 'لا توجد دروس متاحة حاليًا.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>استأنف من أول درس غير مكتمل داخل دوراتك الحالية.</p>
              <p>بعد إنهاء كل درس، سجّل التقدم ثم انتقل مباشرة إلى الاختبار المرتبط عند توفره.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
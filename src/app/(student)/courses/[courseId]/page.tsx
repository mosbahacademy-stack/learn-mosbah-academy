import Link from 'next/link';
import { CheckCircle2, Download, FileText, HelpCircle, PlayCircle, ShieldCheck } from 'lucide-react';

import { LessonCompleteForm } from '@/components/forms/lesson-complete-form';
import { QuizAttemptForm } from '@/components/forms/quiz-attempt-form';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { requireRole } from '@/lib/auth';
import { formatPercent } from '@/lib/formatters';
import { getCoursePlayerData } from '@/lib/lms-data';
import { toEmbeddableVideoUrl } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CoursePlayerPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;
  const { supabase, user } = await requireRole('student');
  const data = await getCoursePlayerData(supabase, user.id, courseId, lessonId);
  const lesson = data.selectedLesson;
  const lessonVideoUrl = toEmbeddableVideoUrl(lesson?.video_url);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader badge="مشغل الدورة" title={data.course.title} description="عرض الفيديو والمحتوى والاختبارات في تجربة مشاهدة مركزة." homeHref="/dashboard" />

      <SectionNav
        items={[
          { href: '/dashboard', label: 'لوحة الطالب' },
          { href: `/courses/${courseId}`, label: 'مشغل الدورة', active: true }
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[0.72fr_0.28fr]">
        <section className="space-y-5">
          <Card className="mesh-surface border-white/70">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <div className="text-sm text-slate-500">تقدم الدورة</div>
                <div className="mt-1 text-2xl font-bold text-ink">{formatPercent(data.courseProgress)}</div>
              </div>
              <div className="text-sm leading-7 text-slate-600">
                {data.lessons.filter((item) => item.completed).length} من {data.lessons.length} دروس مكتملة
              </div>
            </CardContent>
          </Card>

          <Card className="mesh-surface overflow-hidden">
            <div className="aspect-video bg-slate-950">
              {lessonVideoUrl && lesson ? (
                <iframe className="h-full w-full" src={lessonVideoUrl} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <div className="text-center">
                    <PlayCircle className="mx-auto h-12 w-12 text-brand" />
                    <p className="mt-3 text-lg font-semibold">لا يوجد فيديو مضاف لهذا الدرس بعد</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{lesson?.title ?? 'لا توجد دروس بعد'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-600 leading-8">
              <p>{data.course.description || 'سيظهر وصف الدورة أو ملاحظات الدرس هنا عند إضافتها من لوحة الإدارة.'}</p>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                {lesson?.quiz ? `يوجد اختبار مرتبط بهذا الدرس بعنوان: ${lesson.quiz.title}.` : 'لا يوجد اختبار مرتبط بهذا الدرس حتى الآن.'}
              </div>
              {lesson ? <LessonCompleteForm courseId={courseId} lessonId={lesson.id} disabled={lesson.completed} /> : null}
            </CardContent>
          </Card>

          {!lesson ? <EmptyState icon={PlayCircle} title="لا يوجد درس متاح بعد" description="سيظهر أول درس في هذه الدورة هنا فور إضافته من لوحة المدير." /> : null}

          {lesson?.quiz ? (
            <Card>
              <CardHeader>
                <CardTitle>{lesson.quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.latestQuizAttempt ? (
                  <div className={`rounded-2xl px-4 py-3 text-sm ${data.latestQuizAttempt.passed ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                    آخر محاولة: {data.latestQuizAttempt.score}% - {data.latestQuizAttempt.passed ? 'تم الاجتياز' : 'لم يتم الاجتياز بعد'}
                  </div>
                ) : null}
                {data.selectedQuizQuestions.length > 0 ? (
                  <QuizAttemptForm
                    courseId={courseId}
                    lessonId={lesson.id}
                    quizId={lesson.quiz.id}
                    passMark={lesson.quiz.pass_mark}
                    questions={data.selectedQuizQuestions}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">تم إنشاء الاختبار لكن لم تُضف له أسئلة بعد.</div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>المرفقات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson?.pdf_url ? (
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href={lesson.pdf_url} target="_blank" rel="noreferrer">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4" /> ملف PDF
                    </span>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">لا توجد مرفقات لهذا الدرس.</div>
              )}
              <div className="rounded-2xl bg-brand/10 p-4 text-sm leading-7 text-brand">
                <ShieldCheck className="mb-2 h-5 w-5" />
                يتم تحميل المحتوى مباشرة من بيانات Supabase وفق صلاحيات الطالب المسجّل في الدورة.
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>خريطة المحتوى</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.lessons.length === 0 ? <EmptyState icon={PlayCircle} title="المحتوى غير متاح بعد" description="لم تتم إضافة دروس إلى هذه الدورة حتى الآن." /> : null}
              {data.lessons.map((item, index) => (
                <Link key={item.id} href={`/courses/${courseId}?lesson=${item.id}`} className={`block rounded-2xl border p-4 transition-colors ${lesson?.id === item.id ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/40 hover:bg-brand/5'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-ink">{item.title}</div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.completed ? 'مكتمل' : 'قيد التعلم'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">الدرس {index + 1}</div>
                  {item.quiz ? <div className="mt-2 inline-flex items-center gap-1 text-xs text-accent"><HelpCircle className="h-3.5 w-3.5" /> {item.quiz.title}</div> : null}
                  {item.completed ? <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> تم حفظ التقدم</div> : null}
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
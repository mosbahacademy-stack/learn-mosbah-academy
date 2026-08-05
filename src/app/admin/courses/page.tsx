import Link from 'next/link';
import { LibraryBig } from 'lucide-react';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { AdminCourseForm } from '@/components/forms/admin-course-form';
import { AdminLessonForm } from '@/components/forms/admin-lesson-form';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { formatCurrencyDZD, formatDateArabic } from '@/lib/formatters';
import { getAdminCoursesData } from '@/lib/lms-data';

export default async function AdminCoursesPage() {
  const { supabase } = await requireRole('admin');
  const courses = await getAdminCoursesData(supabase);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader badge="إدارة الدورات" title="بناء الدورات والدروس" description="أنشئ الدورة من الجهة اليمنى، ثم أضف الفيديوهات والدروس للدورة المختارة من الجهة اليسرى." homeHref="/admin" />

      <SectionNav
        items={[
          { href: '/admin', label: 'النظرة العامة' },
          { href: '/admin/courses', label: 'الدورات والمحتوى', active: true },
          { href: '/admin/students', label: 'الطلاب والالتحاقات' }
        ]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.65fr_0.35fr]">
        <Card>
          <CardHeader>
            <CardTitle>إنشاء دورة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminCourseForm />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>إضافة فيديو إلى دورة موجودة</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLessonForm
                courseOptions={courses.map((course) => ({ id: course.id, title: course.title }))}
              />
            </CardContent>
          </Card>

          <Card className="mesh-surface">
            <CardHeader>
              <CardTitle>تلميحات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>أضف الدروس والاختبارات بشكل متسلسل داخل كل دورة.</p>
              <p>يمكن ربط الدروس بملفات PDF وروابط فيديو Bunny.net بسهولة.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>الدورات الحالية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 ? <EmptyState icon={LibraryBig} title="لا توجد دورات بعد" description="ابدأ بإنشاء أول دورة مع درس افتتاحي حتى تظهر هنا وتصبح قابلة للإدارة." /> : null}
          {courses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={`الصورة المصغرة لدورة ${course.title}`} className="h-24 w-36 rounded-xl object-cover ring-1 ring-slate-200" />
                  ) : (
                    <div className="flex h-24 w-36 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500 ring-1 ring-slate-200">
                      بدون صورة
                    </div>
                  )}
                  <div className="min-w-0">
                  <div className="font-semibold text-ink">{course.title}</div>
                  <div className="mt-1 text-sm leading-7 text-slate-500">{course.description}</div>
                  <div className="mt-2 text-xs text-slate-400">أضيفت في {formatDateArabic(course.created_at)}</div>
                </div>
                </div>
                <div className="text-left">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {course.published ? 'منشورة' : 'مسودة'}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{course.lessonCount} درس</div>
                  <div className="mt-1 text-xs text-slate-500">السعر: {formatCurrencyDZD(Number(course.price_dzd ?? 0))}</div>
                  <div className="mt-1 text-xs text-slate-400">{course.firstLessonTitle ?? 'لا يوجد درس بعد'}</div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/courses/${course.id}`}>إدارة المحتوى</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
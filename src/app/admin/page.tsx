import Link from 'next/link';
import { BookOpenCheck, UserRoundPlus } from 'lucide-react';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { requireRole } from '@/lib/auth';
import { formatDateArabic } from '@/lib/formatters';
import { getAdminOverviewData } from '@/lib/lms-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminPage() {
  const { supabase, profile } = await requireRole('admin');
  const data = await getAdminOverviewData(supabase);
  const stats = [
    [String(data.totalStudents), 'طالب'],
    [String(data.totalCourses), 'دورة'],
    [String(data.activeEnrollments), 'التحاقات نشطة']
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader badge="لوحة المدير" title={`مرحبًا، ${profile.full_name || profile.email}`} description="إدارة الدورات والطلاب والصلاحيات بأسلوب بسيط ومباشر." homeHref="/" />

      <SectionNav
        items={[
          { href: '/admin', label: 'النظرة العامة', active: true },
          { href: '/admin/courses', label: 'الدورات والمحتوى' },
          { href: '/admin/students', label: 'الطلاب والالتحاقات' }
        ]}
      />

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {stats.map(([value, label]) => (
          <Card key={label} className="mesh-surface">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-ink">{value}</div>
              <div className="mt-2 text-sm text-slate-500">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="mesh-surface">
          <CardHeader>
            <CardTitle>روابط سريعة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/courses">إدارة الدورات</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/students">إدارة الطلاب</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ما الذي تريد إنجازه الآن؟</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <BookOpenCheck className="mb-3 h-5 w-5 text-brand" />
              <div className="font-semibold text-ink">إنشاء دورة جديدة</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">أضف العنوان والوصف والفيديو والملفات في نموذج واحد بسيط.</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <UserRoundPlus className="mb-3 h-5 w-5 text-accent" />
              <div className="font-semibold text-ink">منح وصول لطالب</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">فعّل أو علّق الالتحاق بسرعة مع أقل عدد من الخطوات.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أحدث الدورات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentCourses.length === 0 ? <p className="text-sm text-slate-500">لا توجد دورات بعد.</p> : null}
            {data.recentCourses.map((course) => (
              <div key={course.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{course.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{course.lessonCount} درس</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {course.published ? 'منشورة' : 'مسودة'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث الطلاب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentStudents.length === 0 ? <p className="text-sm text-slate-500">لا يوجد طلاب بعد.</p> : null}
            {data.recentStudents.map((student) => (
              <div key={student.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-ink">{student.full_name || student.email}</div>
                <div className="mt-1 text-sm text-slate-500">{student.email}</div>
                <div className="mt-2 text-xs text-slate-400">تاريخ الإضافة: {formatDateArabic(student.created_at)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 mesh-surface">
        <CardHeader>
          <CardTitle>جاهزية الإطلاق المحلي</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            ['1', 'تجهيز البيئة', 'تأكد من وجود مفاتيح Supabase داخل `.env.local` بما فيها Service Role للإدارة.'],
            ['2', 'تجهيز أول مدير', 'نفّذ ملف bootstrap بعد إنشاء أول مستخدم حتى تحصل على صلاحيات الإدارة.'],
            ['3', 'بيانات أولية', 'استخدم seed لإضافة دورات ودروس واختبارات أولية قبل أول مراجعة تشغيلية.']
          ].map(([step, title, description]) => (
            <div key={step} className="rounded-2xl bg-white/80 p-4">
              <div className="text-sm font-semibold text-brand">الخطوة {step}</div>
              <div className="mt-2 font-semibold text-ink">{title}</div>
              <div className="mt-2 text-sm leading-7 text-slate-500">{description}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
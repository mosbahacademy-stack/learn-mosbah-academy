import Link from 'next/link';
import { BookLock, CheckCircle2, CircleDashed, Clock3 } from 'lucide-react';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { formatCurrencyDZD } from '@/lib/formatters';
import { getPublicCoursesData } from '@/lib/lms-data';

const requestStateLabel: Record<'pending' | 'approved' | 'rejected' | 'none', string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  none: 'لم يتم الطلب'
};

const requestStateStyle: Record<'pending' | 'approved' | 'rejected' | 'none', string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  none: 'bg-slate-100 text-slate-700'
};

export default async function CatalogPage() {
  const { supabase, user } = await requireRole('student');
  const data = await getPublicCoursesData(supabase, user.id);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader
        badge="بوابة التسجيل"
        title={`مرحبًا ${data.studentName}`}
        description="هذه قائمة الدورات المتاحة وأسعارها. يمكنك طلب التسجيل وسيصل إشعار مباشر للإدارة."
        homeHref="/"
      />

      <SectionNav
        items={[
          { href: '/catalog', label: 'الدورات المتاحة', active: true },
          { href: '/dashboard', label: 'لوحة الطالب' }
        ]}
      />

      <Card className="mt-6 mesh-surface">
        <CardHeader>
          <CardTitle>حالة الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-600">
            <Clock3 className="mb-2 h-4 w-4 text-amber-700" />
            الطلبات قيد المراجعة تظهر بحالة قيد المراجعة.
          </div>
          <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-600">
            <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-700" />
            عند القبول، يتم تفعيل دخولك إلى الدورة تلقائيًا.
          </div>
          <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-600">
            <CircleDashed className="mb-2 h-4 w-4 text-slate-700" />
            يمكنك إعادة الطلب لاحقًا إذا تم رفض الطلب.
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.courses.length === 0 ? <EmptyState icon={BookLock} title="لا توجد دورات منشورة حاليًا" description="ستظهر الدورات هنا بمجرد نشرها من لوحة الإدارة." /> : null}
        {data.courses.map((course) => (
          <Card key={course.id} className="overflow-hidden border-slate-200">
            {course.thumbnail_url ? <img src={course.thumbnail_url} alt={`صورة ${course.title}`} className="h-44 w-full object-cover" /> : null}
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{course.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600 line-clamp-2">{course.description}</p>
                </div>
                <Badge className={requestStateStyle[course.requestStatus]}>{requestStateLabel[course.requestStatus]}</Badge>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">سعر الدورة</div>
                <div className="mt-1 text-xl font-bold text-ink">{formatCurrencyDZD(Number(course.price_dzd ?? 0))}</div>
              </div>

              <Button asChild className="w-full">
                <Link href={`/catalog/${course.id}`}>طلب التسجيل / بيانات الدفع</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}

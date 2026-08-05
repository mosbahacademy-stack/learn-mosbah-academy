import { ArrowRight, CreditCard, Wallet } from 'lucide-react';
import Link from 'next/link';

import { PublicCourseRequestForm } from '@/components/forms/public-course-request-form';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { formatCurrencyDZD } from '@/lib/formatters';
import { getPublicCourseCheckoutData } from '@/lib/lms-data';

const requestStatusLabel: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'طلبك قيد مراجعة الإدارة',
  approved: 'تمت الموافقة على الطلب',
  rejected: 'تم رفض الطلب، يمكنك إعادة الإرسال بعد التصحيح'
};

export default async function PublicCourseCheckoutPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { supabase, user } = await requireRole('student');
  const data = await getPublicCourseCheckoutData(supabase, user.id, courseId);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader
        badge="الدفع وطلب الالتحاق"
        title={data.course.title}
        description="أكمل بيانات الدفع ثم أرسل طلب التسجيل. سيصل إشعار فوري إلى لوحة المدير للمراجعة والتفعيل."
        homeHref="/catalog"
      />

      <SectionNav
        items={[
          { href: '/catalog', label: 'الدورات المتاحة' },
          { href: `/catalog/${courseId}`, label: 'طلب التسجيل', active: true }
        ]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <CardHeader>
            <CardTitle>بيانات الدورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-slate-600">{data.course.description}</p>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">السعر الإجمالي</div>
              <div className="mt-1 text-2xl font-bold text-ink">{formatCurrencyDZD(Number(data.course.price_dzd ?? 0))}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <Wallet className="h-4 w-4 text-brand" />
                بريدي موب
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {data.course.payment_notes || 'حوّل المبلغ عبر بريدي موب، ثم ارفع صورة وصل الدفع داخل النموذج وأرسل الطلب.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <CreditCard className="h-4 w-4 text-accent" />
                تحويل بنكي
              </div>
              <p className="text-sm leading-7 text-slate-600">
                يمكنك اختيار التحويل البنكي ثم رفع صورة وصل التحويل لإرسال الطلب إلى الإدارة.
              </p>
            </div>

            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
              <div className="text-sm font-semibold text-ink">تواصل معنا قبل/بعد الدفع</div>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                إذا احتجت تأكيدًا أو واجهت أي مشكلة أثناء رفع الوصل، تواصل معنا على الرقم:
              </p>
              <a href="https://wa.me/213655198992" target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
                0655198992
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="mesh-surface">
          <CardHeader>
            <CardTitle>طلب التسجيل في الدورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.request ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <Badge className="mb-2 bg-slate-100 text-slate-700">الحالة الحالية</Badge>
                <div>{requestStatusLabel[data.request.status]}</div>
              </div>
            ) : null}

            <PublicCourseRequestForm courseId={courseId} />

            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <ArrowRight className="h-4 w-4" />
              العودة إلى كل الدورات
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

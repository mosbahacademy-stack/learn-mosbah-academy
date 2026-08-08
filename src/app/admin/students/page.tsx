import Image from 'next/image';
import { CheckCircle, Clock, UserRoundX, XCircle } from 'lucide-react';

import { AdminStudentForm } from '@/components/forms/admin-student-form';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { approveEnrollmentRequestAction, rejectEnrollmentRequestAction, toggleEnrollmentStatusAction } from '@/features/admin/actions';
import { requireRole } from '@/lib/auth';
import { formatDateArabic } from '@/lib/formatters';
import { getAdminEnrollmentRequests, getAdminStudentsData } from '@/lib/lms-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminStudentsPage() {
  const { supabase } = await requireRole('admin');
  const [data, requests] = await Promise.all([
    getAdminStudentsData(supabase),
    getAdminEnrollmentRequests()
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader badge="إدارة الطلاب" title="إضافة الطلاب والتحكم في الوصول" description="إنشاء حسابات طلاب جديدة وربطها بالدورات أو تعليق الوصول من نفس الصفحة." homeHref="/admin" />

      <SectionNav
        items={[
          { href: '/admin', label: 'النظرة العامة' },
          { href: '/admin/courses', label: 'الدورات والمحتوى' },
          { href: '/admin/students', label: 'الطلاب والالتحاقات', active: true }
        ]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.65fr_0.35fr]">
        <Card>
          <CardHeader>
            <CardTitle>إضافة طالب جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStudentForm courses={data.courses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحالة الحالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
            <p>إنشاء الطالب يستخدم صلاحية Service Role من الخادم فقط، ولا تُرسل هذه الصلاحية للواجهة.</p>
            <p>يمكنك تعليق الوصول أو تفعيله من قائمة الطلاب الحالية دون تعقيد.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            طلبات الالتحاق المعلقة
            {requests.length > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{requests.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد طلبات معلقة حالياً.</p>
          ) : null}
          {requests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-ink">{req.studentName}</div>
                  <div className="text-sm text-slate-500">{req.studentEmail}</div>
                  <div className="text-sm text-slate-600">الدورة: <span className="font-medium">{req.courseTitle}</span></div>
                  <div className="text-sm text-slate-500">
                    طريقة الدفع: {req.paymentMethod === 'baridi_mob' ? 'بريدي موب' : 'تحويل بنكي'}
                  </div>
                  <div className="text-xs text-slate-400">تاريخ الطلب: {formatDateArabic(req.createdAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {req.receiptSignedUrl ? (
                    <a href={req.receiptSignedUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 hover:opacity-80">
                      <Image src={req.receiptSignedUrl} alt="وصل الدفع" width={140} height={100} className="h-24 w-36 object-cover" unoptimized />
                    </a>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs text-slate-400">لا توجد صورة</div>
                  )}
                  <div className="flex gap-2">
                    <form action={approveEnrollmentRequestAction}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="userId" value={req.userId} />
                      <input type="hidden" name="courseId" value={req.courseId} />
                      <Button size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="ml-1 h-4 w-4" />
                        موافقة
                      </Button>
                    </form>
                    <form action={rejectEnrollmentRequestAction}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <Button size="sm" variant="outline" type="submit" className="border-red-300 text-red-600 hover:bg-red-50">
                        <XCircle className="ml-1 h-4 w-4" />
                        رفض
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>الطلاب الحاليون</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.students.length === 0 ? <EmptyState icon={UserRoundX} title="لا يوجد طلاب بعد" description="أنشئ أول طالب من النموذج أعلاه ثم اربطه بدورة مباشرة أو لاحقًا." /> : null}
          {data.students.map((student) => (
            <div key={student.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-ink">{student.full_name || student.email}</div>
                  <div className="mt-1 text-sm text-slate-500">{student.email}</div>
                  <div className="mt-2 text-xs text-slate-400">تاريخ الإضافة: {formatDateArabic(student.created_at)}</div>
                </div>
                <div className="min-w-[220px] space-y-3">
                  {student.enrollments.length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">بدون التحاقات حالية</div> : null}
                  {student.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-ink">{enrollment.courseTitle}</div>
                          <div className="mt-1 text-xs text-slate-500">الحالة: {enrollment.status === 'active' ? 'مفعّل' : 'معلّق'}</div>
                        </div>
                        <form action={toggleEnrollmentStatusAction}>
                          <input type="hidden" name="enrollmentId" value={enrollment.id} />
                          <input type="hidden" name="nextStatus" value={enrollment.status === 'active' ? 'suspended' : 'active'} />
                          <Button variant="outline" size="sm" type="submit">
                            {enrollment.status === 'active' ? 'تعليق' : 'تفعيل'}
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
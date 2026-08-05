import { UserRoundX } from 'lucide-react';

import { AdminStudentForm } from '@/components/forms/admin-student-form';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { reviewEnrollmentRequestAction, toggleEnrollmentStatusAction, toggleStudentAccountStatusAction, toggleStudentCourseStatusAction } from '@/features/admin/actions';
import { requireRole } from '@/lib/auth';
import { formatDateArabic } from '@/lib/formatters';
import { getAdminEnrollmentRequestsData, getAdminStudentsData } from '@/lib/lms-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminStudentsPage() {
  const { supabase } = await requireRole('admin');
  const [data, enrollmentRequests] = await Promise.all([getAdminStudentsData(supabase), getAdminEnrollmentRequestsData(supabase)]);

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
            <p>أنشئ الطالب أولًا ثم فعّل/علّق الحساب من نفس الصفحة بزر واحد.</p>
            <p>يمكنك أيضًا تفعيل أو تعليق كل دورة لكل طالب بشكل مستقل من قسم تفعيل الدورات.</p>
          </CardContent>
        </Card>
      </div>

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
                  <div className="mt-2 text-xs text-slate-500">الحساب: {student.accountActive === false ? 'معلّق' : 'مفعّل'}</div>
                  <form action={toggleStudentAccountStatusAction} className="mt-2">
                    <input type="hidden" name="studentId" value={student.id} />
                    <input type="hidden" name="nextStatus" value={student.accountActive === false ? 'active' : 'suspended'} />
                    <Button variant="outline" size="sm" type="submit">
                      {student.accountActive === false ? 'تفعيل الحساب' : 'تعليق الحساب'}
                    </Button>
                  </form>
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

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 text-sm font-medium text-ink">تفعيل الدورات</div>
                <div className="space-y-2">
                  {data.courses.map((course) => {
                    const enrollment = student.enrollments.find((item) => item.course_id === course.id);
                    const isActive = enrollment?.status === 'active';

                    return (
                      <div key={`${student.id}-${course.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        <div className="text-sm text-slate-700">{course.title}</div>
                        <form action={toggleStudentCourseStatusAction}>
                          <input type="hidden" name="studentId" value={student.id} />
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="nextStatus" value={isActive ? 'suspended' : 'active'} />
                          <Button variant="outline" size="sm" type="submit">
                            {isActive ? 'تعليق الدورة' : 'تفعيل الدورة'}
                          </Button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>طلبات التسجيل في الدورات ({enrollmentRequests.filter((item) => item.status === 'pending').length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollmentRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">لا توجد طلبات تسجيل حالية.</div>
          ) : null}

          {enrollmentRequests.map((request) => {
            const receiptUrl = request.receiptImageUrl;

            return (
              <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-ink">{request.studentName}</div>
                  <div className="text-sm text-slate-500">{request.studentEmail}</div>
                  <div className="text-sm text-slate-700">الدورة: {request.courseTitle}</div>
                  <div className="text-xs text-slate-500">أُرسل في: {formatDateArabic(request.created_at)}</div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {request.status === 'pending' ? 'قيد المراجعة' : request.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2">طريقة الدفع: {request.payment_method === 'baridi_mob' ? 'بريدي موب' : 'تحويل بنكي'}</div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">{receiptUrl ? 'تم إرفاق وصل الدفع' : `مرجع العملية: ${request.payment_reference}`}</div>
              </div>

              {receiptUrl ? (
                <div className="mt-3 rounded-2xl border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-ink">وصل الدفع المرفوع</div>
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="mb-3 inline-flex text-sm font-medium text-brand hover:underline">
                    فتح الصورة بحجم كامل
                  </a>
                  <img src={receiptUrl} alt="وصل الدفع" className="max-h-72 w-full rounded-xl object-contain" />
                </div>
              ) : null}

              {request.proof_note ? <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">ملاحظة: {request.proof_note}</div> : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {request.status === 'pending' ? (
                  <>
                    <form action={reviewEnrollmentRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="studentId" value={request.user_id} />
                      <input type="hidden" name="courseId" value={request.course_id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button size="sm" type="submit">قبول وتفعيل الدورة</Button>
                    </form>
                    <form action={reviewEnrollmentRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="studentId" value={request.user_id} />
                      <input type="hidden" name="courseId" value={request.course_id} />
                      <input type="hidden" name="decision" value="reject" />
                      <Button variant="outline" size="sm" type="submit">رفض الطلب</Button>
                    </form>
                  </>
                ) : null}
              </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}
import Link from 'next/link';
import { ArrowRight, BookOpenText, FileQuestion, PlayCircle, UsersRound } from 'lucide-react';

import { deleteCourseAction, deleteLessonAction, deleteQuestionAction, deleteQuizAction, removeEnrollmentAction, toggleEnrollmentStatusAction } from '@/features/admin/actions';
import { AdminCourseEnrollmentForm } from '@/components/forms/admin-course-enrollment-form';
import { ConfirmActionForm } from '@/components/forms/confirm-action-form';
import { AdminCourseSettingsForm } from '@/components/forms/admin-course-settings-form';
import { AdminLessonForm } from '@/components/forms/admin-lesson-form';
import { AdminLessonEditForm } from '@/components/forms/admin-lesson-edit-form';
import { AdminQuestionForm } from '@/components/forms/admin-question-form';
import { AdminQuestionEditForm } from '@/components/forms/admin-question-edit-form';
import { AdminQuizForm } from '@/components/forms/admin-quiz-form';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { SectionNav } from '@/components/layout/section-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { formatDateArabic } from '@/lib/formatters';
import { getAdminCourseDetailData } from '@/lib/lms-data';

export default async function AdminCourseDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson } = await searchParams;
  const { supabase } = await requireRole('admin');
  const data = await getAdminCourseDetailData(supabase, courseId, lesson);
  const selectedLesson = data.selectedLesson;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader
        badge="تفاصيل الدورة"
        title={data.course.title}
        description="إدارة الدروس، إنشاء الاختبار، وإضافة الأسئلة من مكان واحد منظم وواضح."
        homeHref="/admin/courses"
      />

      <SectionNav
        items={[
          { href: '/admin', label: 'النظرة العامة' },
          { href: '/admin/courses', label: 'كل الدورات' },
          { href: `/admin/courses/${courseId}`, label: 'تفاصيل الدورة', active: true },
          { href: '/admin/students', label: 'الطلاب والالتحاقات' }
        ]}
      />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">أنشئت الدورة في {formatDateArabic(data.course.created_at)}</div>
        <Button variant="outline" asChild>
          <Link href="/admin/courses">
            <ArrowRight className="ml-2 h-4 w-4" />
            الرجوع إلى كل الدورات
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.38fr_0.62fr]">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الدورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminCourseSettingsForm course={data.course} />
              <ConfirmActionForm
                action={deleteCourseAction}
                fields={[{ name: 'courseId', value: courseId }]}
                confirmMessage="سيتم حذف الدورة وكل دروسها واختباراتها نهائيًا. هل تريد المتابعة؟"
                label="حذف الدورة بالكامل"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إضافة درس جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLessonForm courseId={courseId} nextOrderIndex={data.lessons.length + 1} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الدروس الحالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.lessons.length === 0 ? <EmptyState icon={BookOpenText} title="لا توجد دروس بعد" description="أضف أول درس لهذه الدورة لتتمكن من إدارة الفيديو والاختبار والأسئلة." /> : null}
              {data.lessons.map((lessonItem) => (
                <Link
                  key={lessonItem.id}
                  href={`/admin/courses/${courseId}?lesson=${lessonItem.id}`}
                  className={`block rounded-2xl border p-4 transition-colors ${selectedLesson?.id === lessonItem.id ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/40 hover:bg-brand/5'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink">{lessonItem.title}</div>
                      <div className="mt-1 text-xs text-slate-500">الترتيب: {lessonItem.order_index}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-slate-500">{lessonItem.quiz ? `${lessonItem.questions.length} سؤال` : 'بدون اختبار'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>طلاب هذه الدورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminCourseEnrollmentForm courseId={courseId} students={data.availableStudents} />
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                يمكنك من هنا إسناد الطلاب غير الملتحقين بهذه الدورة، ثم تعليق الوصول أو إلغاؤه عند الحاجة.
              </div>
              {data.enrolledStudents.length === 0 ? <EmptyState icon={UsersRound} title="لا يوجد طلاب مسجلون بعد" description="أسند طالبًا إلى هذه الدورة من القائمة أعلاه ليظهر هنا مع حالة الوصول." /> : null}
              {data.enrolledStudents.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 font-medium text-ink"><UsersRound className="h-4 w-4 text-brand" />{student.full_name || student.email}</div>
                      <div className="mt-1 text-sm text-slate-500">{student.email}</div>
                      <div className="mt-2 text-xs text-slate-400">الحالة: {student.enrollment.status === 'active' ? 'مفعّل' : 'معلّق'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleEnrollmentStatusAction}>
                        <input type="hidden" name="enrollmentId" value={student.enrollment.id} />
                        <input type="hidden" name="nextStatus" value={student.enrollment.status === 'active' ? 'suspended' : 'active'} />
                        <Button variant="outline" size="sm" type="submit">
                          {student.enrollment.status === 'active' ? 'تعليق' : 'تفعيل'}
                        </Button>
                      </form>
                      <ConfirmActionForm
                        action={removeEnrollmentAction}
                        fields={[
                          { name: 'courseId', value: courseId },
                          { name: 'enrollmentId', value: student.enrollment.id }
                        ]}
                        confirmMessage="سيتم إلغاء تسجيل هذا الطالب من الدورة. هل تريد المتابعة؟"
                        label="إلغاء الإسناد"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <Card className="mesh-surface">
            <CardHeader>
              <CardTitle>{selectedLesson ? `إدارة: ${selectedLesson.title}` : 'اختر درسًا لإدارته'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
              {selectedLesson ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <BookOpenText className="mb-2 h-5 w-5 text-brand" />
                      <div className="font-semibold text-ink">ترتيب الدرس</div>
                      <div>{selectedLesson.order_index}</div>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <PlayCircle className="mb-2 h-5 w-5 text-accent" />
                      <div className="font-semibold text-ink">رابط الفيديو</div>
                      <div>{selectedLesson.video_url ? 'مضاف' : 'غير مضاف'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <FileQuestion className="mb-2 h-5 w-5 text-brand" />
                      <div className="font-semibold text-ink">الاختبار</div>
                      <div>{selectedLesson.quiz ? 'موجود' : 'غير موجود'}</div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[0.44fr_0.56fr]">
                    <Card>
                      <CardHeader>
                        <CardTitle>تعديل بيانات الدرس</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AdminLessonEditForm courseId={courseId} lesson={selectedLesson} />
                        <ConfirmActionForm
                          action={deleteLessonAction}
                          fields={[
                            { name: 'courseId', value: courseId },
                            { name: 'lessonId', value: selectedLesson.id }
                          ]}
                          confirmMessage="سيتم حذف الدرس وكل ما يتبعه من اختبار وأسئلة وتقدم طلاب. هل تريد المتابعة؟"
                          label="حذف الدرس"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedLesson.quiz ? 'تحديث الاختبار' : 'إنشاء اختبار'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AdminQuizForm courseId={courseId} lessonId={selectedLesson.id} quiz={selectedLesson.quiz} />
                        {selectedLesson.quiz ? (
                          <ConfirmActionForm
                            action={deleteQuizAction}
                            fields={[
                              { name: 'courseId', value: courseId },
                              { name: 'quizId', value: selectedLesson.quiz.id }
                            ]}
                            confirmMessage="سيتم حذف الاختبار وكل أسئلته ومحاولات الطلاب المرتبطة به. هل تريد المتابعة؟"
                            label="حذف الاختبار"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          />
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>أسئلة الاختبار</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!selectedLesson.quiz ? <p className="text-sm text-slate-500">أنشئ الاختبار أولًا قبل إضافة الأسئلة.</p> : null}
                        {selectedLesson.quiz ? <AdminQuestionForm courseId={courseId} lessonId={selectedLesson.id} quizId={selectedLesson.quiz.id} /> : null}
                        {selectedLesson.questions.length === 0 ? <p className="text-sm text-slate-500">لا توجد أسئلة مضافة لهذا الاختبار بعد.</p> : null}
                        {selectedLesson.questions.map((question, index) => (
                          <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="mb-4 font-medium text-ink">{index + 1}. {question.question_text}</div>
                            <AdminQuestionEditForm courseId={courseId} lessonId={selectedLesson.id} question={question} />
                            <div className="mt-4 space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={`${question.id}-${optionIndex}`} className={`rounded-xl px-3 py-2 text-sm ${optionIndex === question.correct_option_index ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                                  {optionIndex + 1}. {option}
                                </div>
                              ))}
                            </div>
                            <div className="mt-4">
                              <ConfirmActionForm
                                action={deleteQuestionAction}
                                fields={[
                                  { name: 'courseId', value: courseId },
                                  { name: 'questionId', value: question.id }
                                ]}
                                confirmMessage="سيتم حذف هذا السؤال نهائيًا من الاختبار. هل تريد المتابعة؟"
                                label="حذف السؤال"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <p>بعد إضافة أول درس، اختره من القائمة الجانبية لبدء إدارة الاختبار والأسئلة.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
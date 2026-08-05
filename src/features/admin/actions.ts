'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import {
  createDevCourse,
  createDevLesson,
  createDevStudent,
  removeDevEnrollmentById,
  setDevEnrollmentStatusById,
  setDevStudentAccountStatus,
  setDevStudentCourseStatus
} from '@/lib/dev-preview-data';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { toEmbeddableVideoUrl } from '@/lib/video';

export type AdminFormState = {
  error?: string;
  success?: string;
};

const createCourseSchema = z.object({
  title: z.string().min(3, 'عنوان الدورة قصير جدًا'),
  description: z.string().min(10, 'أدخل وصفًا أوضح للدورة'),
  priceDzd: z.coerce.number().min(0, 'سعر الدورة غير صالح'),
  paymentNotes: z.string().max(1000, 'تعليمات الدفع طويلة جدًا'),
  thumbnailUrl: z.string().url('رابط الصورة المصغرة غير صالح').or(z.literal('')),
  thumbnailDataUrl: z.string().max(4_000_000, 'الصورة المصغرة كبيرة جدًا').or(z.literal('')),
  published: z.boolean()
});

const createStudentSchema = z.object({
  fullName: z.string().min(3, 'اسم الطالب مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  courseIds: z.array(z.string().uuid('اختر دورة صالحة')).default([])
});

const toggleStudentAccountSchema = z.object({
  studentId: z.string().uuid('معرّف الطالب غير صالح'),
  nextStatus: z.enum(['active', 'suspended'])
});

const toggleStudentCourseSchema = z.object({
  studentId: z.string().uuid('معرّف الطالب غير صالح'),
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  nextStatus: z.enum(['active', 'suspended'])
});

const addLessonSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  title: z.string().min(3, 'عنوان الدرس قصير جدًا'),
  videoUrl: z.string().url('رابط الفيديو غير صالح').or(z.literal('')),
  pdfUrl: z.string().url('رابط ملف PDF غير صالح').or(z.literal('')),
  orderIndex: z.coerce.number().int().min(1, 'ترتيب الدرس يجب أن يبدأ من 1')
});

const upsertQuizSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح'),
  title: z.string().min(3, 'عنوان الاختبار قصير جدًا'),
  passMark: z.coerce.number().int().min(0, 'درجة النجاح غير صالحة').max(100, 'درجة النجاح يجب أن تكون بين 0 و100')
});

const addQuestionSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح'),
  quizId: z.string().uuid('معرّف الاختبار غير صالح'),
  questionText: z.string().min(5, 'نص السؤال قصير جدًا'),
  optionsText: z.string().min(3, 'أدخل خيارات السؤال'),
  correctOptionNumber: z.coerce.number().int().min(1, 'رقم الإجابة الصحيحة يجب أن يبدأ من 1')
});

const updateCourseSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  title: z.string().min(3, 'عنوان الدورة قصير جدًا'),
  description: z.string().min(10, 'أدخل وصفًا أوضح للدورة'),
  published: z.boolean()
});

const updateLessonSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح'),
  title: z.string().min(3, 'عنوان الدرس قصير جدًا'),
  videoUrl: z.string().url('رابط الفيديو غير صالح').or(z.literal('')),
  pdfUrl: z.string().url('رابط ملف PDF غير صالح').or(z.literal('')),
  orderIndex: z.coerce.number().int().min(1, 'ترتيب الدرس يجب أن يبدأ من 1')
});

const updateQuestionSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح'),
  questionId: z.string().uuid('معرّف السؤال غير صالح'),
  questionText: z.string().min(5, 'نص السؤال قصير جدًا'),
  optionsText: z.string().min(3, 'أدخل خيارات السؤال'),
  correctOptionNumber: z.coerce.number().int().min(1, 'رقم الإجابة الصحيحة يجب أن يبدأ من 1')
});

const assignStudentToCourseSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  studentId: z.string().uuid('اختر طالبًا صالحًا')
});

const reviewEnrollmentRequestSchema = z.object({
  requestId: z.string().uuid('معرّف الطلب غير صالح'),
  studentId: z.string().uuid('معرّف الطالب غير صالح'),
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  decision: z.enum(['approve', 'reject'])
});

export async function createCourseAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = createCourseSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priceDzd: formData.get('priceDzd'),
    paymentNotes: formData.get('paymentNotes'),
    thumbnailUrl: formData.get('thumbnailUrl'),
    thumbnailDataUrl: formData.get('thumbnailDataUrl'),
    published: formData.get('published') === 'on'
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر حفظ الدورة.' };
  }

  const thumbnailUrl = parsed.data.thumbnailDataUrl || parsed.data.thumbnailUrl || null;

  let supabase;
  try {
    ({ supabase } = await requireRole('admin'));
  } catch (error) {
    if (process.env.DEV_ADMIN_BYPASS === 'true') {
      supabase = await (await import('@/lib/supabase/server')).createSupabaseServerClient();
    } else {
      if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        return { error: 'تعذر إنشاء الدورة لأن مفتاح خدمة Supabase غير مُعدّ في البيئة.' };
      }

      return { error: 'تعذر التحقق من صلاحية المدير قبل إنشاء الدورة.' };
    }
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    const { course } = await createDevCourse({
      title: parsed.data.title,
      description: parsed.data.description,
      thumbnailUrl,
      paymentNotes: parsed.data.paymentNotes,
      priceDzd: parsed.data.priceDzd,
      published: parsed.data.published
    });

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath('/dashboard');
    revalidatePath(`/courses/${course.id}`);

    return { success: 'تم إنشاء الدورة بنجاح (وضع معاينة محلي).' };
  }

  const courseId = crypto.randomUUID();

  const { error: courseError } = await supabase.from('courses').insert({
    id: courseId,
    title: parsed.data.title,
    description: parsed.data.description,
    thumbnail_url: thumbnailUrl,
    price_dzd: parsed.data.priceDzd,
    payment_notes: parsed.data.paymentNotes,
    published: parsed.data.published
  });

  if (courseError) {
    const details = courseError?.message ? `: ${courseError.message}` : '';
    return { error: `فشل إنشاء الدورة في قاعدة البيانات${details}` };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
  revalidatePath('/dashboard');

  return { success: 'تم إنشاء الدورة بنجاح.' };
}

export async function createStudentAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const selectedCourseIds = formData.getAll('courseIds').map((value) => String(value)).filter(Boolean);
  const singleCourseId = String(formData.get('courseId') ?? '');
  const courseIds = [...new Set([...selectedCourseIds, singleCourseId].filter(Boolean))];

  const parsed = createStudentSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    courseIds
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إنشاء الطالب.' };
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    try {
      await createDevStudent({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        courseIds: parsed.data.courseIds
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'تعذر إنشاء الطالب في وضع المعاينة.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/students');
    revalidatePath('/dashboard');

    return { success: 'تم إنشاء الطالب وتفعيل الحساب بنجاح (وضع معاينة محلي).' };
  }

  await requireRole('admin');

  let userId: string;

  try {
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName
      }
    });

    if (error || !data.user) {
      return { error: error?.message ?? 'فشل إنشاء حساب الطالب.' };
    }

    userId = data.user.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'فشل الاتصال بصلاحيات الإدارة.' };
  }

  for (const courseId of parsed.data.courseIds) {
    const { supabase } = await requireRole('admin');
    const { error: enrollmentError } = await supabase.from('enrollments').insert({
      user_id: userId,
      course_id: courseId,
      status: 'active'
    });

    if (enrollmentError) {
      return { error: 'تم إنشاء الطالب لكن تعذر تسجيله في الدورة المختارة.' };
    }
  }

  revalidatePath('/admin');
  revalidatePath('/admin/students');

  return { success: 'تم إنشاء الطالب بنجاح.' };
}

export async function toggleStudentAccountStatusAction(formData: FormData) {
  const parsed = toggleStudentAccountSchema.safeParse({
    studentId: formData.get('studentId'),
    nextStatus: formData.get('nextStatus')
  });

  if (!parsed.success) {
    return;
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await setDevStudentAccountStatus(parsed.data.studentId, parsed.data.nextStatus === 'active');
    revalidatePath('/admin/students');
    revalidatePath('/dashboard');
    return;
  }

  const adminClient = createSupabaseAdminClient();
  await adminClient.auth.admin.updateUserById(parsed.data.studentId, {
    ban_duration: parsed.data.nextStatus === 'active' ? 'none' : '87600h'
  });

  revalidatePath('/admin/students');
}

export async function toggleStudentCourseStatusAction(formData: FormData) {
  const parsed = toggleStudentCourseSchema.safeParse({
    studentId: formData.get('studentId'),
    courseId: formData.get('courseId'),
    nextStatus: formData.get('nextStatus')
  });

  if (!parsed.success) {
    return;
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await setDevStudentCourseStatus({
      studentId: parsed.data.studentId,
      courseId: parsed.data.courseId,
      status: parsed.data.nextStatus
    });
    revalidatePath('/admin/students');
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    revalidatePath('/dashboard');
    return;
  }

  const { supabase } = await requireRole('admin');
  await supabase.from('enrollments').upsert(
    {
      user_id: parsed.data.studentId,
      course_id: parsed.data.courseId,
      status: parsed.data.nextStatus
    },
    { onConflict: 'user_id,course_id' }
  );

  revalidatePath('/admin/students');
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
}

export async function toggleEnrollmentStatusAction(formData: FormData) {
  const enrollmentId = String(formData.get('enrollmentId') ?? '');
  const nextStatus = String(formData.get('nextStatus') ?? '');

  if (!enrollmentId || (nextStatus !== 'active' && nextStatus !== 'suspended')) {
    return;
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await setDevEnrollmentStatusById(enrollmentId, nextStatus);
  } else {
    const { supabase } = await requireRole('admin');
    await supabase.from('enrollments').update({ status: nextStatus }).eq('id', enrollmentId);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/students');
}

export async function addLessonAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = addLessonSchema.safeParse({
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    videoUrl: formData.get('videoUrl'),
    pdfUrl: formData.get('pdfUrl'),
    orderIndex: formData.get('orderIndex')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إضافة الدرس.' };
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await createDevLesson({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      videoUrl: toEmbeddableVideoUrl(parsed.data.videoUrl) ?? null,
      pdfUrl: parsed.data.pdfUrl || null,
      orderIndex: parsed.data.orderIndex
    });

    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    revalidatePath(`/courses/${parsed.data.courseId}`);

    return { success: 'تمت إضافة الدرس بنجاح (وضع معاينة محلي).' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase.from('lessons').insert({
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    video_url: toEmbeddableVideoUrl(parsed.data.videoUrl) ?? null,
    pdf_url: parsed.data.pdfUrl || null,
    order_index: parsed.data.orderIndex
  });

  if (error) {
    return { error: 'فشل حفظ الدرس في قاعدة البيانات.' };
  }

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تمت إضافة الدرس بنجاح.' };
}

export async function upsertQuizAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = upsertQuizSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId'),
    title: formData.get('title'),
    passMark: formData.get('passMark')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر حفظ الاختبار.' };
  }

  const { supabase } = await requireRole('admin');
  const { data: existingQuiz } = await supabase.from('quizzes').select('id').eq('lesson_id', parsed.data.lessonId).maybeSingle<{ id: string }>();

  const query = existingQuiz
    ? supabase.from('quizzes').update({ title: parsed.data.title, pass_mark: parsed.data.passMark }).eq('id', existingQuiz.id)
    : supabase.from('quizzes').insert({ lesson_id: parsed.data.lessonId, title: parsed.data.title, pass_mark: parsed.data.passMark });

  const { error } = await query;

  if (error) {
    return { error: 'فشل حفظ إعدادات الاختبار.' };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: existingQuiz ? 'تم تحديث الاختبار بنجاح.' : 'تم إنشاء الاختبار بنجاح.' };
}

export async function addQuestionAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = addQuestionSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId'),
    quizId: formData.get('quizId'),
    questionText: formData.get('questionText'),
    optionsText: formData.get('optionsText'),
    correctOptionNumber: formData.get('correctOptionNumber')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إضافة السؤال.' };
  }

  const options = parsed.data.optionsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (options.length < 2) {
    return { error: 'يجب إدخال خيارين على الأقل، كل خيار في سطر مستقل.' };
  }

  if (parsed.data.correctOptionNumber > options.length) {
    return { error: 'رقم الإجابة الصحيحة يتجاوز عدد الخيارات المدخلة.' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase.from('questions').insert({
    quiz_id: parsed.data.quizId,
    question_text: parsed.data.questionText,
    options,
    correct_option_index: parsed.data.correctOptionNumber - 1
  });

  if (error) {
    return { error: 'فشل حفظ السؤال في قاعدة البيانات.' };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تمت إضافة السؤال بنجاح.' };
}

export async function updateCourseAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = updateCourseSchema.safeParse({
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    description: formData.get('description'),
    published: formData.get('published') === 'on'
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر تحديث الدورة.' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase
    .from('courses')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      published: parsed.data.published
    })
    .eq('id', parsed.data.courseId);

  if (error) {
    return { error: 'فشل تحديث بيانات الدورة.' };
  }

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تم تحديث بيانات الدورة بنجاح.' };
}

export async function updateLessonAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = updateLessonSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId'),
    title: formData.get('title'),
    videoUrl: formData.get('videoUrl'),
    pdfUrl: formData.get('pdfUrl'),
    orderIndex: formData.get('orderIndex')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر تحديث الدرس.' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase
    .from('lessons')
    .update({
      title: parsed.data.title,
      video_url: toEmbeddableVideoUrl(parsed.data.videoUrl) ?? null,
      pdf_url: parsed.data.pdfUrl || null,
      order_index: parsed.data.orderIndex
    })
    .eq('id', parsed.data.lessonId);

  if (error) {
    return { error: 'فشل تحديث بيانات الدرس.' };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تم تحديث الدرس بنجاح.' };
}

export async function updateQuestionAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = updateQuestionSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId'),
    questionId: formData.get('questionId'),
    questionText: formData.get('questionText'),
    optionsText: formData.get('optionsText'),
    correctOptionNumber: formData.get('correctOptionNumber')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر تحديث السؤال.' };
  }

  const options = parsed.data.optionsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (options.length < 2) {
    return { error: 'يجب إدخال خيارين على الأقل، كل خيار في سطر مستقل.' };
  }

  if (parsed.data.correctOptionNumber > options.length) {
    return { error: 'رقم الإجابة الصحيحة يتجاوز عدد الخيارات المدخلة.' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase
    .from('questions')
    .update({
      question_text: parsed.data.questionText,
      options,
      correct_option_index: parsed.data.correctOptionNumber - 1
    })
    .eq('id', parsed.data.questionId);

  if (error) {
    return { error: 'فشل تحديث السؤال.' };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تم تحديث السؤال بنجاح.' };
}

export async function deleteCourseAction(formData: FormData) {
  const courseId = String(formData.get('courseId') ?? '');
  if (!courseId) {
    return;
  }

  const { supabase } = await requireRole('admin');
  await supabase.from('courses').delete().eq('id', courseId);

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
}

export async function deleteLessonAction(formData: FormData) {
  const courseId = String(formData.get('courseId') ?? '');
  const lessonId = String(formData.get('lessonId') ?? '');

  if (!courseId || !lessonId) {
    return;
  }

  const { supabase } = await requireRole('admin');
  await supabase.from('lessons').delete().eq('id', lessonId);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteQuizAction(formData: FormData) {
  const courseId = String(formData.get('courseId') ?? '');
  const quizId = String(formData.get('quizId') ?? '');

  if (!courseId || !quizId) {
    return;
  }

  const { supabase } = await requireRole('admin');
  await supabase.from('quizzes').delete().eq('id', quizId);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteQuestionAction(formData: FormData) {
  const courseId = String(formData.get('courseId') ?? '');
  const questionId = String(formData.get('questionId') ?? '');

  if (!courseId || !questionId) {
    return;
  }

  const { supabase } = await requireRole('admin');
  await supabase.from('questions').delete().eq('id', questionId);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
}

export async function assignStudentToCourseAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = assignStudentToCourseSchema.safeParse({
    courseId: formData.get('courseId'),
    studentId: formData.get('studentId')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إسناد الطالب إلى الدورة.' };
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await setDevStudentCourseStatus({
      studentId: parsed.data.studentId,
      courseId: parsed.data.courseId,
      status: 'active'
    });

    revalidatePath('/admin/students');
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    revalidatePath('/dashboard');

    return { success: 'تم إسناد الطالب إلى الدورة بنجاح.' };
  }

  const { supabase } = await requireRole('admin');
  const { error } = await supabase.from('enrollments').upsert(
    {
      user_id: parsed.data.studentId,
      course_id: parsed.data.courseId,
      status: 'active'
    },
    { onConflict: 'user_id,course_id' }
  );

  if (error) {
    return { error: 'فشل إسناد الطالب إلى الدورة.' };
  }

  revalidatePath('/admin/students');
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath('/dashboard');

  return { success: 'تم إسناد الطالب إلى الدورة بنجاح.' };
}

export async function removeEnrollmentAction(formData: FormData) {
  const courseId = String(formData.get('courseId') ?? '');
  const enrollmentId = String(formData.get('enrollmentId') ?? '');

  if (!courseId || !enrollmentId) {
    return;
  }

  if (process.env.DEV_ADMIN_BYPASS === 'true') {
    await removeDevEnrollmentById(enrollmentId);
  } else {
    const { supabase } = await requireRole('admin');
    await supabase.from('enrollments').delete().eq('id', enrollmentId);
  }

  revalidatePath('/admin/students');
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/dashboard');
}

export async function reviewEnrollmentRequestAction(formData: FormData) {
  const parsed = reviewEnrollmentRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    studentId: formData.get('studentId'),
    courseId: formData.get('courseId'),
    decision: formData.get('decision')
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, user } = await requireRole('admin');
  const approved = parsed.data.decision === 'approve';

  await supabase
    .from('enrollment_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', parsed.data.requestId);

  if (approved) {
    await supabase.from('enrollments').upsert(
      {
        user_id: parsed.data.studentId,
        course_id: parsed.data.courseId,
        status: 'active'
      },
      { onConflict: 'user_id,course_id' }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/students');
  revalidatePath('/catalog');
}
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import type { Question } from '@/types/database';

export type StudentActionState = {
  error?: string;
  success?: string;
  score?: number;
  passed?: boolean;
};

const markLessonSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح')
});

const submitQuizSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  lessonId: z.string().uuid('معرّف الدرس غير صالح'),
  quizId: z.string().uuid('معرّف الاختبار غير صالح')
});

export async function markLessonCompleteAction(_: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = markLessonSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر تحديث تقدم الدرس.' };
  }

  const { supabase, user } = await requireRole('student');

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: parsed.data.lessonId,
      completed: true
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) {
    return { error: 'فشل حفظ حالة إكمال الدرس.' };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return { success: 'تم تسجيل إكمال الدرس بنجاح.' };
}

export async function submitQuizAttemptAction(_: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = submitQuizSchema.safeParse({
    courseId: formData.get('courseId'),
    lessonId: formData.get('lessonId'),
    quizId: formData.get('quizId')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إرسال الاختبار.' };
  }

  const { supabase, user } = await requireRole('student');

  const [quizResult, questionsResult] = await Promise.all([
    supabase.from('quizzes').select('id, pass_mark').eq('id', parsed.data.quizId).maybeSingle<{ id: string; pass_mark: number }>(),
    supabase.from('questions').select('id, quiz_id, question_text, options, correct_option_index, created_at').eq('quiz_id', parsed.data.quizId).order('created_at', { ascending: true })
  ]);

  const quiz = quizResult.data;
  const questions = (questionsResult.data ?? []) as unknown as Question[];

  if (!quiz || questions.length === 0) {
    return { error: 'لا توجد أسئلة مرتبطة بهذا الاختبار.' };
  }

  let correctAnswers = 0;

  for (const question of questions) {
    const selectedValue = formData.get(`question_${question.id}`);
    const selectedIndex = Number(selectedValue);
    if (!Number.isNaN(selectedIndex) && selectedIndex === question.correct_option_index) {
      correctAnswers += 1;
    }
  }

  const score = Math.round((correctAnswers / questions.length) * 100);
  const passed = score >= quiz.pass_mark;

  const { error: attemptError } = await supabase.from('quiz_attempts').insert({
    user_id: user.id,
    quiz_id: parsed.data.quizId,
    score,
    passed
  });

  if (attemptError) {
    return { error: 'فشل حفظ نتيجة الاختبار.' };
  }

  if (passed) {
    await supabase.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: parsed.data.lessonId,
        completed: true
      },
      { onConflict: 'user_id,lesson_id' }
    );
  }

  revalidatePath('/dashboard');
  revalidatePath(`/courses/${parsed.data.courseId}`);

  return {
    success: passed ? 'تم اجتياز الاختبار وتحديث تقدم الدرس.' : 'تم حفظ المحاولة. يمكنك إعادة الاختبار لتحسين النتيجة.',
    score,
    passed
  };
}
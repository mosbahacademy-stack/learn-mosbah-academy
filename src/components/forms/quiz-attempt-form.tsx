'use client';

import { useActionState } from 'react';
import { CircleHelp, Send } from 'lucide-react';

import { submitQuizAttemptAction, type StudentActionState } from '@/features/student/actions';
import type { Question } from '@/types/database';
import { Button } from '@/components/ui/button';

const initialState: StudentActionState = {};

export function QuizAttemptForm({
  courseId,
  lessonId,
  quizId,
  passMark,
  questions
}: {
  courseId: string;
  lessonId: string;
  quizId: string;
  passMark: number;
  questions: Question[];
}) {
  const [state, formAction, isPending] = useActionState(submitQuizAttemptAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="quizId" value={quizId} />

      <div className="rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand-deep">درجة النجاح المطلوبة: {passMark}%</div>

      {questions.map((question, questionIndex) => (
        <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-2 text-ink">
            <CircleHelp className="mt-1 h-4 w-4 text-accent" />
            <div className="font-medium">{questionIndex + 1}. {question.question_text}</div>
          </div>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label key={`${question.id}-${optionIndex}`} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-brand/40 hover:bg-brand/5">
                <input type="radio" name={`question_${question.id}`} value={optionIndex} className="h-4 w-4 border-slate-300 text-brand focus:ring-brand" />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? (
        <div className={`rounded-2xl px-4 py-3 text-sm ${state.passed ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
          {state.success}
          {typeof state.score === 'number' ? ` النتيجة: ${state.score}%.` : ''}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending}>
        <Send className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ تصحيح الاختبار...' : 'إرسال الاختبار'}
      </Button>
    </form>
  );
}
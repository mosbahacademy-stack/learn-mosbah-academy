'use client';

import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { markLessonCompleteAction, type StudentActionState } from '@/features/student/actions';
import { Button } from '@/components/ui/button';

const initialState: StudentActionState = {};

export function LessonCompleteForm({ courseId, lessonId, disabled }: { courseId: string; lessonId: string; disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(markLessonCompleteAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={disabled || isPending} className="w-full sm:w-auto">
        <CheckCircle2 className="ml-2 h-4 w-4" />
        {disabled ? 'الدرس مكتمل' : isPending ? 'جارٍ الحفظ...' : 'تسجيل إكمال الدرس'}
      </Button>
    </form>
  );
}
'use client';

import { useActionState } from 'react';
import { PlusCircle } from 'lucide-react';

import { addQuestionAction, type AdminFormState } from '@/features/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const initialState: AdminFormState = {};

export function AdminQuestionForm({ courseId, lessonId, quizId }: { courseId: string; lessonId: string; quizId: string }) {
  const [state, formAction, isPending] = useActionState(addQuestionAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="quizId" value={quizId} />
      <div>
        <Label htmlFor="question-text">نص السؤال</Label>
        <Textarea
          id="question-text"
          name="questionText"
          rows={3}
          placeholder="أدخل السؤال هنا"
        />
      </div>
      <div>
        <Label htmlFor="options-text">الخيارات</Label>
        <Textarea
          id="options-text"
          name="optionsText"
          rows={5}
          placeholder={'كل خيار في سطر مستقل\nالخيار الأول\nالخيار الثاني\nالخيار الثالث'}
        />
      </div>
      <div>
        <Label htmlFor="correct-option">رقم الإجابة الصحيحة</Label>
        <Input id="correct-option" name="correctOptionNumber" type="number" min={1} placeholder="1" />
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending}>
        <PlusCircle className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ إضافة السؤال...' : 'إضافة سؤال'}
      </Button>
    </form>
  );
}
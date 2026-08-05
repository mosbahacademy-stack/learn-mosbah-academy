'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';

import { updateQuestionAction, type AdminFormState } from '@/features/admin/actions';
import type { Question } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const initialState: AdminFormState = {};

export function AdminQuestionEditForm({ courseId, lessonId, question }: { courseId: string; lessonId: string; question: Question }) {
  const [state, formAction, isPending] = useActionState(updateQuestionAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="questionId" value={question.id} />
      <div>
        <Label htmlFor={`question-edit-${question.id}`}>نص السؤال</Label>
        <Textarea
          id={`question-edit-${question.id}`}
          name="questionText"
          rows={3}
          defaultValue={question.question_text}
        />
      </div>
      <div>
        <Label htmlFor={`options-edit-${question.id}`}>الخيارات</Label>
        <Textarea
          id={`options-edit-${question.id}`}
          name="optionsText"
          rows={5}
          defaultValue={question.options.join('\n')}
        />
      </div>
      <div>
        <Label htmlFor={`correct-option-edit-${question.id}`}>رقم الإجابة الصحيحة</Label>
        <Input id={`correct-option-edit-${question.id}`} name="correctOptionNumber" type="number" min={1} defaultValue={question.correct_option_index + 1} />
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending}>
        <Save className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ التحديث...' : 'حفظ السؤال'}
      </Button>
    </form>
  );
}
'use client';

import { useActionState } from 'react';
import { FileQuestion } from 'lucide-react';

import { upsertQuizAction, type AdminFormState } from '@/features/admin/actions';
import type { Quiz } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: AdminFormState = {};

export function AdminQuizForm({ courseId, lessonId, quiz }: { courseId: string; lessonId: string; quiz: Quiz | null }) {
  const [state, formAction, isPending] = useActionState(upsertQuizAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <div>
        <Label htmlFor="quiz-title">عنوان الاختبار</Label>
        <Input id="quiz-title" name="title" placeholder="مثال: اختبار الوحدة الأولى" defaultValue={quiz?.title ?? ''} />
      </div>
      <div>
        <Label htmlFor="quiz-pass-mark">درجة النجاح</Label>
        <Input id="quiz-pass-mark" name="passMark" type="number" min={0} max={100} defaultValue={quiz?.pass_mark ?? 60} />
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending}>
        <FileQuestion className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ الحفظ...' : quiz ? 'تحديث الاختبار' : 'إنشاء الاختبار'}
      </Button>
    </form>
  );
}
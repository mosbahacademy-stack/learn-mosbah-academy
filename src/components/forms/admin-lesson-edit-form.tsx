'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';

import { updateLessonAction, type AdminFormState } from '@/features/admin/actions';
import type { Lesson } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: AdminFormState = {};

export function AdminLessonEditForm({ courseId, lesson }: { courseId: string; lesson: Lesson }) {
  const [state, formAction, isPending] = useActionState(updateLessonAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lesson.id} />
      <div>
        <Label htmlFor="lesson-title-edit">عنوان الدرس</Label>
        <Input id="lesson-title-edit" name="title" defaultValue={lesson.title} />
      </div>
      <div>
        <Label htmlFor="lesson-order-edit">ترتيب الدرس</Label>
        <Input id="lesson-order-edit" name="orderIndex" type="number" min={1} defaultValue={lesson.order_index} />
      </div>
      <div>
        <Label htmlFor="lesson-video-edit">رابط الفيديو</Label>
        <Input id="lesson-video-edit" name="videoUrl" defaultValue={lesson.video_url ?? ''} placeholder="https://iframe.mediadelivery.net/..." />
      </div>
      <div>
        <Label htmlFor="lesson-pdf-edit">رابط PDF</Label>
        <Input id="lesson-pdf-edit" name="pdfUrl" defaultValue={lesson.pdf_url ?? ''} placeholder="https://..." />
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending}>
        <Save className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ التحديث...' : 'حفظ بيانات الدرس'}
      </Button>
    </form>
  );
}
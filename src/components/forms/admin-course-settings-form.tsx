'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';

import { updateCourseAction, type AdminFormState } from '@/features/admin/actions';
import type { Course } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const initialState: AdminFormState = {};

export function AdminCourseSettingsForm({ course }: { course: Course }) {
  const [state, formAction, isPending] = useActionState(updateCourseAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={course.id} />
      <div>
        <Label htmlFor="course-title-edit">عنوان الدورة</Label>
        <Input id="course-title-edit" name="title" defaultValue={course.title} />
      </div>
      <div>
        <Label htmlFor="course-description-edit">الوصف</Label>
        <Textarea
          id="course-description-edit"
          name="description"
          rows={4}
          defaultValue={course.description}
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-600">
        <input name="published" type="checkbox" defaultChecked={course.published} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
        الدورة منشورة للطلاب
      </label>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending}>
        <Save className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ التحديث...' : 'حفظ إعدادات الدورة'}
      </Button>
    </form>
  );
}
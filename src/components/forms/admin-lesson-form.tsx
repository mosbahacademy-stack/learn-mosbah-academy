'use client';

import { useActionState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Plus } from 'lucide-react';

import { addLessonAction, type AdminFormState } from '@/features/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const initialState: AdminFormState = {};

type CourseOption = {
  id: string;
  title: string;
};

type AdminLessonFormProps = {
  courseId?: string;
  nextOrderIndex?: number;
  courseOptions?: CourseOption[];
  onSuccess?: (data: { courseId: string; title: string; videoUrl: string; pdfUrl: string }) => void;
};

export function AdminLessonForm({ courseId, nextOrderIndex, courseOptions = [], onSuccess }: AdminLessonFormProps) {
  const [state, formAction, isPending] = useActionState(addLessonAction, initialState);
  const hasCourseSelector = !courseId;
  const submittedPayloadRef = useRef<{ courseId: string; title: string; videoUrl: string; pdfUrl: string } | null>(null);

  useEffect(() => {
    if (!state.success || !onSuccess) {
      return;
    }

    const payload = submittedPayloadRef.current;

    if (!payload?.courseId || !payload.title) {
      return;
    }

    onSuccess(payload);
    submittedPayloadRef.current = null;
  }, [courseId, onSuccess, state.success]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        const form = event.currentTarget;
        const formData = new FormData(form);
        submittedPayloadRef.current = {
          courseId: String(formData.get('courseId') ?? ''),
          title: String(formData.get('title') ?? ''),
          videoUrl: String(formData.get('videoUrl') ?? ''),
          pdfUrl: String(formData.get('pdfUrl') ?? '')
        };
      }}
    >
      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
      {hasCourseSelector ? (
        <div>
          <Label htmlFor="lesson-course">اختيار الدورة</Label>
          <Select id="lesson-course" name="courseId" defaultValue="" disabled={courseOptions.length === 0}>
            <option value="" disabled>
              {courseOptions.length === 0 ? 'أنشئ دورة أولًا ثم اخترها هنا' : 'اختر الدورة التي تريد رفع الفيديو لها'}
            </option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div>
        <Label htmlFor="lesson-title">عنوان الدرس</Label>
        <Input id="lesson-title" name="title" placeholder="مثال: مدخل إلى الدورة" />
      </div>
      <div>
        <Label htmlFor="lesson-order">ترتيب الدرس</Label>
        <Input id="lesson-order" name="orderIndex" type="number" min={1} defaultValue={nextOrderIndex ?? 1} />
      </div>
      <div>
        <Label htmlFor="lesson-video">رابط الفيديو</Label>
        <Input id="lesson-video" name="videoUrl" placeholder="https://iframe.mediadelivery.net/..." />
      </div>
      <div>
        <Label htmlFor="lesson-pdf">رابط PDF</Label>
        <Input id="lesson-pdf" name="pdfUrl" placeholder="https://..." />
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending || (hasCourseSelector && courseOptions.length === 0)}>
        <Plus className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ إضافة الدرس...' : 'إضافة درس'}
      </Button>
    </form>
  );
}
'use client';

import { useActionState } from 'react';
import { UserPlus } from 'lucide-react';

import { assignStudentToCourseAction, type AdminFormState } from '@/features/admin/actions';
import type { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const initialState: AdminFormState = {};

export function AdminCourseEnrollmentForm({ courseId, students }: { courseId: string; students: Profile[] }) {
  const [state, formAction, isPending] = useActionState(assignStudentToCourseAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div>
        <Label htmlFor="studentId">إسناد طالب إلى الدورة</Label>
        <Select
          id="studentId"
          name="studentId"
          defaultValue=""
        >
          <option value="" disabled>
            اختر طالبًا غير مسجل في هذه الدورة
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name || student.email}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}
      <Button type="submit" disabled={isPending || students.length === 0}>
        <UserPlus className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ الإسناد...' : 'إسناد الطالب'}
      </Button>
    </form>
  );
}
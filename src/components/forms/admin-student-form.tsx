'use client';

import { useActionState } from 'react';

import { createStudentAction, type AdminFormState } from '@/features/admin/actions';
import type { Course } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const initialState: AdminFormState = {};

export function AdminStudentForm({ courses }: { courses: Course[] }) {
  const [state, formAction, isPending] = useActionState(createStudentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="fullName">الاسم الكامل</Label>
        <Input id="fullName" name="fullName" placeholder="اسم الطالب" />
      </div>
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" placeholder="name@example.com" type="email" />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور الأولية</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" />
      </div>
      <div>
        <Label htmlFor="courseIds">تفعيل الدورات للطالب</Label>
        <Select
          id="courseIds"
          name="courseIds"
          multiple
          size={Math.min(6, Math.max(3, courses.length || 3))}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-slate-500">يمكنك اختيار أكثر من دورة بالضغط مع Ctrl أو Shift.</p>
      </div>

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}

      <Button type="submit" disabled={isPending}>{isPending ? 'جارٍ الإنشاء...' : 'حفظ الطالب'}</Button>
    </form>
  );
}
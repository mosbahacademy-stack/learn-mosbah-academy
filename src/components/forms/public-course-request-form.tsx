'use client';

import { useActionState } from 'react';

import { requestEnrollmentAction, type PublicFormState } from '@/features/public/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const initialState: PublicFormState = {};

export function PublicCourseRequestForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState(requestEnrollmentAction, initialState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="courseId" value={courseId} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 md:order-1">
          <div>
            <Label htmlFor="paymentMethod">طريقة الدفع</Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue="baridi_mob"
              className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="baridi_mob">بريدي موب</option>
              <option value="bank_transfer">تحويل بنكي</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            المطلوب فقط: رفع صورة واضحة لوصل الدفع، ثم إرسال الطلب للمراجعة.
          </div>
        </div>

        <div className="md:order-2">
          <Label htmlFor="paymentReceipt">صورة وصل الدفع</Label>
          <label htmlFor="paymentReceipt" className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand/10">
            <span className="text-sm font-semibold text-ink">اضغط لرفع صورة الوصل</span>
            <span className="mt-1 text-xs text-slate-500">JPG / PNG / WEBP - حتى 5MB</span>
            <input
              id="paymentReceipt"
              name="paymentReceipt"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              required
            />
          </label>
        </div>
      </div>

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'جارٍ إرسال الطلب...' : 'طلب التسجيل في الدورة'}
      </Button>
    </form>
  );
}

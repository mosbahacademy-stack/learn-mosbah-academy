'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useActionState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { requestEnrollmentAction, type PublicFormState } from '@/features/public/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const initialState: PublicFormState = {};

export function PublicCourseRequestForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState(requestEnrollmentAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function clearFile(e: React.MouseEvent) {
    e.preventDefault();
    setPreview(null);
    setFileName(null);
    const input = document.getElementById('paymentReceipt') as HTMLInputElement;
    if (input) input.value = '';
  }

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

          {preview ? (
            <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-brand/40">
              <Image src={preview} alt="معاينة الوصل" width={400} height={200} className="h-44 w-full object-cover" unoptimized />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2">
                <span className="max-w-[160px] truncate text-xs text-white">{fileName}</span>
                <button onClick={clearFile} className="rounded-full bg-white/20 p-1 text-white hover:bg-white/40">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="paymentReceipt" className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand/10">
              <ImagePlus className="mb-2 h-8 w-8 text-brand/50" />
              <span className="text-sm font-semibold text-ink">اضغط لاختيار صورة الوصل</span>
              <span className="mt-1 text-xs text-slate-500">JPG / PNG / WEBP — حتى 5MB</span>
            </label>
          )}

          <input
            id="paymentReceipt"
            name="paymentReceipt"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            required
            onChange={handleFileChange}
          />
        </div>
      </div>

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}

      <Button type="submit" disabled={isPending || !preview}>
        {isPending ? 'جارٍ إرسال الطلب...' : 'طلب التسجيل في الدورة'}
      </Button>
    </form>
  );
}

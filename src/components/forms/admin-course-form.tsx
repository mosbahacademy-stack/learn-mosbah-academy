'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { createCourseAction, type AdminFormState } from '@/features/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const initialState: AdminFormState = {};

export function AdminCourseForm() {
  const [state, formAction, isPending] = useActionState(createCourseAction, initialState);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setThumbnailPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setThumbnailPreview(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">عنوان الدورة</Label>
        <Input id="title" name="title" placeholder="أدخل عنوان الدورة" />
      </div>
      <div>
        <Label htmlFor="thumbnail">الصورة المصغرة للدورة</Label>
        <Input id="thumbnail" type="file" accept="image/*" onChange={handleThumbnailFileChange} />
        <input type="hidden" name="thumbnailDataUrl" value={thumbnailPreview} />
        <p className="mt-1 text-xs text-slate-500">يمكنك رفع صورة مباشرة، أو استخدام رابط صورة من الحقل التالي.</p>
      </div>
      <div>
        <Label htmlFor="thumbnailUrl">رابط الصورة المصغرة (اختياري)</Label>
        <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://..." />
      </div>
      {thumbnailPreview ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <img src={thumbnailPreview} alt="معاينة الصورة المصغرة" className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="وصف مختصر وواضح"
        />
      </div>
      <div>
        <Label htmlFor="priceDzd">سعر الدورة (دج)</Label>
        <Input id="priceDzd" name="priceDzd" type="number" min={0} step={100} placeholder="5000" />
      </div>
      <div>
        <Label htmlFor="paymentNotes">تعليمات الدفع (بريدي موب / تحويل)</Label>
        <Textarea
          id="paymentNotes"
          name="paymentNotes"
          rows={3}
          placeholder="مثال: الدفع عبر بريدي موب إلى الحساب 00799999 ثم إدخال رقم العملية."
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-600">
        <input name="published" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
        نشر الدورة مباشرة للطلاب
      </label>

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}

      <Button type="submit" disabled={isPending}>
        <Plus className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ الحفظ...' : 'حفظ الدورة'}
      </Button>
    </form>
  );
}
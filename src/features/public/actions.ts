'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAuthenticatedUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type PublicFormState = {
  error?: string;
  success?: string;
};

const requestEnrollmentSchema = z.object({
  courseId: z.string().uuid('معرّف الدورة غير صالح'),
  paymentMethod: z.enum(['baridi_mob', 'bank_transfer'])
});

const RECEIPTS_BUCKET = 'payment-receipts';

function isSupportedReceiptType(type: string) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(type);
}

export async function requestEnrollmentAction(_: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = requestEnrollmentSchema.safeParse({
    courseId: formData.get('courseId'),
    paymentMethod: formData.get('paymentMethod')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر إرسال الطلب.' };
  }

  const receiptFile = formData.get('paymentReceipt');
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return { error: 'يرجى رفع صورة وصل الدفع قبل إرسال الطلب.' };
  }

  if (!isSupportedReceiptType(receiptFile.type)) {
    return { error: 'صيغة صورة الوصل غير مدعومة. استخدم JPG أو PNG أو WEBP.' };
  }

  if (receiptFile.size > 5 * 1024 * 1024) {
    return { error: 'حجم صورة الوصل كبير. الحد الأقصى 5MB.' };
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const adminClient = createSupabaseAdminClient();

  const { data: existingPending } = await supabase
    .from('enrollment_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', parsed.data.courseId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) {
    return { error: 'يوجد طلب قيد المراجعة لهذه الدورة بالفعل.' };
  }

  const extension = receiptFile.type === 'image/png' ? 'png' : receiptFile.type === 'image/webp' ? 'webp' : 'jpg';
  const receiptPath = `${user.id}/${parsed.data.courseId}/${Date.now()}.${extension}`;

  let { error: uploadError } = await adminClient.storage.from(RECEIPTS_BUCKET).upload(receiptPath, receiptFile, {
    cacheControl: '3600',
    contentType: receiptFile.type,
    upsert: false
  });

  if (uploadError && /bucket/i.test(uploadError.message)) {
    await adminClient.storage.createBucket(RECEIPTS_BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    const retry = await adminClient.storage.from(RECEIPTS_BUCKET).upload(receiptPath, receiptFile, {
      cacheControl: '3600',
      contentType: receiptFile.type,
      upsert: false
    });
    uploadError = retry.error;
  }

  if (uploadError) {
    return { error: 'تعذر رفع صورة الوصل. حاول مرة أخرى.' };
  }

  const { error } = await supabase.from('enrollment_requests').insert({
    user_id: user.id,
    course_id: parsed.data.courseId,
    payment_method: parsed.data.paymentMethod,
    payment_reference: receiptPath,
    proof_note: '',
    status: 'pending'
  });

  if (error) {
    await adminClient.storage.from(RECEIPTS_BUCKET).remove([receiptPath]);
    return { error: 'تعذر إرسال طلب الالتحاق. حاول مرة أخرى.' };
  }

  revalidatePath('/catalog');
  revalidatePath(`/catalog/${parsed.data.courseId}`);
  revalidatePath('/admin');
  revalidatePath('/admin/students');

  return { success: 'تم إرسال الطلب إلى الإدارة بنجاح. سيتم تفعيل دورتك بعد المراجعة.' };
}

'use server';

import { redirect } from 'next/navigation';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

import { loginSchema, registerSchema } from './schema';

export type LoginFormState = {
  error?: string;
  success?: string;
};

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر التحقق من البيانات المدخلة.' };
  }

  const supabase = await createSupabaseServerClient();

  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

  if (signInError) {
    return { error: 'تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.' };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'لم يتم العثور على الجلسة بعد تسجيل الدخول.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>();

  if (profileError || !profile) {
    return { error: 'تم تسجيل الدخول لكن تعذر تحديد نوع الحساب.' };
  }

  redirect(profile.role === 'admin' ? '/admin' : '/catalog');
}

export async function registerAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    state: formData.get('state'),
    city: formData.get('city'),
    institution: formData.get('institution'),
    phone: formData.get('phone'),
    academicLevel: formData.get('academicLevel'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'تعذر التحقق من بيانات التسجيل.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();
    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createUserError || !createdUserData.user) {
      return { error: createUserError?.message || 'تعذر إنشاء الحساب. حاول مرة أخرى.' };
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: fullName,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        state: parsed.data.state,
        city: parsed.data.city,
        institution: parsed.data.institution,
        phone: parsed.data.phone,
        academic_level: parsed.data.academicLevel
      })
      .eq('id', createdUserData.user.id);

    if (profileError) {
      return { error: 'تم إنشاء الحساب لكن تعذر حفظ البيانات الإضافية. تواصل مع الإدارة.' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (signInError) {
      return { success: 'تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول مباشرة بنفس البريد وكلمة المرور.' };
    }

    redirect('/catalog');
  } catch (error) {
    const digest = typeof error === 'object' && error !== null && 'digest' in error ? String((error as { digest?: string }).digest) : '';
    if (digest.includes('NEXT_REDIRECT')) {
      throw error;
    }

    const message = error instanceof Error ? error.message : '';

    if (message.includes('placeholders') || message.includes('Supabase environment variables')) {
      return { error: 'إعدادات Supabase غير صحيحة في .env.local. تأكد من وضع رابط المشروع والمفاتيح الحقيقية.' };
    }

    if (message.toLowerCase().includes('fetch failed')) {
      return { error: 'تعذر الاتصال بخادم Supabase. تحقق من الإنترنت وصحة رابط المشروع.' };
    }

    return { error: 'حدث خطأ غير متوقع أثناء التسجيل. حاول مجددًا.' };
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
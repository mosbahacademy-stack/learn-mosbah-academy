'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';

import { registerAction, type LoginFormState } from '@/features/auth/actions';
import { registerSchema, type RegisterInput } from '@/features/auth/schema';
import { ACADEMIC_LEVEL_OPTIONS, ALGERIAN_MUNICIPALITIES, ALGERIAN_WILAYAS } from '@/lib/algeria-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: LoginFormState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur'
  });

  const selectedWilaya = watch('state');
  const cityOptions = useMemo(() => {
    if (!selectedWilaya) {
      return [];
    }

    return ALGERIAN_MUNICIPALITIES[selectedWilaya as keyof typeof ALGERIAN_MUNICIPALITIES] ?? [];
  }, [selectedWilaya]);

  useEffect(() => {
    setValue('city', '');
  }, [selectedWilaya, setValue]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">الاسم</Label>
          <Input id="firstName" placeholder="الاسم" {...register('firstName')} />
          {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="lastName">اللقب</Label>
          <Input id="lastName" placeholder="اللقب" {...register('lastName')} />
          {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">الولاية</Label>
          <select
            id="state"
            defaultValue=""
            className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            {...register('state')}
          >
            <option value="" disabled>
              اختر الولاية
            </option>
            {ALGERIAN_WILAYAS.map((wilaya) => (
              <option key={wilaya} value={wilaya}>
                {wilaya}
              </option>
            ))}
          </select>
          {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="city">البلدية</Label>
          <select
            id="city"
            defaultValue=""
            disabled={!selectedWilaya}
            className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            {...register('city')}
          >
            <option value="" disabled>
              {selectedWilaya ? 'اختر البلدية' : 'اختر الولاية أولًا'}
            </option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city.message}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="institution">المؤسسة</Label>
        <Input id="institution" placeholder="اسم المدرسة أو الجامعة" {...register('institution')} />
        {errors.institution ? <p className="mt-1 text-xs text-red-600">{errors.institution.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" placeholder="05XXXXXXXX" {...register('phone')} />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="academicLevel">المستوى الدراسي</Label>
          <select
            id="academicLevel"
            defaultValue=""
            className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            {...register('academicLevel')}
          >
            <option value="" disabled>
              اختر المستوى الدراسي
            </option>
            {ACADEMIC_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.academicLevel ? <p className="mt-1 text-xs text-red-600">{errors.academicLevel.message}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
        {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
        {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
        <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
        {errors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>

      {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div> : null}

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        لديك حساب؟ <Link href="/login" className="text-brand underline-offset-4 hover:underline">سجّل الدخول</Link>
      </p>
    </form>
  );
}

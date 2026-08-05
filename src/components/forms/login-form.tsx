'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, LogIn, Mail } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';

import { loginAction, type LoginFormState } from '@/features/auth/actions';
import { type LoginInput, loginSchema } from '@/features/auth/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const {
    register,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" type="email" placeholder="name@example.com" className="pr-11" {...register('email')} />
        </div>
        {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="password" type="password" placeholder="••••••••" className="pr-11" {...register('password')} />
        </div>
        {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      <Button className="w-full" type="submit" disabled={isPending}>
        <LogIn className="ml-2 h-4 w-4" />
        {isPending ? 'جارٍ تسجيل الدخول...' : 'دخول'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        الرجوع إلى <Link href="/" className="text-brand underline-offset-4 hover:underline">الصفحة الرئيسية</Link>
      </p>
      <p className="text-center text-sm text-slate-500">
        لا تملك حسابًا؟ <Link href="/register" className="text-brand underline-offset-4 hover:underline">أنشئ حساب جديد</Link>
      </p>
    </form>
  );
}
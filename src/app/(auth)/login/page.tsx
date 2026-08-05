import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/forms/login-form';
import { AuthShell } from '@/components/layout/auth-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const isDevAdminBypassEnabled = process.env.DEV_ADMIN_BYPASS === 'true';

  if (isDevAdminBypassEnabled) {
    redirect('/admin');
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: 'student' | 'admin' }>();
      if (profile?.role) {
        redirect(profile.role === 'admin' ? '/admin' : '/catalog');
      }
    }
  } catch {
    // Render login form so users can still see a clear actionable error from server actions.
  }

  return (
    <AuthShell>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>أدخل البريد الإلكتروني وكلمة المرور للوصول إلى حسابك.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
    </AuthShell>
  );
}
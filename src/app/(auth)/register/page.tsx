import { redirect } from 'next/navigation';

import { RegisterForm } from '@/components/forms/register-form';
import { AuthShell } from '@/components/layout/auth-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function RegisterPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect('/catalog');
    }
  } catch {
    // Keep registration form visible when environment is not configured yet.
  }

  return (
    <AuthShell>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>تسجيل طالب جديد</CardTitle>
          <CardDescription>أكمل بياناتك الأساسية ثم انتقل إلى قائمة الدورات لطلب الالتحاق.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthShell>
  );
}

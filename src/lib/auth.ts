import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AppRole, Profile } from '@/types/database';

function isDevAdminBypassEnabled() {
  return process.env.DEV_ADMIN_BYPASS === 'true';
}

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { supabase, user };
}

export async function requireRole(role: AppRole) {
  if (isDevAdminBypassEnabled()) {
    const supabase = await createSupabaseServerClient();
    const devUserId = role === 'admin' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002';
    const devEmail = role === 'admin' ? 'admin-preview@mosbah.local' : 'student-preview@mosbah.local';
    const devName = role === 'admin' ? 'مدير المعاينة' : 'طالب المعاينة';

    return {
      supabase,
      user: {
        id: devUserId,
        email: devEmail
      },
      profile: {
        id: devUserId,
        email: devEmail,
        full_name: devName,
        role,
        created_at: new Date().toISOString()
      } as Profile
    };
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== role) {
    redirect(profile.role === 'admin' ? '/admin' : '/dashboard');
  }

  return { supabase, user, profile };
}
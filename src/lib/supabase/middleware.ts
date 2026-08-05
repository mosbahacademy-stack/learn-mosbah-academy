import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseEnv } from '@/lib/supabase/shared';

type MiddlewareAuthState = {
  response: NextResponse;
  userId: string | null;
  role: 'student' | 'admin' | null;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value, ...(options as { [key: string]: unknown }) });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...(options as { [key: string]: unknown }) });
      },
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value: '', ...(options as { [key: string]: unknown }) });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...(options as { [key: string]: unknown }), maxAge: 0 });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role: 'student' | 'admin' | null = null;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle<{ role: 'student' | 'admin' }>();
    role = profile?.role ?? null;
  }

  return {
    response,
    userId: user?.id ?? null,
    role
  } satisfies MiddlewareAuthState;
}
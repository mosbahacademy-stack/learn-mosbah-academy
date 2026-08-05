import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabaseEnv } from '@/lib/supabase/shared';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set(name, '', { ...(options as Parameters<typeof cookieStore.set>[2]), maxAge: 0 });
      }
    }
  });
}
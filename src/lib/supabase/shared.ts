const missingEnvMessage = 'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
const placeholderEnvMessage = 'Supabase environment variables are placeholders. Replace your-project and sample keys with real values in .env.local.';

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(missingEnvMessage);
  }

  const hasPlaceholder =
    url.includes('your-project.supabase.co') ||
    anonKey === 'your-anon-key' ||
    anonKey.includes('placeholder');

  if (hasPlaceholder) {
    throw new Error(placeholderEnvMessage);
  }

  return { url, anonKey };
}
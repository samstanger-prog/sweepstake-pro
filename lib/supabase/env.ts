export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceKey);
}

export const SUPABASE_SETUP_STEPS = [
  "Create a free project at supabase.com",
  "Open SQL Editor and run supabase/migrations/001_initial.sql",
  "In Project Settings → API, copy Project URL, anon key, and service_role key",
  "Paste them into .env.local (see .env.example)",
  "Restart npm run dev",
] as const;

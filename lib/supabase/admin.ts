import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "./env";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase admin client not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart npm run dev."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

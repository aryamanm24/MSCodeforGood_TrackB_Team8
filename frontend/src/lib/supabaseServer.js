import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for API routes.
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env (e.g. frontend/.env.local).
 */
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

export function isSupabaseBrowserConfigured() {
  return isSupabaseConfigured();
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("AD Church Supabase is not configured.");
  }

  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );
}

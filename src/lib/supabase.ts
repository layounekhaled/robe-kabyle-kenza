/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client using environment variables.
 * Used for Storage operations (upload, delete, public URL generation).
 * 
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Create client only when properly configured, otherwise use a dummy placeholder
// This prevents the "supabaseUrl is required" error during build/SSG
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

if (!isSupabaseConfigured()) {
  console.warn(
    "[SUPABASE] Missing environment variables. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable image uploads."
  );
}

export const SUPABASE_BUCKET = "products";

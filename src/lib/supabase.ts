/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client using environment variables.
 * Used for Storage operations (upload, delete, public URL generation).
 * 
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key (client-side, for reads)
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (server-side, for writes)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Check if Supabase is properly configured (client-side reads)
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Check if Supabase admin is properly configured (server-side writes)
 */
export function isSupabaseAdminConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceRoleKey);
}

// ─── Client-side client (anon key, for reads & public URL generation) ──────
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

// ─── Server-side admin client (service role key, bypasses RLS) ─────────────
// Used for upload, delete, and other write operations from API routes.
// The service role key has full access and bypasses Row Level Security.
export const supabaseAdmin: SupabaseClient = isSupabaseAdminConfigured()
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
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

if (!isSupabaseAdminConfigured()) {
  console.warn(
    "[SUPABASE] Missing SUPABASE_SERVICE_ROLE_KEY. " +
    "Server-side storage operations (upload/delete) may fail."
  );
}

export const SUPABASE_BUCKET = "products";

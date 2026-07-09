import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

/**
 * Typed Supabase client for the web app.
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment.
 * In development, these default to the local Supabase CLI values.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

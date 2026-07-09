/**
 * Typed Supabase client for the mobile app.
 *
 * Uses EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * from environment variables (Expo's EXPO_PUBLIC_ prefix).
 * Falls back to app.json extra fields for build-time injection.
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from './database.types';

declare const process:
  | {
      env: {
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
      };
    }
  | undefined;

const supabaseUrl =
  (typeof process !== 'undefined'
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : undefined) ??
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined);

const supabaseAnonKey =
  (typeof process !== 'undefined'
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : undefined) ??
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env or app.json extra.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

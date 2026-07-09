/**
 * AuthContext — Reactive authentication state provider (mobile).
 *
 * Mirrors the web AuthContext in packages/web/src/features/auth/context/AuthContext.tsx.
 * Same interface so hooks and screens are portable between platforms.
 *
 * Uses Supabase `onAuthStateChange` to keep user/session reactive across
 * screens and app restarts (session persisted via AsyncStorage).
 *
 * Consumer hook: useAuth()
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { mergeLocalCart } from '../../cart/api/queries';
import {
  getAnonymousCartItems,
  clearAnonymousCart,
} from '../../cart/hooks/use-anonymous-cart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisterInput {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
}

export interface AuthContextValue {
  /** Current authenticated user, or null if signed out */
  user: User | null;
  /** Current Supabase session, or null if signed out */
  session: Session | null;
  /** True while the initial session check is in flight */
  isLoading: boolean;
  /** Authenticate with email + password */
  login: (email: string, password: string) => Promise<void>;
  /** Create a new account and sign in */
  register: (input: RegisterInput) => Promise<void>;
  /** Sign the current user out */
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track mounted state to avoid setting state after unmount
  const mountedRef = useRef(true);
  // Tracks whether the initial session recovery has completed.
  // Prevents cart merge on initial load (only merges on real SIGNED_IN events).
  const initialLoadDoneRef = useRef(false);

  // ------------------------------------------------------------------
  // Cart merge helper
  // ------------------------------------------------------------------

  /**
   * After successful sign-in, check for anonymous local cart items and
   * merge (UPSERT) them into the server-side cart. Clears local storage
   * on success. On error, preserves local items for retry.
   */
  const mergeCartOnLogin = useCallback(async (userId: string) => {
    const localItems = await getAnonymousCartItems();
    if (localItems.length === 0) return;

    try {
      await mergeLocalCart(userId, localItems);
      await clearAnonymousCart();
    } catch {
      // Network error — keep local items so the merge can be retried
      // The user still gets logged in, just without cart merge this time
    }
  }, []);

  // ------------------------------------------------------------------
  // Initial session check + reactive listener
  // ------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    // 1. Recover session from storage on boot
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mountedRef.current) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
      initialLoadDoneRef.current = true;
    });

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mountedRef.current) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      // Merge local cart into server on actual sign-in (skip initial load)
      if (_event === 'SIGNED_IN' && initialLoadDoneRef.current) {
        const userId = currentSession?.user?.id;
        if (userId) {
          mergeCartOnLogin(userId);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [mergeCartOnLogin]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // AuthContext listener picks up the new session automatically
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          nombre: input.nombre,
          apellido: input.apellido ?? null,
          telefono: input.telefono ?? null,
        },
      },
    });
    if (error) throw error;
    // The handle_new_user DB trigger creates the customers row.
    // User stays "logged in" after signup unless confirmEmail is required.
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // AuthContext listener clears user/session automatically
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Access auth state from any component inside an AuthProvider.
 * Throws if used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
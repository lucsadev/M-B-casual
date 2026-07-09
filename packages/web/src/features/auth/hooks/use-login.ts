/**
 * useLogin — Login mutation hook.
 *
 * Wraps `supabase.auth.signInWithPassword()` in a TanStack Query mutation
 * with known error message handling for Supabase Auth errors.
 *
 * Used by LoginPage to provide loading/error state during form submission.
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/**
 * Map Supabase Auth API error messages to user-facing Spanish strings.
 */
function parseAuthError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado';

  const message =
    (error as any)?.message ||
    (error as any)?.error_description ||
    (error as any)?.msg ||
    (error instanceof Error ? error.message : '');

  if (message) {
    if (message.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos';
    }
    if (message.includes('Email not confirmed')) {
      return 'Debés confirmar tu email antes de iniciar sesión';
    }
    if (message.includes('User not found')) {
      return 'No existe una cuenta con este email';
    }
    if (message.includes('rate_limit')) {
      return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.';
    }
    return message;
  }

  return 'Error al iniciar sesión. Probá de nuevo más tarde.';
}

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

interface LoginInput {
  email: string;
  password: string;
}

/**
 * Returns a mutation that logs the user in via Supabase Auth.
 *
 * On success the AuthContext listener picks up the new session
 * automatically, so this mutation only handles error states.
 *
 * @example
 * const { mutate: login, isPending } = useLogin();
 * login({ email: 'test@example.com', password: 'secret' });
 */
export function useLogin() {
  return useMutation<void, Error, LoginInput>({
    mutationFn: async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    onError: (_err) => {
      // The caller (LoginPage) reads error.message from mutation state.
      // Error is already parsed by mutationFn throwing it.
    },
    // Don't retry on auth errors
    retry: false,
  });
}

export { parseAuthError };
export type { LoginInput };

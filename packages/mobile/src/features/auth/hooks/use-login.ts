/**
 * useLogin — Login mutation hook for mobile.
 *
 * Wraps `useAuth().login` with loading and error state management.
 * Mirrors the web hook in packages/web/src/features/auth/hooks/use-login.ts.
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface UseLoginReturn {
  /** Submit login with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** True while the login request is in flight */
  isPending: boolean;
  /** Error message to display, or null */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

export function useLogin(): UseLoginReturn {
  const { login: authLogin } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsPending(true);
      setError(null);

      try {
        await authLogin(email, password);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? parseAuthError(err.message)
            : 'Error desconocido. Intenta de nuevo.';
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [authLogin],
  );

  const clearError = useCallback(() => setError(null), []);

  return { login, isPending, error, clearError };
}

/**
 * Map Supabase Auth API error messages to user-friendly Spanish strings.
 */
function parseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirmá tu email antes de iniciar sesión.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Demasiados intentos. Esperá unos minutos.';
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout')
  ) {
    return 'Error de conexión. Intentá de nuevo.';
  }

  return message;
}
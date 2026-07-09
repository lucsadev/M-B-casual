/**
 * useRegister — Register mutation hook for mobile.
 *
 * Wraps `useAuth().register` with loading and error state management.
 * Mirrors the web hook in packages/web/src/features/auth/hooks/use-register.ts.
 */
import { useState, useCallback } from 'react';
import { useAuth, type RegisterInput } from '../context/AuthContext';

export interface UseRegisterReturn {
  /** Submit registration with full input data */
  register: (input: RegisterInput) => Promise<void>;
  /** True while the registration request is in flight */
  isPending: boolean;
  /** Error message to display, or null */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

export function useRegister(): UseRegisterReturn {
  const { register: authRegister } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsPending(true);
      setError(null);

      try {
        await authRegister(input);
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
    [authRegister],
  );

  const clearError = useCallback(() => setError(null), []);

  return { register, isPending, error, clearError };
}

/**
 * Map Supabase Auth API error messages to user-friendly Spanish strings.
 */
function parseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('already registered') || lower.includes('user_already_exists') || lower.includes('duplicate')) {
    return 'Este email ya está registrado.';
  }
  if (lower.includes('weak password') || lower.includes('password')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
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
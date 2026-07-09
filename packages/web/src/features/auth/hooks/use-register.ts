/**
 * useRegister — Registration mutation hook.
 *
 * Wraps `supabase.auth.signUp()` in a TanStack Query mutation.
 * Passes user metadata (nombre, apellido, telefono) so the
 * handle_new_user DB trigger can create the customers row.
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function parseRegisterError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado';

  // Try extracting a message from various error shapes
  const message =
    (error as any)?.message ||
    (error as any)?.error_description ||
    (error as any)?.msg ||
    '';

  if (message) {
    if (message.includes('already registered') || message.includes('already exists')) {
      return 'Este email ya está registrado';
    }
    if (message.includes('rate_limit')) {
      return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.';
    }
    if (message.includes('password')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return message;
  }

  // If no useful message extracted, check if it's an Error instance
  if (error instanceof Error) {
    return error.message;
  }

  return 'Error al crear la cuenta. Probá de nuevo más tarde.';
}

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

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

/**
 * Returns a mutation that creates a new auth user via Supabase.
 *
 * On success the handle_new_user DB trigger inserts a matching
 * customers row with the provided metadata.
 *
 * @example
 * const { mutate: signUp, isPending } = useRegister();
 * signUp({ email, password, nombre, apellido: 'García' });
 */
export function useRegister() {
  return useMutation<void, Error, RegisterInput>({
    mutationFn: async (input) => {
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
    },
    retry: false,
  });
}

export { parseRegisterError };

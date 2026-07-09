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
  const message =
    error instanceof Error ? error.message : 'Ocurrió un error inesperado';

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

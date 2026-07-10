import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const GOOGLE_PROFILE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/user.addresses.read',
].join(' ');

function sanitizeRedirectPath(path?: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/perfil';
  }

  return path;
}

export function buildGoogleOAuthRedirectUrl(redirectPath?: string | null): string {
  const url = new URL('/login', window.location.origin);
  url.searchParams.set('redirectTo', sanitizeRedirectPath(redirectPath));
  return url.toString();
}

export function parseOAuthError(error: unknown): string {
  const message =
    (error as any)?.message ||
    (error as any)?.error_description ||
    (error as any)?.msg ||
    (error instanceof Error ? error.message : '');

  if (message) {
    if (message.includes('provider is not enabled')) {
      return 'El inicio con Google no está habilitado en Supabase.';
    }
    if (message.includes('rate_limit')) {
      return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.';
    }
    return message;
  }

  return 'No se pudo iniciar sesión con Google. Probá de nuevo más tarde.';
}

export function useGoogleAuth() {
  return useMutation<void, Error, { redirectPath?: string | null }>({
    mutationFn: async ({ redirectPath }) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildGoogleOAuthRedirectUrl(redirectPath),
          scopes: GOOGLE_PROFILE_SCOPES,
        },
      });

      if (error) throw error;
    },
    retry: false,
  });
}

export { sanitizeRedirectPath };

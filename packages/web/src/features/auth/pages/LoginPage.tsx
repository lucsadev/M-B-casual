/**
 * LoginPage — Login form at /login.
 *
 * Fields: email + password
 * Validation: Zod via react-hook-form
 * On success: redirects to the page the user came from, or /perfil
 * On error: displays specific Supabase error messages
 *
 * Spec scenarios:
 * - Successful login redirects to previous page
 * - Invalid credentials show inline error
 * - Invalid email format blocked by Zod
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { useLogin, parseAuthError } from '../hooks/use-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending, error: mutationError } = useLogin();

  const [serverError, setServerError] = useState<string | null>(null);

  // Parse mutation error into user-facing message
  useEffect(() => {
    if (mutationError) {
      setServerError(parseAuthError(mutationError));
    } else {
      setServerError(null);
    }
  }, [mutationError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    login(data, {
      onSuccess: (user: User) => {
        // Admin users go straight to the dashboard
        if (user?.app_metadata?.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }
        // Regular users: redirect back where they came from, or /perfil
        const from = (location.state as { from?: { pathname: string } })?.from
          ?.pathname;
        navigate(from || '/perfil', { replace: true });
      },
    });
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-12">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Ingresá tu email y contraseña para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[#1A1A1A]"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              {...register('email')}
              className={errors.email ? 'border-red-400' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[#1A1A1A]"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-red-400' : ''}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#E8836B] text-white hover:bg-[#E8836B]/90 disabled:opacity-50"
            size="lg"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Ingresando...
              </span>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-[#1A1A1A]/60">
          ¿No tenés cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-[#E8836B] hover:text-[#E8836B]/80"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </section>
  );
}

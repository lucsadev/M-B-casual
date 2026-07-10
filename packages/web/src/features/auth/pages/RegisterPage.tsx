/**
 * RegisterPage — Registration form at /register.
 *
 * Fields: nombre, apellido, email, teléfono, password, confirmar password
 * Validation: Zod via react-hook-form (passwords must match)
 * On success: shows success message and redirects to /login
 * On error: displays specific Supabase error messages (duplicate email, etc.)
 *
 * Spec scenarios:
 * - Successful registration creates account and redirects to /login
 * - Duplicate email shows specific error
 * - Short password blocked by Zod
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister, parseRegisterError } from '../hooks/use-register';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre es muy largo'),
    apellido: z.string().max(100, 'El apellido es muy largo').optional(),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Email inválido'),
    telefono: z
      .string()
      .regex(
        /^(\+54)?\d{7,15}$/,
        'Teléfono inválido (ej: +541112345678)',
      )
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmarPassword: z
      .string()
      .min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: signUp, isPending, error: mutationError } = useRegister();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse mutation error into user-facing message
  useEffect(() => {
    if (mutationError) {
      setServerError(parseRegisterError(mutationError));
    } else {
      setServerError(null);
    }
  }, [mutationError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
      confirmarPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    setSuccessMessage(null);

    signUp(
      {
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido || undefined,
        telefono: data.telefono || undefined,
      },
      {
        onSuccess: () => {
          setSuccessMessage(
            '¡Cuenta creada con éxito! Ahora podés iniciar sesión.',
          );
          // Redirect to login after a brief delay so the user sees the message
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        },
      },
    );
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-12">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Crear cuenta</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Completá tus datos para registrarte
          </p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre + Apellido row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="nombre"
                className="mb-1 block text-sm font-medium text-[#1A1A1A]"
              >
                Nombre
              </label>
              <Input
                id="nombre"
                type="text"
                autoComplete="given-name"
                placeholder="Juan"
                {...register('nombre')}
                className={errors.nombre ? 'border-red-400' : ''}
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.nombre.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="apellido"
                className="mb-1 block text-sm font-medium text-[#1A1A1A]"
              >
                Apellido
              </label>
              <Input
                id="apellido"
                type="text"
                autoComplete="family-name"
                placeholder="Pérez"
                {...register('apellido')}
                className={errors.apellido ? 'border-red-400' : ''}
              />
              {errors.apellido && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.apellido.message}
                </p>
              )}
            </div>
          </div>

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

          {/* Teléfono */}
          <div>
            <label
              htmlFor="telefono"
              className="mb-1 block text-sm font-medium text-[#1A1A1A]"
            >
              Teléfono <span className="text-[#1A1A1A]/40">(opcional)</span>
            </label>
            <Input
              id="telefono"
              type="tel"
              autoComplete="tel"
              placeholder="+54 11 1234 5678"
              {...register('telefono')}
              className={errors.telefono ? 'border-red-400' : ''}
            />
            {errors.telefono && (
              <p className="mt-1 text-xs text-red-500">
                {errors.telefono.message}
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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              {...register('password')}
              className={errors.password ? 'border-red-400' : ''}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirmar password */}
          <div>
            <label
              htmlFor="confirmarPassword"
              className="mb-1 block text-sm font-medium text-[#1A1A1A]"
            >
              Confirmar contraseña
            </label>
            <Input
              id="confirmarPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              {...register('confirmarPassword')}
              className={errors.confirmarPassword ? 'border-red-400' : ''}
            />
            {errors.confirmarPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmarPassword.message}
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
                Creando cuenta...
              </span>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E2E2DC]" />
          <span className="text-xs uppercase text-[#1A1A1A]/40">o</span>
          <div className="h-px flex-1 bg-[#E2E2DC]" />
        </div>

        <GoogleAuthButton
          redirectPath="/perfil"
          label="Crear cuenta con Google"
          loadingLabel="Redirigiendo a Google..."
          onError={setServerError}
        />

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[#1A1A1A]/60">
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-[#E8836B] hover:text-[#E8836B]/80"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </section>
  );
}

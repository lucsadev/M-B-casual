/**
 * ProfilePage — /perfil route.
 *
 * Displays customer profile fields (first_name, last_name, email readonly, phone)
 * with an inline edit form using react-hook-form + Zod validation.
 * Shows "Mis órdenes" section with status badges and links to order detail.
 *
 * Spec:
 * - GIVEN authenticated user WHEN viewing /perfil THEN personal data is shown
 * - GIVEN editing fields WHEN saving THEN mutation updates customers row + toast
 * - GIVEN empty required field WHEN saving THEN Zod blocks submission
 * - GIVEN orders WHEN viewing THEN table with colored status badges
 * - GIVEN no orders WHEN viewing THEN empty state with CTA
 * - GIVEN clicking "Cerrar sesión" THEN session cleared + redirect home
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { profileUpdateSchema } from '@mbt/shared';
import type { ProfileUpdateInput } from '@mbt/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useProfile, useUpdateProfile } from '../hooks/use-profile';
import { useOrders } from '../hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }
> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  processing: { label: 'En proceso', variant: 'default' },
  shipped: { label: 'Enviada', variant: 'outline' },
  delivered: { label: 'Entregada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

function getStatusBadge(status: string) {
  return statusConfig[status] ?? { label: status, variant: 'outline' as const };
}

// ---------------------------------------------------------------------------
// Price formatter
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useProfile();
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();

  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // -----------------------------------------------------------------------
  // Form
  // -----------------------------------------------------------------------

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? null,
    },
  });

  const onSubmit = (data: ProfileUpdateInput) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success('Datos actualizados');
        setEditing(false);
      },
      onError: (err) => {
        toast.error(err.message ?? 'Error al actualizar el perfil');
      },
    });
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Sesión cerrada');
      navigate('/', { replace: true });
    } catch {
      toast.error('Error al cerrar sesión');
    } finally {
      setLoggingOut(false);
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (profileLoading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="mb-8 space-y-4 rounded-lg border border-[#E2E2DC] bg-[#FFFFFF] p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------

  if (profileError || !profile) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#1A1A1A]">
          Mi Perfil
        </h1>
        <p className="mb-6 text-[#1A1A1A]/60">
          No se pudo cargar tu perfil. Intentalo de nuevo más tarde.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-[#E8836B] text-white hover:bg-[#E8836B]/90"
        >
          Reintentar
        </Button>
      </section>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      {/* Title */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mi Perfil</h1>
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Profile data section */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-10 rounded-lg border border-[#E2E2DC] bg-[#FFFFFF] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Mis datos</h2>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              size="sm"
              className="border-[#E8836B] text-[#E8836B] hover:bg-[#E8836B]/10"
            >
              Editar
            </Button>
          )}
        </div>

        {editing ? (
          /* ── Edit mode ── */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Nombre
              </label>
              <Input
                {...register('firstName')}
                className={errors.firstName ? 'border-red-400' : ''}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Apellido
              </label>
              <Input
                {...register('lastName')}
                className={errors.lastName ? 'border-red-400' : ''}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Email — read-only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Email
              </label>
              <Input
                value={profile.email}
                readOnly
                className="bg-gray-50 text-[#1A1A1A]/60"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Teléfono
              </label>
              <Input
                {...register('phone')}
                placeholder="+54 11 1234 5678"
                className={errors.phone ? 'border-red-400' : ''}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={updating}
                className="bg-[#E8836B] text-white hover:bg-[#E8836B]/90 disabled:opacity-50"
              >
                {updating ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={updating}
                className="disabled:opacity-50"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          /* ── View mode ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                  Nombre
                </p>
                <p className="mt-1 text-[#1A1A1A]">
                  {profile.firstName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                  Apellido
                </p>
                <p className="mt-1 text-[#1A1A1A]">
                  {profile.lastName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                  Email
                </p>
                <p className="mt-1 text-[#1A1A1A]">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                  Teléfono
                </p>
                <p className="mt-1 text-[#1A1A1A]">
                  {profile.phone ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Orders section */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-lg border border-[#E2E2DC] bg-[#FFFFFF] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
          Mis órdenes
        </h2>

        {ordersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : orders.length === 0 ? (
          /* ── Empty state ── */
          <div className="py-8 text-center">
            <p className="mb-4 text-[#1A1A1A]/60">
              Todavía no tenés órdenes
            </p>
            <Link
              to="/catalogo"
              className="inline-block rounded-md bg-[#E8836B] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          /* ── Orders table ── */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° de orden</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = getStatusBadge(order.status);
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-[#E2E2DC]/30"
                    onClick={() => navigate(`/orden/${order.id}`)}
                  >
                    <TableCell className="font-medium">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-[#1A1A1A]/60">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

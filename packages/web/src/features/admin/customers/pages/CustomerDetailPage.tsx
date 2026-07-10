/**
 * Customer Detail Page (Admin)
 *
 * Route: /admin/clientes/:id
 * Shows full customer profile, order history, and inline editing.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useAdminCustomer,
  useCheckAdminRole,
  useUpdateCustomer,
  useToggleAdminRole,
} from '@/features/admin/customers/api/use-customer-queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  processing: 'En proceso',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatAddress(address: Record<string, unknown> | null): string {
  if (!address) return '—';

  const formatted = address.formatted ?? address.formattedValue ?? address.streetAddress;
  if (typeof formatted === 'string' && formatted.trim()) {
    return formatted;
  }

  const parts = [
    address.street,
    address.route,
    address.locality,
    address.city,
    address.region,
    address.country,
    address.postalCode,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : '—';
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useAdminCustomer(id ?? '');
  const updateCustomer = useUpdateCustomer();
  const toggleAdmin = useToggleAdminRole();
  const { data: isAdmin } = useCheckAdminRole(customer?.user_id ?? '');

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  function startEdit() {
    if (!customer) return;
    setFirstName(customer.first_name);
    setLastName(customer.last_name);
    setPhone(customer.phone ?? '');
    setEditing(true);
  }

  function handleSave() {
    if (!customer) return;
    updateCustomer.mutate(
      { id: customer.id, first_name: firstName, last_name: lastName, phone },
      { onSuccess: () => setEditing(false) },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-[#1A1A1A]/60">Cliente no encontrado</p>
        <Link to="/admin/clientes" className="mt-2 inline-block text-sm text-[#E8836B] hover:underline">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/clientes" className="text-sm text-[#E8836B] hover:underline">
            ← Volver a clientes
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#1A1A1A]">
            {customer.first_name} {customer.last_name}
          </h1>
        </div>
        {!editing && (
          <Button variant="outline" onClick={startEdit}>
            Editar perfil
          </Button>
        )}
      </div>

      {/* Profile + Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos personales */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Datos personales</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[#1A1A1A]/60">Nombre</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1A1A1A]/60">Apellido</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1A1A1A]/60">Teléfono</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Nombre</span>
                <span className="text-sm font-medium">{customer.first_name} {customer.last_name}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Teléfono</span>
                <span className="text-sm font-medium">{customer.phone ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Domicilio</span>
                <span className="max-w-sm text-right text-sm font-medium">
                  {formatAddress(customer.address)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Cliente desde</span>
                <span className="text-sm font-medium">
                  {new Date(customer.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm text-[#1A1A1A]/60">Rol</span>
                <div className="flex items-center gap-3">
                  <Badge variant={isAdmin ? 'success' : 'secondary'}>
                    {isAdmin ? 'Administrador' : 'Usuario'}
                  </Badge>
                  <Select
                    value={isAdmin ? 'admin' : 'user'}
                    onValueChange={(value) =>
                      toggleAdmin.mutate({
                        userId: customer.user_id,
                        makeAdmin: value === 'admin',
                      })
                    }
                    disabled={toggleAdmin.isPending}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Estadísticas</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
              <span className="text-sm text-[#1A1A1A]/60">Órdenes totales</span>
              <span className="text-lg font-bold">{customer.orders.length}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E2DC] pb-2">
              <span className="text-sm text-[#1A1A1A]/60">Total gastado</span>
              <span className="text-lg font-bold text-emerald-600">{formatPrice(totalSpent)}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-[#1A1A1A]/60">Ticket promedio</span>
              <span className="text-lg font-bold">
                {customer.orders.length > 0
                  ? formatPrice(totalSpent / customer.orders.length)
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de órdenes */}
      <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Historial de órdenes</h2>
        {customer.orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#1A1A1A]/40">
            Este cliente aún no realizó ninguna compra.
          </p>
        ) : (
          <div className="divide-y divide-[#E2E2DC]">
            {customer.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[#1A1A1A]/40">
                    #{order.id.slice(0, 8)}
                  </span>
                  <Badge variant={STATUS_BADGE[order.status] ?? 'secondary'}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                  <span className="text-sm text-[#1A1A1A]/60">
                    {new Date(order.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                  <Link
                    to={`/admin/ordenes/${order.id}`}
                    className="text-sm text-[#E8836B] hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

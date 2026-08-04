/**
 * SupplierFormFields — shared field set for create/edit supplier dialogs.
 *
 * Plain controlled inputs (no react-hook-form) matching the category dialogs'
 * useState approach. Keeps the six supplier fields consistent between the
 * create and edit dialogs.
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupplierFormValues {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

interface SupplierFormFieldsProps {
  values: SupplierFormValues;
  onChange: (patch: Partial<SupplierFormValues>) => void;
  error: string | null;
  onClearError: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SupplierFormFields({
  values,
  onChange,
  error,
  onClearError,
}: SupplierFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="supplier-name">Nombre</Label>
        <Input
          id="supplier-name"
          value={values.name}
          onChange={(e) => {
            onChange({ name: e.target.value });
            if (error) onClearError();
          }}
          placeholder="Textil Ríos"
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="supplier-contact-name">Persona de contacto</Label>
        <Input
          id="supplier-contact-name"
          value={values.contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          placeholder="Nombre y apellido"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="supplier-email">Email</Label>
          <Input
            id="supplier-email"
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="ventas@textilrios.com"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="supplier-phone">Teléfono</Label>
          <Input
            id="supplier-phone"
            type="tel"
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="11 5555 1234"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="supplier-address">Dirección</Label>
        <Input
          id="supplier-address"
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Av. Corrientes 1234, CABA"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="supplier-is-active"
          checked={values.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
          className="h-4 w-4 rounded border-[#E2E2DC] accent-[#1A1A1A]"
        />
        <Label htmlFor="supplier-is-active">
          Proveedor activo (disponible para asociar a productos)
        </Label>
      </div>
    </div>
  );
}

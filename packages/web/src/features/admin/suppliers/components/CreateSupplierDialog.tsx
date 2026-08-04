/**
 * CreateSupplierDialog — modal form for creating a new supplier.
 *
 * Uses plain useState + supplierFormSchema (Zod) for validation and
 * useCreateSupplier for the Supabase insert.
 */
import { useState } from 'react';
import { supplierFormSchema } from '@mbt/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateSupplier } from '../api/use-supplier-mutations';
import { SupplierFormFields } from './SupplierFormFields';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateSupplierDialog({
  open,
  onOpenChange,
}: CreateSupplierDialogProps) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createSupplier = useCreateSupplier();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = supplierFormSchema.safeParse({
      name,
      contactName: contactName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      isActive,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(
        issue?.path[0] === 'name'
          ? 'El nombre es obligatorio'
          : 'Revisá los datos ingresados',
      );
      return;
    }

    setError(null);

    try {
      await createSupplier.mutateAsync(parsed.data);
      // Reset fields and close on success — the mutation's toast fires
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setIsActive(true);
      onOpenChange(false);
    } catch {
      // Error handled by the mutation toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
          <DialogDescription>
            Creá un proveedor para asociar productos y registrar compras.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SupplierFormFields
            values={{ name, contactName, email, phone, address, isActive }}
            onChange={(patch) => {
              if (patch.name !== undefined) setName(patch.name);
              if (patch.contactName !== undefined) setContactName(patch.contactName);
              if (patch.email !== undefined) setEmail(patch.email);
              if (patch.phone !== undefined) setPhone(patch.phone);
              if (patch.address !== undefined) setAddress(patch.address);
              if (patch.isActive !== undefined) setIsActive(patch.isActive);
            }}
            error={error}
            onClearError={() => setError(null)}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'Creando...' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

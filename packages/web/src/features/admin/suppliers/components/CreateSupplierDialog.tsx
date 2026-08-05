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
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
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
      website: website || undefined,
      instagram: instagram || undefined,
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
      setWebsite('');
      setInstagram('');
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
            values={{ name, website, instagram, email, phone, address, isActive }}
            onChange={(patch) => {
              if (patch.name !== undefined) setName(patch.name);
              if (patch.website !== undefined) setWebsite(patch.website);
              if (patch.instagram !== undefined) setInstagram(patch.instagram);
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

/**
 * EditSupplierDialog — modal form for editing an existing supplier.
 *
 * Uses useUpdateSupplier for the Supabase update and expects initialSupplier
 * data. Shows the current values in form fields, allows editing.
 * Includes validation and error handling similar to CreateSupplierDialog.
 */
import { useState, useEffect } from 'react';
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
import { useUpdateSupplier } from '../api/use-supplier-mutations';
import { SupplierFormFields } from './SupplierFormFields';
import type { Supplier } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSupplier?: Supplier | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditSupplierDialog({
  open,
  onOpenChange,
  initialSupplier,
}: EditSupplierDialogProps) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateSupplier = useUpdateSupplier();

  // Update form values when initialSupplier changes
  useEffect(() => {
    if (initialSupplier) {
      setName(initialSupplier.name);
      setWebsite(initialSupplier.website || '');
      setInstagram(initialSupplier.instagram || '');
      setEmail(initialSupplier.email || '');
      setPhone(initialSupplier.phone || '');
      setAddress(initialSupplier.address || '');
      setIsActive(initialSupplier.isActive);
    } else {
      setName('');
      setWebsite('');
      setInstagram('');
      setEmail('');
      setPhone('');
      setAddress('');
      setIsActive(true);
    }
  }, [initialSupplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!initialSupplier) return;

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
      await updateSupplier.mutateAsync({
        id: initialSupplier.id,
        ...parsed.data,
      });
      // Close on success — the mutation's toast fires
      onOpenChange(false);
    } catch {
      // Error handled by the mutation toast
    }
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
          <DialogDescription>
            Editá los detalles del proveedor.
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
            <Button type="submit" disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

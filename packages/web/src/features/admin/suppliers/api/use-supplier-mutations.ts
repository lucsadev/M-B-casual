/**
 * Supplier mutations for the admin panel.
 *
 * Provides useCreateSupplier, useUpdateSupplier, and useDeleteSupplier using
 * TanStack Query. Each mutation:
 * - Interacts with Supabase directly
 * - Invalidates the supplier query cache on success
 * - Shows a toast notification on success/error
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SUPPLIERS_KEY } from './use-supplier-queries';

// ---------------------------------------------------------------------------
// Create supplier
// ---------------------------------------------------------------------------

interface CreateSupplierInput {
  name: string;
  website?: string;
  instagram?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

async function createSupplier({
  name,
  website,
  instagram,
  email,
  phone,
  address,
  isActive,
}: CreateSupplierInput) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      name,
      website: website ?? null,
      instagram: instagram ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      is_active: isActive ?? true,
    } as unknown as never)
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;

  return data;
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      toast.success('Proveedor creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear proveedor: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Update supplier
// ---------------------------------------------------------------------------

interface UpdateSupplierInput {
  id: string;
  name?: string;
  website?: string;
  instagram?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

async function updateSupplier({ id, ...input }: UpdateSupplierInput) {
  const updates: any = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.website !== undefined) updates.website = input.website ?? null;
  if (input.instagram !== undefined) updates.instagram = input.instagram ?? null;
  if (input.email !== undefined) updates.email = input.email ?? null;
  if (input.phone !== undefined) updates.phone = input.phone ?? null;
  if (input.address !== undefined) updates.address = input.address ?? null;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  if (Object.keys(updates).length === 0) {
    throw new Error('No hay cambios para actualizar');
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update(updates as never)
    .eq('id', id)
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;
  return data;
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      toast.success('Proveedor actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar proveedor: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete supplier
// ---------------------------------------------------------------------------

async function deleteSupplier(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      toast.success('Proveedor eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar proveedor: ${error.message}`);
    },
  });
}

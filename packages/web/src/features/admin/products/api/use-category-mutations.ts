/**
 * Category mutations for the admin panel.
 *
 * Provides useCreateCategory using TanStack Query. The mutation:
 * - Interacts with Supabase directly
 * - Invalidates the categories query cache on success
 * - Shows a toast notification on success/error
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CATEGORIES_KEY } from '@/features/catalog';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const ADMIN_CATEGORIES_KEY = ['admin', 'categories'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Create category
// ---------------------------------------------------------------------------

interface CreateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

async function createCategory({ name, description, imageUrl }: CreateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      slug: slugify(name),
      description: description ?? null,
      image_url: imageUrl ?? null,
      sort_order: 0,
    } as unknown as never)
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;

  return data;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      toast.success('Categoría creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear categoría: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Update category
// ---------------------------------------------------------------------------

interface UpdateCategoryInput {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

async function updateCategory({ id, ...input }: UpdateCategoryInput) {
  const updates: any = {};

  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = slugify(input.name);
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl ?? null;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  if (Object.keys(updates).length === 0) {
    throw new Error('No hay cambios para actualizar');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates as never)
    .eq('id', id)
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;
  return data;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      toast.success('Categoría actualizada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar categoría: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete category
// ---------------------------------------------------------------------------

async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      toast.success('Categoría eliminada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar categoría: ${error.message}`);
    },
  });
}

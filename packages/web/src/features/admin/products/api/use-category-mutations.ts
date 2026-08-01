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
      toast.success('Categoría creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear categoría: ${error.message}`);
    },
  });
}

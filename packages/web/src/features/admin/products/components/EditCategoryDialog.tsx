/**
 * EditCategoryDialog — modal form for editing an existing category.
 *
 * Uses useUpdateCategory for the Supabase update and expects initialCategory data.
 * Shows the current values in form fields, allows editing.
 * Includes validation and error handling similar to CreateCategoryDialog.
 */
import { useState, useEffect } from 'react';
import { categoryCreateSchema } from '@mbt/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCategory } from '../api/use-category-mutations';
import { ImageUploader } from './ImageUploader';
import type { Category } from '@mbt/shared';

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
// Props
// ---------------------------------------------------------------------------

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: Category | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditCategoryDialog({
  open,
  onOpenChange,
  initialCategory,
}: EditCategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateCategory = useUpdateCategory();

  const slug = slugify(name);

  // Update form values when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setDescription(initialCategory.description || '');
      setImageUrl(initialCategory.imageUrl || '');
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
    }
  }, [initialCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!initialCategory) return;

    const parsed = categoryCreateSchema.safeParse({
      name,
      description: description || undefined,
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
      await updateCategory.mutateAsync({
        id: initialCategory.id,
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: imageUrl || undefined,
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
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>
            Edita los detalles de la categoría.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Accesorios"
              autoFocus
            />
            {name && (
              <p className="text-xs text-[#1A1A1A]/50">slug: {slug || '—'}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="category-description">Descripción</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
              rows={3}
            />
          </div>

          <ImageUploader
            label="Imagen de la categoría"
            single
            value={imageUrl ? [imageUrl] : []}
            onChange={(urls) => setImageUrl(urls[0] ?? '')}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
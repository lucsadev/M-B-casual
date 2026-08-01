/**
 * CreateCategoryDialog — modal form for creating a new category.
 *
 * Uses plain useState + categoryCreateSchema (Zod) for validation and
 * useCreateCategory for the Supabase insert. Shows a live slug preview
 * as the name is typed, matching ProductForm's slugify behavior.
 * Supports an optional cover image via ImageUploader (single mode).
 */
import { useState } from 'react';
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
import { useCreateCategory } from '../api/use-category-mutations';
import { ImageUploader } from './ImageUploader';

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

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCreateCategory();

  const slug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      await createCategory.mutateAsync({
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: imageUrl || undefined,
      });
      // Reset fields and close on success — the mutation's toast fires
      setName('');
      setDescription('');
      setImageUrl('');
      onOpenChange(false);
    } catch {
      // Error handled by the mutation toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            Creá una categoría para agrupar productos en el catálogo.
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
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Creando...' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

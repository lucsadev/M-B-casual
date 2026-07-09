/**
 * ProductForm — React Hook Form + Zod for creating/editing products.
 *
 * Fields:
 * - name, slug (auto-generated from name), description
 * - price, compare_price, category (select), tags, images
 * - is_active toggle
 * - VariantManager for inline variant CRUD
 * - ImageUploader for Supabase Storage image upload
 */
import { useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCategories } from '@/features/catalog';
import { VariantManager } from './VariantManager';
import { ImageUploader } from './ImageUploader';
import type { Product, ProductVariant } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().min(1, 'El slug es obligatorio'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  comparePrice: z.coerce.number().min(0).optional().or(z.literal('')),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([]),
  variants: z.array(
    z.object({
      size: z.string().optional(),
      color: z.string().optional(),
      color_hex: z.string().optional(),
      stock: z.coerce.number().int().min(0).default(0),
      sku: z.string().optional(),
    }),
  ).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

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

interface ProductFormProps {
  /** Existing product data for edit mode, or null for create mode */
  product?: (Product & { variants: ProductVariant[] }) | null;
  /** Called with form values on submit */
  onSubmit: (values: ProductFormValues) => Promise<void>;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const defaultValues: ProductFormValues = {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    categoryId: product?.categoryId ?? '',
    price: product?.price ?? 0,
    comparePrice: product?.comparePrice ?? '',
    tags: product?.tags?.join(', ') ?? '',
    isActive: product?.isActive ?? true,
    images: product?.images ?? [],
    variants:
      product?.variants?.map((v) => ({
        size: v.size ?? '',
        color: v.color ?? '',
        color_hex: v.colorHex ?? '',
        stock: v.stock,
        sku: v.sku ?? '',
      })) ?? [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
  const name = watch('name');
  const slug = watch('slug');
  const images = watch('images');

  // Auto-generate slug from name (only if slug is empty or matches the auto-generated value)
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setValue('name', newName);

      const currentSlug = slug;
      const autoSlug = slugify(newName);
      if (!currentSlug || currentSlug === slugify(name || '')) {
        setValue('slug', autoSlug);
      }
    },
    [setValue, slug, name],
  );

  // Reset form when product data changes (edit mode)
  useEffect(() => {
    if (product) {
      reset(defaultValues);
    }
  }, [product?.id]);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic info */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">
            Información básica
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={handleNameChange}
                placeholder="Camisa Oversize Blanca"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="camisa-oversize-blanca"
              />
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripción del producto..."
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select
                id="categoryId"
                {...register('categoryId')}
                placeholder="Seleccionar categoría"
                options={
                  categories?.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })) ?? []
                }
              />
              {errors.categoryId && (
                <p className="text-xs text-red-500">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="nuevo, destacado, oferta"
              />
              <p className="text-xs text-[#1A1A1A]/50">
                Separados por coma
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Precios</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="price">Precio de venta ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                placeholder="15000"
              />
              {errors.price && (
                <p className="text-xs text-red-500">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="comparePrice">
                Precio de comparación ($)
              </Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                {...register('comparePrice')}
                placeholder="20000"
              />
              <p className="text-xs text-[#1A1A1A]/50">
                Precio anterior o de referencia (tachado)
              </p>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Imágenes</h3>
          <ImageUploader
            value={images}
            onChange={(urls) => setValue('images', urls)}
          />
        </section>

        {/* Variants */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Variantes</h3>
          <VariantManager />
        </section>

        {/* Status */}
        <section className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 rounded border-[#E2E2DC] accent-[#1A1A1A]"
          />
          <Label htmlFor="isActive">Producto activo (visible en catálogo)</Label>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 border-t border-[#E2E2DC] pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando...'
              : product
                ? 'Actualizar producto'
                : 'Crear producto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * ProductFormPage — Create/Edit product page.
 *
 * - /admin/productos/nuevo → create mode
 * - /admin/productos/:id/editar → edit mode (loads existing product)
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '@/features/catalog/api/queries';
import { useCreateProduct, useUpdateProduct } from '../api/use-product-mutations';
import { ProductForm, type ProductFormValues } from '../components/ProductForm';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const {
    data: product,
    isLoading: productLoading,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: isEdit,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  async function handleSubmit(values: ProductFormValues) {
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (isEdit && id) {
      await updateMutation.mutateAsync({
        id,
        product: {
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          category_id: values.categoryId,
          price: values.price,
          compare_price: values.comparePrice
            ? Number(values.comparePrice)
            : null,
          images: values.images,
          tags,
          is_active: values.isActive,
        },
        variants: values.variants.map((v) => ({
          size: v.size || null,
          color: v.color || null,
          color_hex: v.color_hex || null,
          stock: v.stock,
          sku: v.sku || null,
        })),
      });
    } else {
      await createMutation.mutateAsync({
        product: {
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          category_id: values.categoryId,
          price: values.price,
          compare_price: values.comparePrice
            ? Number(values.comparePrice)
            : null,
          images: values.images,
          tags,
          is_active: values.isActive,
        },
        variants: values.variants.map((v) => ({
          size: v.size || null,
          color: v.color || null,
          color_hex: v.color_hex || null,
          stock: v.stock,
          sku: v.sku || null,
        })),
      });
    }

    navigate('/admin/productos');
  }

  // Loading state for edit mode
  if (isEdit && productLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Product not found in edit mode
  if (isEdit && product === null) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-bold text-[#1A1A1A]">
          Producto no encontrado
        </h2>
        <p className="text-[#1A1A1A]/60">
          El producto que intentás editar no existe o fue eliminado.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          {isEdit
            ? 'Actualizá los datos del producto.'
            : 'Completá los datos para agregar un nuevo producto al catálogo.'}
        </p>
      </div>

      <div className="max-w-2xl">
        <ProductForm
          product={product ?? null}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}

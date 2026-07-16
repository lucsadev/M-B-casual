/**
 * ProductDetailPage — Full product detail with image gallery and variant selector.
 *
 * Route: /producto/:slug
 * Features:
 * - Image gallery (main image + thumbnail navigation)
 * - Product name, price, description
 * - Size and color variant selector (only variants with stock > 0)
 * - Stock indicator
 * - "Agregar al carrito" placeholder button
 * - Breadcrumbs: Inicio > Categoría > Producto
 * - SEO meta tags
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatPrice } from '@mbt/shared';
import { useProduct } from '../hooks/use-product';
import { useCategories } from '../hooks/use-categories';
import { useCartContext } from '@/features/cart/context/CartContext';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ProductQuestions } from '../components/product-questions';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug ?? '');
  const { data: categories } = useCategories();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Reset selection when product (slug) changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
  }, [slug]);

  // Pre-select a default in-stock variant so the user starts with a valid choice
  useEffect(() => {
    if (!product) return;
    if (selectedSize || selectedColor) return;
    const defaultVariant = product.variants.find((v) => v.stock > 0);
    if (defaultVariant) {
      setSelectedSize(defaultVariant.size ?? null);
      setSelectedColor(defaultVariant.color ?? null);
    }
  }, [product, selectedSize, selectedColor]);

  // SEO title — moved to <SEO /> component in the JSX below

  // Loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-4 h-4 w-64" />
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-7 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </section>
    );
  }

  // Not found / error
  if (isError || !product) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[#1A1A1A]">
          Producto no encontrado
        </h1>
        <p className="mb-6 text-[#1A1A1A]/60">
          El producto que buscás no existe o fue eliminado.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Ver catálogo
        </Link>
      </section>
    );
  }

  // Resolve category name for breadcrumb
  const category = categories?.find((c) => c.id === product.categoryId);
  const productImages = product.images.length > 0
    ? product.images
    : ['/placeholder-product.svg'];

  const { addToCart, isAddingToCart } = useCartContext();

  // Filter variants with stock
  const variantsInStock = product.variants.filter((v) => v.stock > 0);
  const sizes = (
    [...new Set(variantsInStock.map((v) => v.size).filter(Boolean))] as string[]
  ).sort((a, b) => {
    const order = ['S', 'M', 'L', 'XL', 'XXL', 'Único', 'unico'];
    return order.indexOf(a) - order.indexOf(b);
  });
  const colors = [...new Set(variantsInStock.map((v) => v.color).filter(Boolean))] as string[];
  const colorHexMap = new Map(
    variantsInStock
      .filter((v) => v.color && v.colorHex)
      .map((v) => [v.color!, v.colorHex!]),
  );

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Resolve variant_id from selected size+color (fall back to first in-stock variant)
  const selectedVariantId = (() => {
    if (!selectedSize && !selectedColor) {
      return product.variants.find((v) => v.stock > 0)?.id ?? null;
    }
    return product.variants.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    })?.id ?? null;
  })();

  // Resolve selected variant object (for discount computation)
  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : null;
  const variantDiscount = selectedVariant?.discount ?? 0;
  const effectivePrice =
    variantDiscount > 0
      ? Math.round(product.price * (1 - variantDiscount / 100) * 100) / 100
      : product.price;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {/* SEO: title, OG, JSON-LD */}
      <SEO
        title={`${product.name} — M & B Casual`}
        description={product.description?.slice(0, 160) ?? `${product.name} en M & B Casual`}
        image={productImages[0]}
        ogType="product"
        path={`/producto/${product.slug}`}
      />

      {/* JSON-LD structured data for Google / schema.org */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description?.slice(0, 500) ?? '',
            image: productImages,
            offers: {
              '@type': 'Offer',
              price: effectivePrice,
              priceCurrency: 'ARS',
              availability: totalStock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          })}
        </script>
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-[#1A1A1A]/50" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" className="hover:text-[#E8836B]">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/catalogo" className="hover:text-[#E8836B]">
              Catálogo
            </Link>
          </li>
          {category && (
            <>
              <li>/</li>
              <li>
                <Link
                  to={`/catalogo?category=${category.slug}`}
                  className="hover:text-[#E8836B]"
                >
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-[#1A1A1A]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#F0F0EC]">
            <OptimizedImage
              src={productImages[selectedImageIndex]}
              alt={product.name}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {productImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {productImages.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    'h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                    index === selectedImageIndex
                      ? 'border-[#E8836B]'
                      : 'border-transparent hover:border-[#E2E2DC]',
                  )}
                >
                  <OptimizedImage
                    src={url}
                    alt={`${product.name} - ${index + 1}`}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          {/* Name and price */}
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3">
              {variantDiscount > 0 && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#1A1A1A]/40">Antes</span>
                  <span className="text-sm text-[#1A1A1A]/40 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="destructive">-{variantDiscount}%</Badge>
                </div>
              )}
              <span className="text-3xl font-bold text-[#1A1A1A]">
                {formatPrice(effectivePrice)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.includes('nuevo') && (
                <Badge variant="default" className="bg-[#E8836B] text-white">
                  Nuevo
                </Badge>
              )}
              {product.tags.includes('oferta') && (
                <Badge variant="destructive">Oferta</Badge>
              )}
              {product.tags.includes('destacado') && (
                <Badge variant="secondary">Destacado</Badge>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Descripción
              </h2>
              <p className="text-sm leading-relaxed text-[#1A1A1A]/70 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Talle
              </h2>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'min-w-[3rem] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      selectedSize === size
                        ? 'border-[#E8836B] bg-[#E8836B] text-white'
                        : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Color
              </h2>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const hex = colorHexMap.get(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                        selectedColor === color
                          ? 'border-[#E8836B] bg-[#E8836B]/10 text-[#E8836B]'
                          : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]',
                      )}
                    >
                      {hex && (
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-[#E2E2DC]"
                          style={{ backgroundColor: hex }}
                        />
                      )}
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-2 text-sm">
            {totalStock > 0 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700">
                  {totalStock <= 5
                    ? `Solo quedan ${totalStock}`
                    : 'En stock'}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-red-500">Sin stock</span>
              </>
            )}
          </div>

          {/* Add to cart button */}
          <Button
            size="lg"
            disabled={totalStock === 0 || isAddingToCart}
            onClick={() =>
              addToCart({
                product_id: product.id,
                variant_id: selectedVariantId,
                quantity: 1,
              })
            }
            className="w-full bg-[#E8836B] text-white hover:bg-[#E8836B]/90 sm:w-auto disabled:opacity-50"
          >
            {isAddingToCart ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Agregando...
              </span>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                Agregar al carrito
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Product Q&A section */}
      <ProductQuestions productId={product.id} />
    </section>
  );
}

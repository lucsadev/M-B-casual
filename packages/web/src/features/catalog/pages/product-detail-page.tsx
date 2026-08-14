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
import {
  formatPrice,
  getAvailableSizes,
  getAvailableColors,
  getAllSizes,
  getAllColors,
  hasStockFor,
  getInStockVariants,
  resolveInStockVariantId,
  resolveDefaultSelection,
  resolveNextSizeOnColorChange,
  resolveNextSizeOnSizeTap,
  splitPackPrice,
} from '@mbt/shared';
import { useProduct } from '../hooks/use-product';
import { useCategories } from '../hooks/use-categories';
import { useImageDrag } from '../hooks/use-image-drag';
import type { ProductVariant } from '@mbt/shared';
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

  // Pack builder state: array of {size, color} per slot, length = packUnits
  const [packSlots, setPackSlots] = useState<Array<{ size: string | null; color: string | null }>>([]);

  // Reset selection when product (slug) changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setPackSlots([]);
  }, [slug]);

  // Pre-select a default in-stock variant so the user starts with a valid
  // choice. Shared with mobile via resolveDefaultSelection so both platforms
  // highlight the same default chips regardless of variant array order.
  useEffect(() => {
    if (!product) return;
    if (selectedSize || selectedColor) return;
    const { size, color } = resolveDefaultSelection(product.variants);
    if (size) {
      setSelectedSize(size);
      setSelectedColor(color);
    }
  }, [product, selectedSize, selectedColor]);

  // When the selected color changes, keep the current size when it is still in
  // stock in the new color, otherwise auto-select the first in-stock size of
  // that color. Delegates to the same pure resolver as mobile
  // (resolveNextSizeOnColorChange) so both platforms behave identically.
  // Self-terminating: a kept or auto-selected size is in the color's in-stock
  // set, so the effect returns on its next run.
  useEffect(() => {
    if (!product || !selectedColor) return;
    // Dead-color repair: a background refetch may zero ALL stock of the
    // currently selected color, leaving a highlighted chip for a color that no
    // longer renders. When that happens, re-resolve BOTH size and color via the
    // shared default selection so a chip stays highlighted whenever data
    // allows. Self-terminating: the re-resolved color is in-stock by
    // construction, so the includes-check passes on the next run.
    if (!getAvailableColors(product.variants).includes(selectedColor)) {
      const { size, color } = resolveDefaultSelection(product.variants);
      if (size) {
        setSelectedSize(size);
        setSelectedColor(color);
      }
      return;
    }
    const nextSize = resolveNextSizeOnColorChange(
      product.variants,
      selectedSize,
      selectedColor,
    );
    if (nextSize !== selectedSize) {
      setSelectedSize(nextSize);
    }
  }, [product, selectedColor, selectedSize]);

  // Swipe/drag the main image to flip between product photos. Moved BEFORE
  // every early return: hooks must run unconditionally on every render.
  const productImages =
    product?.images.length ? product.images : ['/placeholder-product.svg'];
  const {
    containerRef,
    dx,
    dragging,
    trackIndex,
    noTransition,
    handlers: swipeHandlers,
  } = useImageDrag({
    count: productImages.length,
    index: selectedImageIndex,
    onIndexChange: setSelectedImageIndex,
  });

  // useCartContext must be BEFORE early returns to satisfy React's Rules of Hooks.
  const { addToCart, isAddingToCart } = useCartContext();

  // Derived pack flag
  const isPack = product?.packUnits != null && product.packUnits >= 2;
  const packUnits = isPack ? (product?.packUnits as number) : 0;

  // Initialize pack slots when product loads as a pack
  useEffect(() => {
    if (isPack && packUnits > 0 && packSlots.length !== packUnits) {
      setPackSlots(Array.from({ length: packUnits }, () => ({ size: null, color: null })));
    }
  }, [isPack, packUnits]);

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

  // All sizes/colors present in the data (INCLUDING stock = 0 variants), scoped
  // to the selected color for sizes. 0-stock chips render disabled instead of
  // being hidden, so the user sees the full catalog of variants.
  const sizes = getAllSizes(product.variants, selectedColor);
  const colors = getAllColors(product.variants);

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Resolve variant_id from selected size+color (never a 0-stock variant)
  const selectedVariantId = resolveInStockVariantId(
    product.variants,
    selectedSize,
    selectedColor,
  );

  // Resolve selected variant object (for discount computation)
  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : null;
  const variantDiscount = selectedVariant?.discount ?? 0;
  const effectivePrice =
    variantDiscount > 0
      ? Math.round(product.price * (1 - variantDiscount / 100) * 100) / 100
      : product.price;

  // Pack builder: repeat-aware stock. `pickedCounts` maps each variant id to
  // how many pack slots currently demand it. A variant stays pickable in a
  // slot while the total demand across all slots does not exceed its stock
  // (repeats allowed while stock permits — design 5.2).
  const pickedCounts = isPack
    ? packSlots.reduce((counts, slot) => {
        if (!slot.size || !slot.color) return counts;
        const vid = resolveInStockVariantId(
          product.variants,
          slot.size,
          slot.color,
        );
        if (vid) counts.set(vid, (counts.get(vid) ?? 0) + 1);
        return counts;
      }, new Map<string, number>())
    : new Map<string, number>();

  // A slot is valid when it resolves to an in-stock variant and the total
  // demand (including this slot) stays within the variant's stock.
  const isPackSlotValid = (slot: {
    size: string | null;
    color: string | null;
  }): boolean => {
    if (!slot.size || !slot.color) return false;
    const vid = resolveInStockVariantId(
      product.variants,
      slot.size,
      slot.color,
    );
    if (!vid) return false;
    const variant = product.variants.find((v) => v.id === vid);
    if (!variant) return false;
    return variant.stock >= (pickedCounts.get(vid) ?? 0);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
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
      <nav className="mb-3 text-sm text-[#1A1A1A]/50 md:mb-4" aria-label="Breadcrumb">
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

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          <div
            ref={containerRef}
            {...swipeHandlers}
            className={cn(
              'relative aspect-[3/4] touch-pan-y select-none overflow-hidden rounded-lg bg-[#F0F0EC] md:aspect-auto md:h-[calc(100dvh-15rem)] md:min-h-[24rem]',
              productImages.length > 1 && (dragging ? 'cursor-grabbing' : 'cursor-grab'),
            )}
            aria-label="Imágenes del producto: mantené presionado y arrastrá para cambiar"
          >
            {/* Sliding track — cloned slides so the wrap animates forward:
                [clone(last), slide0..slideN-1, clone(first)]. The active logical
                slide is positioned at trackIndex = selectedImageIndex + 1.
                Rendered only when there is more than one image; a single image
                gets a plain static <OptimizedImage> instead. */}
            {productImages.length > 1 ? (
              <div
                className="flex h-full"
                style={{
                  transform: `translateX(calc(${-trackIndex * 100}% + ${dx}px))`,
                  transition:
                    dragging || noTransition ? 'none' : 'transform 300ms ease-out',
                }}
              >
                {[
                  productImages[productImages.length - 1],
                  ...productImages,
                  productImages[0],
                ].map((url, slideIndex) => {
                  // Map track position back to the logical index for alt/priority:
                  // 0 = clone of the last, count+1 = clone of the first.
                  const logicalIndex =
                    slideIndex === 0
                      ? productImages.length - 1
                      : slideIndex === productImages.length + 1
                        ? 0
                        : slideIndex - 1;
                  return (
                    <div key={`${url}-${slideIndex}`} className="h-full w-full flex-shrink-0">
                      <OptimizedImage
                        src={url}
                        alt={`${product.name} - ${logicalIndex + 1}`}
                        className="h-full w-full object-contain"
                        priority={logicalIndex === selectedImageIndex}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <OptimizedImage
                src={productImages[0]}
                alt={product.name}
                className="h-full w-full object-contain"
                priority
              />
            )}

            {totalStock === 0 && (
              <div className="absolute -right-12 top-6 z-10 rotate-45 bg-rose-600/50 text-center text-[10px] font-bold uppercase text-white py-1 px-6 w-36">
                Agotado
              </div>
            )}

            {/* Image counter */}
            {productImages.length > 1 && (
              <span className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                {selectedImageIndex + 1} / {productImages.length}
              </span>
            )}
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
              {isPack && (
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="default" className="bg-[#1A1A1A] text-white">
                    Pack x{packUnits}
                  </Badge>
                </div>
              )}
              {!isPack && variantDiscount > 0 && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#1A1A1A]/40">Antes</span>
                  <span className="text-sm text-[#1A1A1A]/40 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="destructive">-{variantDiscount}%</Badge>
                </div>
              )}
              <span className="text-3xl font-bold text-[#1A1A1A]">
                {formatPrice(isPack ? product.price : effectivePrice)}
              </span>
              {isPack && (
                <p className="mt-1 text-xs text-[#1A1A1A]/50">
                  Precio total del pack
                </p>
              )}
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

          {/* Variant selector — pack builder or single selector */}
          {isPack ? (
            /* ---- Pack builder: N slot pickers (repeats allowed while stock permits) ---- */
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Elegí las variantes del pack
              </h2>
              {packSlots.map((slot, slotIdx) => {
                const slotSizes = getAvailableSizes(product.variants, slot.color);
                const slotColors = getAvailableColors(product.variants);
                const slotVariantId =
                  slot.size && slot.color
                    ? resolveInStockVariantId(product.variants, slot.size, slot.color)
                    : null;
                const slotVariant = slotVariantId
                  ? product.variants.find((v) => v.id === slotVariantId)
                  : null;
                const slotValid =
                  slotVariant != null &&
                  slotVariant.stock >= (pickedCounts.get(slotVariant.id) ?? 0);
                const slotUnitPrice = slotVariantId
                  ? splitPackPrice({
                      total: product.price,
                      packUnits,
                      rowIndex: slotIdx + 1,
                      rowCount: packUnits,
                    }).unitPrice
                  : null;
                // A size/color chip is exhausted when EVERY in-stock variant
                // it resolves to is already fully committed by other slots.
                const isChipExhausted = (candidates: ProductVariant[]): boolean =>
                  candidates.every((v) => {
                    const pickedElsewhere =
                      (pickedCounts.get(v.id) ?? 0) -
                      (slotVariantId === v.id ? 1 : 0);
                    return v.stock - pickedElsewhere <= 0;
                  });

                return (
                  <div
                    key={slotIdx}
                    data-testid={`pack-slot-${slotIdx + 1}`}
                    className="rounded-md border border-[#E2E2DC] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1A1A1A]/60 uppercase">
                        Unidad {slotIdx + 1} / {packUnits}
                      </span>
                      {slotUnitPrice != null && (
                        <span className="text-xs font-medium text-[#E8836B]">
                          {formatPrice(slotUnitPrice)}
                        </span>
                      )}
                    </div>
                    {/* Size chips */}
                    {slotSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {slotSizes.map((size) => {
                          const candidates = getInStockVariants(
                            product.variants,
                          ).filter(
                            (v) =>
                              v.size === size &&
                              (!slot.color || v.color === slot.color),
                          );
                          const exhausted = isChipExhausted(candidates);
                          return (
                            <button
                              key={size}
                              type="button"
                              disabled={exhausted}
                              onClick={() => {
                                const newSlots = [...packSlots];
                                const newColor = newSlots[slotIdx].color;
                                newSlots[slotIdx] = { size, color: newColor };
                                // Auto-select color if none picked and size is
                                // available in exactly one in-stock color
                                if (!newColor) {
                                  const inStock = getInStockVariants(
                                    product.variants,
                                  ).filter((v) => v.size === size);
                                  if (inStock.length === 1) {
                                    newSlots[slotIdx].color = inStock[0].color ?? null;
                                  }
                                }
                                setPackSlots(newSlots);
                              }}
                              className={cn(
                                'min-w-[2.5rem] rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                                slot.size === size
                                  ? 'border-[#E8836B] bg-[#E8836B] text-white'
                                  : exhausted
                                    ? 'cursor-not-allowed border-[#E2E2DC] bg-[#F0F0EC] text-[#1A1A1A]/30'
                                    : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]',
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Color chips */}
                    {slotColors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {slotColors.map((color) => {
                          const candidates = getInStockVariants(
                            product.variants,
                          ).filter(
                            (v) =>
                              v.color === color &&
                              (!slot.size || v.size === slot.size),
                          );
                          const exhausted = isChipExhausted(candidates);
                          return (
                            <button
                              key={color}
                              type="button"
                              disabled={exhausted}
                              onClick={() => {
                                const newSlots = [...packSlots];
                                const newSize = newSlots[slotIdx].size;
                                newSlots[slotIdx] = { size: newSize, color };
                                // Auto-select size if none picked and color has
                                // exactly one in-stock size
                                if (!newSize) {
                                  const inStock = getInStockVariants(
                                    product.variants,
                                  ).filter((v) => v.color === color);
                                  if (inStock.length === 1) {
                                    newSlots[slotIdx].size = inStock[0].size ?? null;
                                  }
                                }
                                setPackSlots(newSlots);
                              }}
                              className={cn(
                                'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                                slot.color === color
                                  ? 'border-[#E8836B] bg-[#E8836B]/10 text-[#E8836B]'
                                  : exhausted
                                    ? 'cursor-not-allowed border-[#E2E2DC] bg-[#F0F0EC] text-[#1A1A1A]/30'
                                    : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]',
                              )}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Insufficient stock state for this slot */}
                    {slot.size && slot.color && !slotValid && (
                      <p className="text-xs font-medium text-red-500">
                        Sin stock para esta variante
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ---- Single product selector ---- */
            <>
              {/* Size selector */}
              {sizes.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                    Talle
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      // A size chip is enabled when an in-stock variant exists
                      // for that size in the selected color (0-stock disabled).
                      const inStock = hasStockFor(
                        product.variants,
                        size,
                        selectedColor,
                      );
                      const selected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!inStock}
                          onClick={() => {
                            const next = resolveNextSizeOnSizeTap(
                              product.variants,
                              selectedSize,
                              size,
                              selectedColor,
                            );
                            if (next !== null) setSelectedSize(next);
                          }}
                          className={cn(
                            'min-w-[3rem] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                            selected
                              ? 'border-[#E8836B] bg-[#E8836B] text-white'
                              : inStock
                                ? 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]'
                                : 'cursor-not-allowed border-[#E2E2DC] bg-[#F0F0EC] text-[#1A1A1A]/30',
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
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
                      // A color chip is enabled when any in-stock variant exists
                      // in that color (0-stock colors render disabled).
                      const inStock = hasStockFor(
                        product.variants,
                        null,
                        color,
                      );
                      const selected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={!inStock}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                            selected
                              ? 'border-[#E8836B] bg-[#E8836B]/10 text-[#E8836B]'
                              : inStock
                                ? 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B]'
                                : 'cursor-not-allowed border-[#E2E2DC] bg-[#F0F0EC] text-[#1A1A1A]/30',
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
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
            disabled={
              isPack
                ? totalStock === 0 ||
                  isAddingToCart ||
                  packSlots.length !== packUnits ||
                  packSlots.some((s) => !isPackSlotValid(s))
                : totalStock === 0 || isAddingToCart || !selectedVariantId
            }
            onClick={() => {
              if (isPack) {
                // Collapse pack slots → Map<variantId, qty>, then add each entry
                const variantQtyMap = new Map<string, number>();
                for (const slot of packSlots) {
                  if (!slot.size || !slot.color) return;
                  const vid = resolveInStockVariantId(product.variants, slot.size, slot.color);
                  if (!vid) return;
                  variantQtyMap.set(vid, (variantQtyMap.get(vid) ?? 0) + 1);
                }
                // Add each distinct variant as a separate cart row (upsert accumulates qty)
                for (const [variantId, qty] of variantQtyMap) {
                  addToCart({
                    product_id: product.id,
                    variant_id: variantId,
                    quantity: qty,
                  });
                }
              } else {
                if (!selectedVariantId) return;
                addToCart({
                  product_id: product.id,
                  variant_id: selectedVariantId,
                  quantity: 1,
                });
              }
            }}
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

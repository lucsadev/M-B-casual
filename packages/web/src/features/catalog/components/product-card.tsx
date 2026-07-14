/**
 * ProductCard — Catalog product card with image, name, price, and badges.
 *
 * Features:
 * - Thumbnail image (first image or placeholder)
 * - Product name, price, compare price (for discounts)
 * - Tags displayed as badges: "Nuevo", "Oferta"
 * - Hover effect: subtle lift + shadow + image zoom
 * - Links to /producto/:slug
 * - Modern design with rounded corners, shadows, and smooth transitions
 */
import { Link } from 'react-router-dom';
import type { Product } from '@mbt/shared';
import { formatPrice } from '@mbt/shared';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Variant-level discount (from discounted_products view)
  const hasVariantDiscount =
    product.variantDiscountPercent !== undefined &&
    product.variantDiscountPercent > 0 &&
    product.effectivePrice !== undefined;

  // Product-level discount (comparePrice)
  const hasCompareDiscount =
    !hasVariantDiscount &&
    product.comparePrice !== undefined &&
    product.comparePrice > product.price;

  const displayPrice = hasVariantDiscount
    ? product.effectivePrice!
    : product.price;

  const comparePrice = hasVariantDiscount
    ? product.price
    : hasCompareDiscount
      ? product.comparePrice!
      : null;

  const badgePercent = hasVariantDiscount
    ? product.variantDiscountPercent!
    : hasCompareDiscount
      ? Math.round(
          ((product.comparePrice! - product.price) / product.comparePrice!) *
            100,
        )
      : 0;

  const thumbnailUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/placeholder-product.svg';

  return (
    <Link
      to={`/producto/${product.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300',
        'border border-[#E2E2DC]/50 shadow-sm hover:-translate-y-1 hover:shadow-xl',
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#F9F9F7] to-[#F0F0EC]">
        <OptimizedImage
          src={thumbnailUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Tags overlay */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.tags.includes('nuevo') && (
            <Badge
              variant="default"
              className="bg-gradient-to-r from-[#E8836B] to-[#E8836B]/90 text-white shadow-md"
            >
              Nuevo
            </Badge>
          )}
          {product.tags.includes('destacado') && (
            <Badge
              variant="secondary"
              className="bg-white/90 text-[#1A1A1A] backdrop-blur-sm shadow-sm"
            >
              Destacado
            </Badge>
          )}
          {badgePercent > 0 && (
            <Badge
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
            >
              -{badgePercent}%
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 transition-colors group-hover:text-[#E8836B]">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#1A1A1A]">
            {formatPrice(displayPrice)}
          </span>
          {comparePrice !== null && (
            <span className="text-xs font-medium text-[#1A1A1A]/50 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

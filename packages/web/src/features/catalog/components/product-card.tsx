/**
 * ProductCard — Catalog product card with image, name, price, and badges.
 *
 * Features:
 * - Thumbnail image (first image or placeholder)
 * - Product name, price, compare price (for discounts)
 * - Tags displayed as badges: "Nuevo", "Oferta"
 * - Hover effect: subtle lift + shadow
 * - Links to /producto/:slug
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
        'group flex flex-col overflow-hidden rounded-lg border border-[#E2E2DC] bg-white transition-all',
        'hover:-translate-y-0.5 hover:shadow-lg',
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F0F0EC]">
        <OptimizedImage
          src={thumbnailUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />

        {/* Tags overlay */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.tags.includes('nuevo') && (
            <Badge variant="default" className="bg-[#E8836B] text-white">
              Nuevo
            </Badge>
          )}
          {product.tags.includes('destacado') && (
            <Badge variant="secondary">Destacado</Badge>
          )}
          {badgePercent > 0 && (
            <Badge variant="destructive">-{badgePercent}%</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-[#1A1A1A]">
            {formatPrice(displayPrice)}
          </span>
          {comparePrice !== null && (
            <span className="text-xs text-[#1A1A1A]/50 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

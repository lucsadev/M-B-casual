/**
 * ProductCard — Catalog product card with image, name, price, and badges.
 *
 * Features:
 * - Thumbnail image (first image or placeholder)
 * - Product name, price, compare price (for discounts)
 * - Tags displayed as badges: "Nuevo", "Oferta"
 * - Hover effect: neon glow + lift + image zoom
 * - Links to /producto/:slug
 * - Cyberpunk dark mode design with glassmorphism and neon effects
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
        'group flex flex-col overflow-hidden rounded-2xl bg-gray-900/80 backdrop-blur-xl transition-all duration-500',
        'border border-white/10 shadow-lg hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/20 hover:border-violet-500/30',
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        <OptimizedImage
          src={thumbnailUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/60 via-fuchsia-900/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Neon border effect on hover */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-2 group-hover:ring-violet-500/50 transition-all duration-500" />

        {/* Tags overlay */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.tags.includes('nuevo') && (
            <Badge
              variant="default"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 backdrop-blur-sm"
            >
              Nuevo
            </Badge>
          )}
          {product.tags.includes('destacado') && (
            <Badge
              variant="secondary"
              className="bg-gray-900/90 text-cyan-400 backdrop-blur-sm border border-cyan-500/30 shadow-lg shadow-cyan-500/20"
            >
              Destacado
            </Badge>
          )}
          {badgePercent > 0 && (
            <Badge
              variant="destructive"
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/40 backdrop-blur-sm"
            >
              -{badgePercent}%
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 transition-colors duration-300 group-hover:text-cyan-400">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-100">
            {formatPrice(displayPrice)}
          </span>
          {comparePrice !== null && (
            <span className="text-xs font-medium text-gray-500 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

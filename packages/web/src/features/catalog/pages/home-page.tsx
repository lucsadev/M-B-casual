/**
 * HomePage — Landing page for M & B Casual.
 *
 * Route: /
 * Features:
 * - Hero section with call-to-action
 * - Featured products grid (uses useProducts hook)
 * - Category cards navigation
 * - SEO title: "M & B Casual — Indumentaria y Accesorios"
 */
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/use-products';
import { useDiscountedProducts } from '../hooks/use-discounted-products';
import { useCategories } from '../hooks/use-categories';
import { useShippingSettings } from '@/features/shipping/hooks/use-shipping-settings';
import { ProductCard } from '../components/product-card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/lib/seo';
import { formatPrice, type CatalogFilters } from '@mbt/shared';

export function HomePage() {
  const { freeShippingMin } = useShippingSettings();
  // Fetch featured products (tagged as 'destacado')
  const featuredFilters: Omit<CatalogFilters, 'page'> = {
    tags: 'destacado',
    pageSize: 8,
  };
  const { data: featuredData, isLoading: featuredLoading } =
    useProducts(featuredFilters);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: discountedProducts, isLoading: discountsLoading } =
    useDiscountedProducts();

  const featuredProducts =
    featuredData?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div>
      <SEO
        title="M & B Casual — Moda y Accesorios"
        description="Descubrí nuestra colección de indumentaria y accesorios. Moda urbana con personalidad única."
        path="/"
      />
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] text-white">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-stretch md:justify-between">
          {/* Left column — text and CTAs */}
          <div className="flex items-center px-4 py-10 md:py-0">
            <div className="max-w-xl">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              Estilo que
              <br />
              <span className="text-[#E8836B]">habla por vos</span>
            </h1>
            <p className="mt-3 text-base text-white/70 md:text-lg">
              Descubrí nuestra colección de indumentaria y accesorios.
              Moda urbana con personalidad única.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/catalogo"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8836B] px-8 text-sm font-medium text-white shadow transition-colors hover:bg-[#E8836B]/90"
              >
                Ver catálogo
              </Link>
              <Link
                to="/catalogo?category=nuevo"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/20 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Novedades
              </Link>
            </div>
            {/* Shipping banner */}
            <div className="mt-6 inline-flex animate-banner-glow items-center gap-3 text-xl font-semibold text-[#E8836B] md:text-2xl">
              <span aria-hidden="true" className="text-2xl md:text-3xl">🚚</span>
              Envío gratis a partir de {formatPrice(freeShippingMin)}
            </div>
          </div>
          </div>

          {/* Logo — half derecha del hero, sin padding. En mobile va arriba */}
          <div className="order-first w-full shrink-0 md:order-none md:w-[40%]">
            <img
              src="/logo-hero.jpg"
              alt="M & B Casual"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* Featured products — hidden entirely when empty */}
      {featuredLoading || featuredProducts.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
                Destacados
              </h2>
              <p className="mt-1 text-[#1A1A1A]/60">
                Los productos más populares de la temporada.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#E8836B] transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver todos →
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-[#E2E2DC]">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Discounted products — hidden entirely when empty */}
      {discountsLoading ||
      (discountedProducts && discountedProducts.length > 0) ? (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
                Ofertas
              </h2>
              <p className="mt-1 text-[#1A1A1A]/60">
                Productos con descuento por tiempo limitado.
              </p>
            </div>
            <Link
              to="/catalogo?tag=oferta"
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#E8836B] transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver todos →
            </Link>
          </div>

          {discountsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-[#E2E2DC]">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : discountedProducts && discountedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {discountedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Category cards */}
      <section className="bg-[#F0F0EC] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Categorías
          </h2>

          {categoriesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl lg:h-28" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalogo?category=${cat.slug}`}
                  className="group relative flex h-48 items-end overflow-hidden rounded-xl bg-transparent p-6 transition-transform hover:-translate-y-1 lg:h-28"
                >
                  {/* Background image — full opacity, fills the card like before */}
                  {cat.imageUrl && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <OptimizedImage
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Title — over the image */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

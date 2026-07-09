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
import { useCategories } from '../hooks/use-categories';
import { ProductCard } from '../components/product-card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/lib/seo';
import type { CatalogFilters } from '@mbt/shared';

export function HomePage() {
  // Fetch featured products (tagged as 'destacado')
  const featuredFilters: Omit<CatalogFilters, 'page'> = {
    tags: 'destacado',
    pageSize: 8,
  };
  const { data: featuredData, isLoading: featuredLoading } =
    useProducts(featuredFilters);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

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
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Estilo que
              <br />
              <span className="text-[#E8836B]">habla por vos</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 md:text-xl">
              Descubrí nuestra colección de indumentaria y accesorios.
              Moda urbana con personalidad única.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
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
          </div>
        </div>
      </section>

      {/* Featured products */}
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
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-[#1A1A1A]/40">
            Próximamente productos destacados.
          </p>
        )}
      </section>

      {/* Category cards */}
      <section className="bg-[#F0F0EC] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Categorías
          </h2>

          {categoriesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalogo?category=${cat.slug}`}
                  className="group relative flex h-48 items-end overflow-hidden rounded-xl bg-[#1A1A1A] p-6 transition-transform hover:-translate-y-1"
                >
                  {/* Background image */}
                  {cat.imageUrl && (
                    <OptimizedImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="absolute inset-0 h-full w-full opacity-50 transition-opacity group-hover:opacity-60"
                    />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Text */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="mt-1 text-sm text-white/70">
                        {cat.description}
                      </p>
                    )}
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

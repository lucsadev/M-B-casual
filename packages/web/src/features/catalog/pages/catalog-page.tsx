/**
 * CatalogPage — Product catalog with search, category filter, and grid.
 *
 * Route: /catalogo
 * Reads initial state from URL ?category=...&q=... params.
 * SEO title: "Catálogo — M & B Casual"
 * Modern design with improved spacing and visual hierarchy
 */
import { useUrlFilters } from '@/hooks/use-url-filters';
import { SearchBar } from '../components/search-bar';
import { CategoryFilter } from '../components/category-filter';
import { ProductGrid } from '../components/product-grid';
import { SEO } from '@/lib/seo';

export function CatalogPage() {
  const { category, search, setCategory, setSearch } = useUrlFilters();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Catálogo — M & B Casual"
        description="Explorá nuestra colección de indumentaria y accesorios. Encontrá el estilo que habla por vos."
        path="/catalogo"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          Catálogo
        </h1>
        <p className="mt-2 text-base text-[#1A1A1A]/60">
          Explorá nuestra colección de indumentaria y accesorios.
        </p>
      </div>

      {/* Search bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        className="mb-6"
      />

      {/* Category filter */}
      <CategoryFilter
        activeCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Divider */}
      <hr className="my-8 border-[#E2E2DC]" />

      {/* Product grid */}
      <ProductGrid category={category} search={search} />
    </section>
  );
}

/**
 * CatalogPage — Product catalog with search, category filter, and grid.
 *
 * Route: /catalogo
 * Reads initial state from URL ?category=...&q=... params.
 * SEO title: "Catálogo — M&B Trend"
 */
import { useUrlFilters } from '@/hooks/use-url-filters';
import { SearchBar } from '../components/search-bar';
import { CategoryFilter } from '../components/category-filter';
import { ProductGrid } from '../components/product-grid';
import { SEO } from '@/lib/seo';

export function CatalogPage() {
  const { category, search, setCategory, setSearch } = useUrlFilters();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <SEO
        title="Catálogo — M&B Trend"
        description="Explorá nuestra colección de indumentaria y accesorios. Encontrá el estilo que habla por vos."
        path="/catalogo"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Catálogo</h1>
        <p className="mt-1 text-[#1A1A1A]/60">
          Explorá nuestra colección de indumentaria y accesorios.
        </p>
      </div>

      {/* Search bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        className="mb-4"
      />

      {/* Category filter */}
      <CategoryFilter
        activeCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Divider */}
      <hr className="my-6 border-[#E8E4D9]" />

      {/* Product grid */}
      <ProductGrid category={category} search={search} />
    </section>
  );
}

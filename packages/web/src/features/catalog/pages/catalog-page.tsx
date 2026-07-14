/**
 * CatalogPage — Product catalog with search, category filter, and grid.
 *
 * Route: /catalogo
 * Reads initial state from URL ?category=...&q=... params.
 * SEO title: "Catálogo — M & B Casual"
 * Cyberpunk dark mode design with neon effects and gradients
 */
import { useUrlFilters } from '@/hooks/use-url-filters';
import { SearchBar } from '../components/search-bar';
import { CategoryFilter } from '../components/category-filter';
import { ProductGrid } from '../components/product-grid';
import { SEO } from '@/lib/seo';

export function CatalogPage() {
  const { category, search, setCategory, setSearch } = useUrlFilters();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-600/5 blur-[80px]" />
      </div>

      <SEO
        title="Catálogo — M & B Casual"
        description="Explorá nuestra colección de indumentaria y accesorios. Encontrá el estilo que habla por vos."
        path="/catalogo"
      />

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text sm:text-5xl drop-shadow-lg">
          Catálogo
        </h1>
        <p className="mt-3 text-base text-gray-400">
          Explorá nuestra colección de indumentaria y accesorios.
        </p>
      </div>

      {/* Search bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        className="mb-8"
      />

      {/* Category filter */}
      <CategoryFilter
        activeCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Divider */}
      <hr className="my-10 border-white/10" />

      {/* Product grid */}
      <ProductGrid category={category} search={search} />
    </section>
  );
}

/**
 * CategoryFilter — Horizontal category chips/tabs for filtering products.
 *
 * Desktop: horizontal scrollable row of category chips.
 * Mobile: dropdown <select> that takes full width.
 * Active category is highlighted based on the URL ?category=slug param.
 * Cyberpunk dark mode design with neon glow effects and gradients
 */
import { useCategories } from '../hooks/use-categories';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { data: categories, isLoading, isError } = useCategories();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-28 animate-pulse rounded-full bg-gray-800"
          />
        ))}
      </div>
    );
  }

  // Error state — silently hide the filter so the grid still works
  if (isError || !categories || categories.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Desktop: horizontal chips */}
      <div className="hidden gap-2 overflow-x-auto pb-2 sm:flex">
        <button
          onClick={() => onCategoryChange('')}
          className={cn(
            'whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300',
            'hover:-translate-y-0.5',
            !activeCategory
              ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'
              : 'bg-gray-900/80 text-gray-300 border border-white/10 hover:border-violet-500/50 hover:text-violet-400 backdrop-blur-sm',
          )}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              'whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300',
              'hover:-translate-y-0.5',
              activeCategory === cat.slug
                ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'
                : 'bg-gray-900/80 text-gray-300 border border-white/10 hover:border-violet-500/50 hover:text-violet-400 backdrop-blur-sm',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Mobile: dropdown select */}
      <select
        value={activeCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-sm font-medium text-gray-100 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-gray-900 sm:hidden"
        aria-label="Filtrar por categoría"
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}

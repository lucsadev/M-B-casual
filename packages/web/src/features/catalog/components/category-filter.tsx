/**
 * CategoryFilter — Horizontal category chips/tabs for filtering products.
 *
 * Desktop: horizontal scrollable row of category chips.
 * Mobile: dropdown <select> that takes full width.
 * Active category is highlighted based on the URL ?category=slug param.
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
            className="h-9 w-24 animate-pulse rounded-full bg-neutral-200"
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
            'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            !activeCategory
              ? 'border-[#E8836B] bg-[#E8836B] text-white'
              : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B] hover:text-[#E8836B]',
          )}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeCategory === cat.slug
                ? 'border-[#E8836B] bg-[#E8836B] text-white'
                : 'border-[#E2E2DC] bg-white text-[#1A1A1A] hover:border-[#E8836B] hover:text-[#E8836B]',
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
        className="w-full rounded-md border border-[#E2E2DC] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#E8836B] sm:hidden"
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

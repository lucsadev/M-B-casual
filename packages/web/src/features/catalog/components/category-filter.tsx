/**
 * CategoryFilter — Category selector for the catalog.
 *
 * Categories render as image-backed chips that keep their original compact size. Each
 * chip shows a background image (object-cover) with bold white title text with a
 * soft drop shadow, matching the home page's typography and shadow. Desktop row
 * as chips; mobile as a dropdown select.
 *
 * Active category is highlighted by a coral ring.
 */
import { useCategories } from '../hooks/use-categories';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { data: categories, isLoading, isError } = useCategories();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-[#F0F0EC]" />
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
      {/* Desktop: image-backed chips */}
      <div className="hidden gap-2 overflow-x-auto py-2 sm:flex">
        <button
          onClick={() => onCategoryChange('')}
          className={cn(
            'whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-100',
            'shadow-[0_3px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.2)]',
            !activeCategory
              ? 'bg-gradient-to-r from-[#E8836B] to-[#E8836B]/90 text-white shadow-md'
              : 'bg-white text-[#1A1A1A] border border-[#E2E2DC] hover:border-[#E8836B] hover:text-[#E8836B]',
          )}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              'relative overflow-hidden whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-100',
              'shadow-[0_3px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.25)]',
              activeCategory === cat.slug ? 'ring-2 ring-[#E8836B]' : '',
            )}
          >
            {/* Background image — fills the chip */}
            {cat.imageUrl && (
              <span className="absolute inset-0">
                <OptimizedImage src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
              </span>
            )}
            {/* Title — over the image, bold white with drop shadow */}
            <span className="relative z-10 text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile: dropdown select */}
      <select
        value={activeCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full rounded-xl border border-[#E2E2DC] bg-white px-4 py-3 text-sm font-medium text-[#1A1A1A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E8836B] focus:ring-offset-0 sm:hidden"
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

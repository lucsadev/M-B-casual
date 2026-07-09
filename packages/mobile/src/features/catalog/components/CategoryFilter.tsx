/**
 * CategoryFilter — Horizontal scrollable category chips for mobile catalog.
 *
 * Active category is highlighted. "Todas" chip clears the filter.
 * Uses a horizontal ScrollView for native horizontal scrolling.
 */
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useCategories } from '../hooks/use-categories';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row gap-2 py-2"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            className="h-9 w-24 rounded-full bg-neutral-200 animate-pulse"
          />
        ))}
      </ScrollView>
    );
  }

  if (isError || !categories || categories.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
    >
      {/* "Todas" chip */}
      <TouchableOpacity
        onPress={() => onCategoryChange('')}
        className={`px-4 py-1.5 rounded-full border ${
          !activeCategory
            ? 'bg-[#D4A853] border-[#D4A853]'
            : 'bg-white border-[#E8E4D9]'
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            !activeCategory ? 'text-white' : 'text-[#1A1A1A]'
          }`}
        >
          Todas
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          onPress={() => onCategoryChange(cat.slug)}
          className={`px-4 py-1.5 rounded-full border ${
            activeCategory === cat.slug
              ? 'bg-[#D4A853] border-[#D4A853]'
              : 'bg-white border-[#E8E4D9]'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeCategory === cat.slug ? 'text-white' : 'text-[#1A1A1A]'
            }`}
          >
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

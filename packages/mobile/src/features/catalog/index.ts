/**
 * Catalog feature barrel (mobile) — re-exports hooks, queries, and components.
 *
 * Public API for the mobile catalog domain:
 * - Hooks: useCategories, useProducts, useProduct
 * - Queries: getCategories, getProducts, getProductBySlug
 * - Components: ProductListItem, SearchBar, CategoryFilter, VariantSelector
 */

// Hooks
export { useCategories, CATEGORIES_KEY } from './hooks/use-categories';
export { useProducts } from './hooks/use-products';
export { useProduct } from './hooks/use-product';

// API queries
export { getCategories, getProducts, getProductBySlug } from './api/queries';

// Components
export { ProductListItem } from './components/ProductListItem';
export { SearchBar } from './components/SearchBar';
export { CategoryFilter } from './components/CategoryFilter';
export { VariantSelector } from './components/VariantSelector';

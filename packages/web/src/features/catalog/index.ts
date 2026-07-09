/**
 * Catalog feature barrel — re-exports hooks, queries, components, and pages.
 *
 * Public API for the catalog domain:
 * - Hooks: useCategories, useProducts, useProduct
 * - Queries: getCategories, getProducts, getProductBySlug, getProductById
 * - Components: SearchBar, CategoryFilter, ProductCard, ProductGrid
 * - Pages: CatalogPage, ProductDetailPage, HomePage
 */

// Hooks
export { useCategories, CATEGORIES_KEY } from './hooks/use-categories';
export { useProducts } from './hooks/use-products';
export { useProduct } from './hooks/use-product';

// API queries (for direct use in mutations or admin pages)
export {
  getCategories,
  getProducts,
  getProductBySlug,
  getProductById,
} from './api/queries';

// Components
export { SearchBar } from './components/search-bar';
export { CategoryFilter } from './components/category-filter';
export { ProductCard } from './components/product-card';
export { ProductGrid } from './components/product-grid';

// Pages
export { CatalogPage } from './pages/catalog-page';
export { ProductDetailPage } from './pages/product-detail-page';
export { HomePage } from './pages/home-page';

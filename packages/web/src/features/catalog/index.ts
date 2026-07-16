/**
 * Catalog feature barrel — re-exports hooks, queries, components, and pages.
 *
 * Public API for the catalog domain:
 * - Hooks: useCategories, useProducts, useProduct, useProductQuestions, useCreateQuestion
 * - Queries: getCategories, getProducts, getProductBySlug, getProductById, getProductQuestions, createQuestion
 * - Components: SearchBar, CategoryFilter, ProductCard, ProductGrid, ProductQuestions, QuestionItem, QuestionForm
 * - Pages: CatalogPage, ProductDetailPage, HomePage
 */

// Hooks
export { useCategories, CATEGORIES_KEY } from './hooks/use-categories';
export { useProducts } from './hooks/use-products';
export { useProduct } from './hooks/use-product';
export { useProductQuestions, useCreateQuestion } from './hooks/use-product-questions';

// API queries (for direct use in mutations or admin pages)
export {
  getCategories,
  getProducts,
  getProductBySlug,
  getProductById,
} from './api/queries';
export { getProductQuestions, createQuestion } from './api/product-questions';

// Components
export { SearchBar } from './components/search-bar';
export { CategoryFilter } from './components/category-filter';
export { ProductCard } from './components/product-card';
export { ProductGrid } from './components/product-grid';
export { ProductQuestions } from './components/product-questions';
export { QuestionItem } from './components/question-item';
export { QuestionForm } from './components/question-form';

// Pages
export { CatalogPage } from './pages/catalog-page';
export { ProductDetailPage } from './pages/product-detail-page';
export { HomePage } from './pages/home-page';

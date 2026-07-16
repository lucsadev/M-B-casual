/**
 * Catalog feature barrel (mobile) — re-exports hooks, queries, and components.
 *
 * Public API for the mobile catalog domain:
 * - Hooks: useCategories, useProducts, useProduct, useProductQuestions, useCreateQuestion
 * - Queries: getCategories, getProducts, getProductBySlug, getProductQuestions, createQuestion
 * - Components: ProductListItem, SearchBar, CategoryFilter, VariantSelector,
 *              QuestionItem, QuestionForm, ProductQuestionsSheet
 */

// Hooks
export { useCategories, CATEGORIES_KEY } from './hooks/use-categories';
export { useProducts } from './hooks/use-products';
export { useProduct } from './hooks/use-product';
export {
  useProductQuestions,
  useCreateQuestion,
  productQuestionsKey,
} from './hooks/use-product-questions';

// API queries
export { getCategories, getProducts, getProductBySlug } from './api/queries';
export { getProductQuestions, createQuestion } from './api/product-questions';

// Components
export { ProductListItem } from './components/ProductListItem';
export { SearchBar } from './components/SearchBar';
export { CategoryFilter } from './components/CategoryFilter';
export { VariantSelector } from './components/VariantSelector';
export { QuestionItem } from './components/QuestionItem';
export { QuestionForm } from './components/QuestionForm';
export { ProductQuestionsSheet } from './components/ProductQuestionsSheet';

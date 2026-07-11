/**
 * Supabase query functions for the catalog domain.
 *
 * Each function maps DB row types (snake_case) to shared domain types (camelCase)
 * and encapsulates the raw Supabase query logic. Hooks layer on top of these.
 */
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type {
  Category,
  Product,
  ProductVariant,
  CatalogFilters,
  PaginationParams,
  PaginatedResponse,
} from '@mbt/shared';
import { buildPagination, buildPaginatedResponse } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Row-level type helpers
// ---------------------------------------------------------------------------

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type VariantRow = Database['public']['Tables']['product_variants']['Row'];

// ---------------------------------------------------------------------------
// Mappers (DB snake_case → domain camelCase)
// ---------------------------------------------------------------------------

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    price: row.price,
    comparePrice: row.compare_price ?? undefined,
    images: row.images ?? [],
    tags: row.tags ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    colorHex: row.color_hex ?? undefined,
    discount: row.discount,
    stock: row.stock,
    sku: row.sku ?? undefined,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/**
 * Fetch all active categories ordered by sort_order.
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

/**
 * Fetch products with optional filtering and offset-based pagination.
 *
 * Supports:
 * - Category filter (resolves slug to category_id first — avoids join type issues)
 * - Free-text search (ILIKE on products.name)
 * - Tag filter (array overlap)
 * - Price range filter
 * - Offset pagination via buildPagination helper
 */
export async function getProducts(
  filters: Omit<CatalogFilters, 'page' | 'pageSize'>,
  pagination: PaginationParams,
): Promise<PaginatedResponse<Product>> {
  // Resolve category slug to ID first (avoids Supabase join typing issues)
  let categoryId: string | undefined;
  if (filters.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .maybeSingle<Pick<CategoryRow, 'id'>>();
    if (!cat) {
      // Category not found — return empty result
      return buildPaginatedResponse([], 0, pagination);
    }
    categoryId = cat.id;
  }

  // Base query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Category filter
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Free-text search via ILIKE
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  // Tag filter
  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t: string) => t.trim());
    query = query.contains('tags', tagList);
  }

  // Price range
  if (filters.priceMin !== undefined) {
    query = query.gte('price', filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte('price', filters.priceMax);
  }

  // Pagination
  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  const products = (data ?? []).map(mapProduct);
  return buildPaginatedResponse(products, count ?? 0, pagination);
}

/**
 * Fetch a single product by its slug, including variants.
 */
export async function getProductBySlug(
  slug: string,
): Promise<(Product & { variants: ProductVariant[] }) | null> {
  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle<ProductRow>();

  if (productError) throw productError;
  if (!productRows) return null;

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productRows.id)
    .order('size', { ascending: true });

  if (variantError) throw variantError;

  return {
    ...mapProduct(productRows),
    variants: (variantRows ?? []).map(mapVariant),
  };
}

/**
 * Fetch a single product by its UUID, including variants.
 * Useful for admin edit forms.
 */
export async function getProductById(
  id: string,
): Promise<(Product & { variants: ProductVariant[] }) | null> {
  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle<ProductRow>();

  if (productError) throw productError;
  if (!productRows) return null;

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productRows.id)
    .order('size', { ascending: true });

  if (variantError) throw variantError;

  return {
    ...mapProduct(productRows),
    variants: (variantRows ?? []).map(mapVariant),
  };
}

// ---------------------------------------------------------------------------
// Discounted products
// ---------------------------------------------------------------------------

interface DiscountedProductRow {
  id: string | null;
  name: string | null;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  price: number | null;
  compare_price: number | null;
  images: string[] | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  effective_price: number | null;
  max_discount: number | null;
}

function mapDiscountedProduct(row: DiscountedProductRow): Product {
  return {
    id: row.id ?? '',
    categoryId: row.category_id ?? '',
    name: row.name ?? '',
    slug: row.slug ?? '',
    description: row.description ?? undefined,
    price: row.price ?? 0,
    comparePrice: row.compare_price ?? undefined,
    images: row.images ?? [],
    tags: row.tags ?? [],
    isActive: row.is_active ?? false,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    effectivePrice: row.effective_price ?? undefined,
    variantDiscountPercent: row.max_discount ?? undefined,
  };
}

/**
 * Fetch active products that have at least one variant with discount > 0.
 * Includes computed `effectivePrice` (cheapest variant after discount)
 * and `variantDiscountPercent` (highest variant discount %).
 */
export async function getDiscountedProducts(
  params: { limit?: number } = {},
): Promise<Product[]> {
  const { limit = 8 } = params;

  const { data, error } = await supabase
    .from('discounted_products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapDiscountedProduct);
}


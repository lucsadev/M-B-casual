/**
 * Supabase query functions for the catalog domain (mobile).
 *
 * Mirrors the web queries in packages/web/src/features/catalog/api/queries.ts.
 * Each function maps DB row types to shared domain types and encapsulates
 * the raw Supabase query logic.
 */
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
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
type DiscountedProductRow = Database['public']['Views']['discounted_products']['Row'];

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
    images: row.images ?? [],
    tags: row.tags ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

/** Compute discount info from variants list */
function computeVariantDiscounts(
  product: Product,
  variants: ProductVariant[],
): { comparePrice?: number; effectivePrice?: number; variantDiscountPercent?: number } {
  const discounts = variants
    .map((v) => v.discount ?? 0)
    .filter((d) => d > 0);

  if (discounts.length === 0) return {};

  const maxDiscount = Math.max(...discounts);
  return {
    comparePrice: product.price,
    effectivePrice:
      Math.round(product.price * (1 - maxDiscount / 100) * 100) / 100,
    variantDiscountPercent: maxDiscount,
  };
}

function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
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
 */
export async function getProducts(
  filters: Omit<CatalogFilters, 'page' | 'pageSize'>,
  pagination: PaginationParams,
): Promise<PaginatedResponse<Product>> {
  let categoryId: string | undefined;
  if (filters.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .maybeSingle<Pick<CategoryRow, 'id'>>();
    if (!cat) {
      return buildPaginatedResponse([], 0, pagination);
    }
    categoryId = cat.id;
  }

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t: string) => t.trim());
    query = query.contains('tags', tagList);
  }

  if (filters.priceMin !== undefined) {
    query = query.gte('price', filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte('price', filters.priceMax);
  }

  const from = pagination.offset;
  const to = pagination.offset + pagination.pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  const products = (data ?? []).map(mapProduct);

  // Merge discount info from discounted_products view when available
  const productIds = products.map((p) => p.id).filter(Boolean);
  if (productIds.length > 0) {
    const { data: discountedRows, error: discountError } = await supabase
      .from('discounted_products')
      .select('*')
      .in('id', productIds);

    if (!discountError && discountedRows) {
      const discountMap = new Map(
        discountedRows.map((r: DiscountedProductRow) => [
          r.id,
          { effectivePrice: r.effective_price, variantDiscountPercent: r.max_discount, comparePrice: r.compare_price },
        ]),
      );

      for (const product of products) {
        const discount = discountMap.get(product.id);
        if (discount && (discount.variantDiscountPercent ?? 0) > 0) {
          product.effectivePrice = discount.effectivePrice ?? undefined;
          product.variantDiscountPercent = discount.variantDiscountPercent ?? undefined;
          product.comparePrice = discount.comparePrice ?? undefined;
        }
      }
    }
  }

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

  const product = mapProduct(productRows);
  const variants = (variantRows ?? []).map(mapVariant);
  return {
    ...product,
    ...computeVariantDiscounts(product, variants),
    variants,
  };
}

/**
 * Fetch active products that have at least one variant with discount > 0.
 * Includes computed effectivePrice and variantDiscountPercent.
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

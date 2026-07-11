/**
 * Product represents a sellable item in the catalog.
 * Maps to the `products` table in Supabase.
 */
export interface Product {
  /** UUID primary key */
  id: string;
  /** Foreign key to `categories.id` */
  categoryId: string;
  /** Display name (e.g., "Camisa Oversize Blanca") */
  name: string;
  /** URL-friendly unique identifier */
  slug: string;
  /** Short product description */
  description?: string;
  /** Current selling price in ARS */
  price: number;
  /** Original price before discount (for showing savings) */
  comparePrice?: number;
  /** URLs to product images in Supabase Storage */
  images: string[];
  /** Tags for filtering: 'nuevo', 'destacado', 'oferta' */
  tags: string[];
  /** Whether the product is visible and purchasable */
  isActive: boolean;
  /** Lowest price after variant discount (populated by discounted_products view) */
  effectivePrice?: number;
  /** Highest variant discount percentage (populated by discounted_products view) */
  variantDiscountPercent?: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * ProductVariant represents a specific size+color combination of a product.
 * Maps to the `product_variants` table in Supabase.
 */
export interface ProductVariant {
  /** UUID primary key */
  id: string;
  /** Foreign key to `products.id` */
  productId: string;
  /** Size label: 'S', 'M', 'L', 'XL', 'XXL', 'Único' */
  size?: string;
  /** Color name: 'Negro', 'Marfil', 'Beige', etc. */
  color?: string;
  /** Hex color code for UI swatches (e.g., '#1A1A1A') */
  colorHex?: string;
  /** Discount percentage applied on top of product.price (0-100) */
  discount?: number;
  /** Current stock count */
  stock: number;
  /** Internal SKU code */
  sku?: string;
  /** ISO timestamp of creation */
  createdAt: string;
}

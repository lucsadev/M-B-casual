/**
 * Purchase represents a stock replenishment from a supplier.
 * Maps to the `purchases` table in Supabase.
 */
export interface Purchase {
  /** UUID primary key */
  id: string;
  /** Name of the supplier or vendor */
  supplierName: string;
  /** Supplier invoice or receipt number */
  invoiceNumber?: string;
  /** Total cost of the purchase */
  total: number;
  /** Internal notes about the purchase */
  notes?: string;
  /** Date the purchase was made */
  purchaseDate: string;
  /** ISO timestamp of creation */
  createdAt: string;
}

/**
 * PurchaseItem represents a single product line within a purchase.
 * Maps to the `purchase_items` table in Supabase.
 */
export interface PurchaseItem {
  /** UUID primary key */
  id: string;
  /** Foreign key to `purchases.id` */
  purchaseId: string;
  /** Foreign key to `products.id` */
  productId: string;
  /** Foreign key to `product_variants.id` (optional) */
  variantId?: string;
  /** Quantity of items purchased */
  quantity: number;
  /** Cost per unit */
  unitCost: number;
  /** Line total (quantity × unitCost) */
  subtotal: number;
}

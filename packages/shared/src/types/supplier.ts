/**
 * Supplier represents a vendor/supply contact for products and purchases.
 * Maps to the `suppliers` table in Supabase.
 */
export interface Supplier {
  /** UUID primary key */
  id: string;
  /** Display name (e.g., "Textil Ríos") */
  name: string;
  /** Contact person name within the supplier (optional) */
  contactName?: string;
  /** Contact email (optional) */
  email?: string;
  /** Contact phone (optional) */
  phone?: string;
  /** Physical address (optional) */
  address?: string;
  /** Whether the supplier is active for new associations */
  isActive: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Lightweight supplier reference used in product forms (id + name only).
 */
export interface SupplierOption {
  id: string;
  name: string;
}

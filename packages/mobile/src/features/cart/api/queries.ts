/**
 * Supabase query functions for the cart domain (mobile).
 *
 * Mirrors the web queries in packages/web/src/features/cart/api/queries.ts.
 * Same interface so hooks are portable between platforms.
 */
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { CartItem } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Row-level type helpers
// ---------------------------------------------------------------------------

type CartItemRow = Database['public']['Tables']['cart_items']['Row'];

/**
 * Response shape when joining cart_items with products and product_variants.
 */
interface CartItemJoined {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    slug: string;
    images: string[];
    price: number;
  } | null;
  product_variant: {
    size: string | null;
    color: string | null;
  } | null;
}

// Helper to work around Supabase type inference for mutation calls on new tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cartTable = () => supabase.from('cart_items') as any;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCartItem(row: CartItemJoined): CartItem {
  return {
    id: row.id,
    user_id: '',
    product_id: row.product_id,
    variant_id: row.variant_id,
    quantity: row.quantity,
    product_name: row.product?.name ?? '',
    product_slug: row.product?.slug ?? '',
    product_image: row.product?.images[0] ?? null,
    variant_label: row.product_variant
      ? [row.product_variant.size, row.product_variant.color]
          .filter(Boolean)
          .join(' / ') || null
      : null,
    unit_price: row.product?.price ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/**
 * Fetch all cart items for the current user, with product details joined.
 */
export async function getCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      variant_id,
      quantity,
      created_at,
      updated_at,
      product:product_id (
        name,
        slug,
        images,
        price
      ),
      product_variant:variant_id (
        size,
        color
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCartItem);
}

/**
 * Add an item to the cart (or increment quantity if same product+variant exists).
 */
export async function addItem(
  userId: string,
  input: { product_id: string; variant_id: string | null; quantity?: number },
): Promise<void> {
  const qty = input.quantity ?? 1;

  // Build query with proper null handling for variant_id
  let query = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', input.product_id);

  if (input.variant_id) {
    query = query.eq('variant_id', input.variant_id);
  } else {
    query = query.is('variant_id', null);
  }

  const { data: existing } = await query
    .maybeSingle<Pick<CartItemRow, 'id' | 'quantity'>>();

  if (existing) {
    await cartTable()
      .update({ quantity: existing.quantity + qty })
      .eq('id', existing.id);
  } else {
    await cartTable()
      .insert({
        user_id: userId,
        product_id: input.product_id,
        variant_id: input.variant_id,
        quantity: qty,
      });
  }
}

/**
 * Update the quantity of a specific cart item.
 */
export async function updateQty(itemId: string, quantity: number): Promise<void> {
  const { error } = await cartTable()
    .update({ quantity })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Remove a specific item from the cart.
 */
export async function removeItem(itemId: string): Promise<void> {
  const { error } = await cartTable()
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Clear all cart items for the current user.
 */
export async function clearCart(userId: string): Promise<void> {
  const { error } = await cartTable()
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Anonymous cart → server merge
// ---------------------------------------------------------------------------

/**
 * Shape of an item in the anonymous/local cart.
 */
export interface LocalCartItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product_name: string;
  unit_price: number;
  product_image: string | null;
}

/**
 * Merge anonymous local cart items into the server-side cart.
 *
 * For each local item, UPSERT into cart_items by (user_id, product_id, variant_id).
 * If the combination already exists, sum the quantities.
 * This is called right after login, before clearing the local cart.
 */
export async function mergeLocalCart(
  userId: string,
  localItems: LocalCartItem[],
): Promise<void> {
  if (localItems.length === 0) return;

  const results = await Promise.allSettled(
    localItems.map(async (item) => {
      // Check if this product+variant already exists in the user's cart
      let query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', item.product_id);

      if (item.variant_id) {
        query = query.eq('variant_id', item.variant_id);
      } else {
        query = query.is('variant_id', null);
      }

      const { data: existing } = await query
        .maybeSingle<Pick<CartItemRow, 'id' | 'quantity'>>();

      if (existing) {
        // Sum quantities
        const { error: updateError } = await cartTable()
          .update({ quantity: existing.quantity + item.quantity })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new row
        const { error: insertError } = await cartTable().insert({
          user_id: userId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        });

        if (insertError) throw insertError;
      }
    }),
  );

  // If any upsert failed, throw a combined error so the caller
  // knows not to clear the local cart
  const rejected = results.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected',
  );
  if (rejected.length > 0) {
    throw new Error(
      `Error al sincronizar el carrito: ${rejected.length} item(s) fallaron`,
    );
  }
}

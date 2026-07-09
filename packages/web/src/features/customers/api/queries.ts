/**
 * Supabase query functions for the customer profile domain.
 *
 * Each function encapsulates the raw Supabase query logic for reading
 * and updating customer profile data. Hooks layer on top with TanStack Query.
 *
 * Profile data lives in the `customers` table (one row per auth user).
 * Email is sourced from `auth.users` via `supabase.auth.getUser()`.
 */
import { supabase } from '@/lib/supabase';
import type { CustomerProfile, ProfileUpdateInput } from '@mbt/shared';
import type { Database } from '@/lib/database.types';

// ---------------------------------------------------------------------------
// Row-level type helpers
// ---------------------------------------------------------------------------

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCustomer(row: CustomerRow, email: string): CustomerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: row.address,
    email,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/**
 * Fetch the authenticated user's customer profile.
 *
 * Combines data from the `customers` table with the email from
 * `supabase.auth.getUser()`.
 */
export async function getProfile(userId: string): Promise<CustomerProfile> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single<CustomerRow>();

  if (error) throw error;
  if (!data) throw new Error('Perfil de cliente no encontrado');

  // Get email from auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return mapCustomer(data, user?.email ?? '');
}

/**
 * Update the authenticated user's customer profile fields.
 *
 * Uses update (not upsert) because the row already exists via the
 * handle_new_user DB trigger. Only the provided fields are changed.
 */
export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};

  if (input.firstName !== undefined) updateData.first_name = input.firstName;
  if (input.lastName !== undefined) updateData.last_name = input.lastName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.address !== undefined) updateData.address = input.address;

  const { error } = await (supabase.from('customers') as any)
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Fetch orders for a given customer, sorted by most recent first.
 */
export async function getOrders(customerId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

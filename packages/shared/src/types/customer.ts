/**
 * Customer stores profile data that extends the Supabase auth user.
 * Maps to the `customers` table in Supabase.
 */
export interface Customer {
  /** UUID primary key */
  id: string;
  /** Foreign key to `auth.users.id` (Supabase Auth) */
  userId: string;
  /** Customer's given name */
  firstName: string;
  /** Customer's surname */
  lastName?: string;
  /** Contact phone number */
  phone?: string;
  /** Shipping or billing address as a flexible JSON object */
  address?: Record<string, unknown>;
  /** ISO timestamp of creation */
  createdAt: string;
}

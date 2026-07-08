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

/**
 * CustomerProfile is the read shape returned by the profile API.
 * Includes the email from auth.users (not stored in customers table).
 */
export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: Record<string, unknown> | null;
  email: string;
  createdAt: string;
}

/**
 * ProfileUpdateInput is the write shape for updating profile fields.
 * Omits auto-generated and immutable fields (id, userId, createdAt, email).
 */
export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: Record<string, unknown> | null;
}

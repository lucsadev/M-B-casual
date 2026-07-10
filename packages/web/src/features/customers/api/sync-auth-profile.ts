import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerContactFields = Pick<
  CustomerRow,
  'first_name' | 'last_name' | 'phone' | 'address'
>;

function splitDisplayName(displayName?: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function getUserDisplayName(user: User): string {
  return (
    user.user_metadata?.nombre ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    ''
  );
}

function getUserPhone(user: User): string {
  const metadata = user.user_metadata ?? {};
  const phoneNumbers = metadata.phone_numbers ?? metadata.phoneNumbers;
  const firstPhone =
    Array.isArray(phoneNumbers) && phoneNumbers.length > 0
      ? phoneNumbers[0]?.value ?? phoneNumbers[0]?.canonicalForm
      : null;

  return (
    metadata.telefono ??
    metadata.phone ??
    metadata.phone_number ??
    metadata.phoneNumber ??
    firstPhone ??
    ''
  );
}

function getUserAddress(user: User): Record<string, unknown> | null {
  const metadata = user.user_metadata ?? {};
  const rawAddress =
    metadata.address ??
    metadata.domicilio ??
    metadata.location ??
    (Array.isArray(metadata.addresses) && metadata.addresses.length > 0
      ? metadata.addresses[0]
      : null);

  if (!rawAddress) {
    return null;
  }

  if (typeof rawAddress === 'string') {
    return { formatted: rawAddress };
  }

  if (typeof rawAddress === 'object') {
    return rawAddress as Record<string, unknown>;
  }

  return null;
}

export async function syncAuthProfileToCustomer(user: User): Promise<void> {
  const displayName = getUserDisplayName(user);
  const { firstName, lastName } = splitDisplayName(displayName);
  const phone = getUserPhone(user);
  const address = getUserAddress(user);

  if (!firstName && !lastName && !phone && !address) {
    return;
  }

  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, address')
    .eq('user_id', user.id)
    .single<Pick<CustomerRow, 'id' | keyof CustomerContactFields>>();

  if (fetchError || !customer) {
    return;
  }

  const updateData: CustomerContactFields = {
    first_name: customer.first_name?.trim() || firstName,
    last_name: customer.last_name?.trim() || lastName,
    phone: customer.phone?.trim() || phone || null,
    address: customer.address ?? address,
  };

  if (
    updateData.first_name === customer.first_name &&
    updateData.last_name === customer.last_name &&
    updateData.phone === customer.phone &&
    updateData.address === customer.address
  ) {
    return;
  }

  await (supabase.from('customers') as any).update(updateData).eq('id', customer.id);
}

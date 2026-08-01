/**
 * User Messages — API and TanStack Query hooks for customer messages (mobile).
 *
 * Provides:
 * - useUserMessages — fetch messages for the current user
 * - useUnreadCount — number of unread messages
 * - useMarkAsRead — mark a message as read
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { Message } from '@mbt/shared';

type MessageRow = Database['public']['Tables']['messages']['Row'];

const MESSAGES_KEY = ['customer-messages'] as const;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    customerId: row.customer_id,
    orderId: row.order_id ?? undefined,
    type: row.type as Message['type'],
    title: row.title,
    body: row.body ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Query: fetch messages for the current user
// ---------------------------------------------------------------------------

async function fetchUserMessages(): Promise<Message[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('User not authenticated');

  // Get customer ID
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .single<{ id: string }>();

  if (customerError) throw customerError;
  if (!customer) throw new Error('Perfil de cliente no encontrado');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export function useUserMessages() {
  return useQuery({
    queryKey: MESSAGES_KEY,
    queryFn: fetchUserMessages,
    staleTime: 1000 * 30,
  });
}

// ---------------------------------------------------------------------------
// Query: unread count
// ---------------------------------------------------------------------------

async function fetchUnreadCount(): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return 0;

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .single<{ id: string }>();

  if (customerError || !customer) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer.id)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...MESSAGES_KEY, 'unread'],
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

// ---------------------------------------------------------------------------
// Mutation: mark a message as read
// ---------------------------------------------------------------------------

async function markAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true } as never)
    .eq('id', messageId);

  if (error) throw error;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
  });
}

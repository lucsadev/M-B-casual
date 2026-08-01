/**
 * User Questions — API and TanStack Query hook for a customer's own questions (mobile).
 *
 * Provides:
 * - useUserQuestions — fetch the current user's product questions with answers
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { ProductQuestion } from '@mbt/shared';

type QuestionRow = Database['public']['Tables']['product_questions']['Row'];

const USER_QUESTIONS_KEY = ['customer-questions'] as const;

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapQuestion(row: QuestionRow): ProductQuestion {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    questionText: row.question_text,
    answerText: row.answer_text ?? undefined,
    answeredBy: row.answered_by ?? undefined,
    answeredAt: row.answered_at ?? undefined,
    isVisible: row.is_visible,
    sessionId: row.session_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Query: fetch the current user's questions with product names
// ---------------------------------------------------------------------------

async function fetchUserQuestions(): Promise<(ProductQuestion & { productName?: string })[]> {
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

  // Fetch questions with product name
  const { data, error } = await supabase
    .from('product_questions')
    .select('*, products(name)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...mapQuestion(row),
    productName: row.products?.name ?? 'Producto',
  }));
}

export function useUserQuestions() {
  return useQuery({
    queryKey: USER_QUESTIONS_KEY,
    queryFn: fetchUserQuestions,
    staleTime: 1000 * 60 * 1,
  });
}

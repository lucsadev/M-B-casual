/**
 * Supabase query functions for product Q&A.
 *
 * Each function maps DB row types (snake_case) to shared domain types (camelCase)
 * and encapsulates the raw Supabase query logic. Hooks layer on top of these.
 *
 * RLS context:
 * - Anyone can see answered + visible questions.
 * - Authenticated users additionally see their own unanswered questions.
 * - Admin can see all questions.
 * - Anyone can insert.
 * - Admin-only for answering.
 */
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { ProductQuestion, CreateQuestionInput } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Row-level type helpers
// ---------------------------------------------------------------------------

type QuestionRow = Database['public']['Tables']['product_questions']['Row'];

// ---------------------------------------------------------------------------
// Mapper (DB snake_case → domain camelCase)
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
// Public query functions
// ---------------------------------------------------------------------------

/**
 * Fetch visible questions for a product, newest first.
 *
 * RLS ensures:
 * - Answered + visible questions are returned for everyone.
 * - Authenticated users also see their own unanswered questions.
 * - Admin can see all questions.
 */
export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  const { data, error } = await supabase
    .from('product_questions')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

/**
 * Insert a new product question.
 *
 * NOTE: Does NOT use `.select()` after insert to avoid RLS SELECT conflicts.
 * The hook adds the question to the local cache optimistically for immediate feedback.
 */
export async function createQuestion(input: CreateQuestionInput): Promise<void> {
  const { error } = await supabase.from('product_questions').insert({
    product_id: input.productId,
    question_text: input.questionText,
    customer_name: input.customerName ?? null,
    session_id: input.sessionId ?? null,
  });

  if (error) throw error;
}

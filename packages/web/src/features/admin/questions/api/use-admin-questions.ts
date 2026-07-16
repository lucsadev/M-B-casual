/**
 * Admin questions queries and mutations for the Product Q&A feature.
 *
 * Provides:
 * - getAdminQuestions / useAdminQuestions — fetch all questions with optional filter
 * - answerQuestion / useAnswerQuestion — answer a question mutation
 * - useUnansweredCount — query for unanswered count (used by Realtime badge)
 *
 * Query key: ['admin', 'questions']
 * All mutations invalidate this key so the list + count stay in sync.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { ProductQuestion, QuestionsFilter } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Row-level type helpers
// ---------------------------------------------------------------------------

type QuestionRow = Database['public']['Tables']['product_questions']['Row'];

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const ADMIN_QUESTIONS_KEY = ['admin', 'questions'] as const;
const UNANSWERED_COUNT_KEY = ['admin', 'unanswered-count'] as const;

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
// Query functions
// ---------------------------------------------------------------------------

/**
 * Fetch all product questions with optional filter, newest first.
 *
 * Admin context — RLS permits reading all rows for admin users.
 */
export async function getAdminQuestions(
  filter: QuestionsFilter = 'all',
): Promise<ProductQuestion[]> {
  let query = supabase
    .from('product_questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter === 'unanswered') {
    query = query.is('answer_text', null);
  } else if (filter === 'answered') {
    query = query.not('answer_text', 'is', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

/**
 * Answer a question — sets answer_text, answered_by (current user), and answered_at.
 *
 * RLS requires the caller to be an admin (role = 'admin') for this update to succeed.
 */
export async function answerQuestion(
  questionId: string,
  answerText: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('product_questions')
    .update({
      answer_text: answerText,
      answered_by: user?.id ?? null,
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId);

  if (error) throw error;
}

/**
 * Get the count of unanswered questions (used for the Realtime badge).
 */
export async function getUnansweredCount(): Promise<number> {
  const { data, error } = await supabase
    .from('product_questions')
    .select('id')
    .is('answer_text', null);

  if (error) throw error;
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

/**
 * Fetch questions for the admin panel with optional filter.
 *
 * @example
 * ```ts
 * const { data: questions, isLoading } = useAdminQuestions('unanswered');
 * ```
 */
export function useAdminQuestions(filter: QuestionsFilter = 'all') {
  return useQuery<ProductQuestion[]>({
    queryKey: [...ADMIN_QUESTIONS_KEY, { filter }],
    queryFn: () => getAdminQuestions(filter),
  });
}

/**
 * Mutation to answer a question.
 *
 * On success, invalidates the admin questions query cache so the list
 * and count badge stay in sync.
 *
 * @example
 * ```ts
 * const { mutate: answer, isPending } = useAnswerQuestion();
 * answer({ questionId: '...', answerText: 'Sí, tenemos envío gratis.' });
 * ```
 */
export function useAnswerQuestion() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { questionId: string; answerText: string }>({
    mutationFn: ({ questionId, answerText }) =>
      answerQuestion(questionId, answerText),
    onSuccess: () => {
      // Invalidate both the questions list AND the badge count
      queryClient.invalidateQueries({ queryKey: ADMIN_QUESTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNANSWERED_COUNT_KEY });
      toast.success('Pregunta respondida correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al responder: ${error.message}`);
    },
  });
}

/**
 * Query for the count of unanswered questions.
 *
 * Used by the Realtime badge in the admin sidebar. The badge component
 * additionally subscribes to Realtime INSERT/UPDATE events and calls
 * `refetch()` so the count updates live.
 */
export function useUnansweredCount() {
  return useQuery<number>({
    queryKey: UNANSWERED_COUNT_KEY,
    queryFn: getUnansweredCount,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
}

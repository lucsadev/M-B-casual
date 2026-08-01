import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { ProductQuestion, QuestionsFilter } from '@mbt/shared';

type QuestionRow = Database['public']['Tables']['product_questions']['Row'];

const ADMIN_QUESTIONS_KEY = ['admin', 'questions'] as const;
const UNANSWERED_COUNT_KEY = ['admin', 'unanswered-count'] as const;

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

export async function answerQuestion(
  questionId: string,
  answerText: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await (supabase
    .from('product_questions') as any)
    .update({
      answer_text: answerText,
      answered_by: user?.id ?? null,
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId);

  if (error) throw error;
}

export async function getUnansweredCount(): Promise<number> {
  const { data, error } = await supabase
    .from('product_questions')
    .select('id')
    .is('answer_text', null);

  if (error) throw error;
  return data?.length ?? 0;
}

export function useAdminQuestions(filter: QuestionsFilter = 'all') {
  return useQuery<ProductQuestion[]>({
    queryKey: [...ADMIN_QUESTIONS_KEY, filter],
    queryFn: () => getAdminQuestions(filter),
  });
}

export function useAnswerQuestion() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { questionId: string; answerText: string }>({
    mutationFn: ({ questionId, answerText }) =>
      answerQuestion(questionId, answerText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUESTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNANSWERED_COUNT_KEY });
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Error al responder: ${error.message}`);
    },
  });
}

export function useUnansweredCount() {
  return useQuery<number>({
    queryKey: UNANSWERED_COUNT_KEY,
    queryFn: getUnansweredCount,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
}

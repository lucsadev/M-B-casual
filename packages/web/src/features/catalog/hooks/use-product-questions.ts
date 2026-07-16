/**
 * useProductQuestions — TanStack Query hooks for product Q&A.
 *
 * Provides:
 * - useProductQuestions(productId) → query for questions
 * - useCreateQuestion(productId)   → mutation to submit a new question
 *
 * Query key: ['product-questions', productId]
 * On successful mutation, a optimistic placeholder is added to the cache
 * immediately so the user sees their question right away, then the query
 * refetches in the background to sync with server state.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductQuestion } from '@mbt/shared';
import type { CreateQuestionInput } from '@mbt/shared';
import { getProductQuestions, createQuestion } from '../api/product-questions';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export function productQuestionsKey(productId: string) {
  return ['product-questions', productId] as const;
}

// ---------------------------------------------------------------------------
// useProductQuestions — fetch questions for a product
// ---------------------------------------------------------------------------

/**
 * Fetch questions for the given product ID.
 *
 * The query is disabled when productId is empty.
 */
export function useProductQuestions(productId: string) {
  return useQuery<ProductQuestion[]>({
    queryKey: productQuestionsKey(productId),
    queryFn: () => getProductQuestions(productId),
    enabled: !!productId,
    staleTime: 1000 * 60, // 1 minute — questions don't change often
  });
}

// ---------------------------------------------------------------------------
// useCreateQuestion — submit a new question mutation
// ---------------------------------------------------------------------------

/**
 * Build an optimistic ProductQuestion from the submitted data.
 * Uses local timestamp and a temp id so the user sees their question immediately.
 */
function buildOptimisticQuestion(
  productId: string,
  input: Omit<CreateQuestionInput, 'productId'>,
): ProductQuestion {
  const now = new Date().toISOString();
  return {
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId,
    customerName: input.customerName,
    questionText: input.questionText,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Mutation to create a new question for a product.
 *
 * On success, inserts an optimistic placeholder into the local cache
 * so the user sees their question immediately, then refetches in the
 * background to sync with the actual server data.
 */
export function useCreateQuestion(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Omit<CreateQuestionInput, 'productId'>>({
    mutationFn: (input) =>
      createQuestion({ ...input, productId }),
    onMutate: async (input) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: productQuestionsKey(productId) });

      // Snapshot previous data for potential rollback
      const previous = queryClient.getQueryData<ProductQuestion[]>(
        productQuestionsKey(productId),
      );

      // Add optimistic question to the top
      const optimistic = buildOptimisticQuestion(productId, input);
      queryClient.setQueryData<ProductQuestion[]>(
        productQuestionsKey(productId),
        (old = []) => [optimistic, ...old],
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      // Rollback to the previous state on error
      if (context?.previous) {
        queryClient.setQueryData(productQuestionsKey(productId), context.previous);
      }
    },
    // NOTE: No onSettled/invalidation — unanswered questions aren't visible via RLS
    // for non-owners. The optimistic cache entry keeps the question visible until
    // the user leaves the page. A page refresh resets to server state (answered only).
  });
}

/**
 * useProductQuestions — TanStack Query hooks for product Q&A (mobile).
 *
 * Mirrors the web hooks in packages/web/src/features/catalog/hooks/use-product-questions.ts.
 *
 * Query key: ['product-questions', productId]
 * On successful mutation, an optimistic placeholder is added immediately.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductQuestion, CreateQuestionInput } from '@mbt/shared';
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
 */
export function useProductQuestions(productId: string) {
  return useQuery<ProductQuestion[]>({
    queryKey: productQuestionsKey(productId),
    queryFn: () => getProductQuestions(productId),
    enabled: !!productId,
    staleTime: 1000 * 60,
  });
}

// ---------------------------------------------------------------------------
// useCreateQuestion — submit a new question mutation
// ---------------------------------------------------------------------------

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
 * Adds optimistic placeholder to cache immediately, refetches on settle.
 */
export function useCreateQuestion(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Omit<CreateQuestionInput, 'productId'>>({
    mutationFn: (input) =>
      createQuestion({ ...input, productId }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: productQuestionsKey(productId) });

      const previous = queryClient.getQueryData<ProductQuestion[]>(
        productQuestionsKey(productId),
      );

      const optimistic = buildOptimisticQuestion(productId, input);
      queryClient.setQueryData<ProductQuestion[]>(
        productQuestionsKey(productId),
        (old = []) => [optimistic, ...old],
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productQuestionsKey(productId), context.previous);
      }
    },
    // NOTE: No invalidation — unanswered questions aren't visible via RLS.
    // The optimistic entry keeps the question visible until leaving the page.
  });
}

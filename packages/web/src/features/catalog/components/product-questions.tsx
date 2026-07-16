/**
 * ProductQuestions — Q&A section for the product detail page.
 *
 * Displays:
 * - Title "Preguntas y respuestas"
 * - Answered question list (newest first)
 * - Ask form at the bottom
 * - Empty state when no questions exist
 * - Loading skeleton while fetching
 * - Error state on fetch failure
 *
 * Uses useProductQuestions (query) and useCreateQuestion (mutation).
 */
import { useProductQuestions, useCreateQuestion } from '../hooks/use-product-questions';
import { QuestionItem } from './question-item';
import { QuestionForm } from './question-form';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Question list skeleton
// ---------------------------------------------------------------------------

function QuestionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-[#E2E2DC] bg-white p-4">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProductQuestionsProps {
  /** Product UUID to fetch questions for */
  productId: string;
}

export function ProductQuestions({ productId }: ProductQuestionsProps) {
  const {
    data: questions,
    isLoading,
    isError,
    error,
  } = useProductQuestions(productId);

  const {
    mutate: createQuestion,
    isPending: isSubmitting,
    error: submitError,
  } = useCreateQuestion(productId);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <section className="border-t border-[#E2E2DC] pt-8">
      <h2 className="mb-6 text-lg font-bold text-[#1A1A1A] uppercase tracking-wide">
        Preguntas y respuestas
      </h2>

      {/* Loading state */}
      {isLoading && <QuestionListSkeleton />}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error?.message ?? 'Error al cargar las preguntas. Intentalo de nuevo más tarde.'}
          </p>
        </div>
      )}

      {/* Question list */}
      {!isLoading && !isError && questions && questions.length > 0 && (
        <div className="mb-6 space-y-3">
          {questions.map((q) => (
            <QuestionItem key={q.id} question={q} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && questions && questions.length === 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-[#E2E2DC] bg-[#F0F0EC]/30 p-6 text-center">
          <p className="text-sm text-[#1A1A1A]/60">
            Todavía no hay preguntas. ¡Sé el primero en preguntar!
          </p>
        </div>
      )}

      {/* Ask form */}
      <div className="border-t border-[#E2E2DC]/50 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
          Hacé tu pregunta
        </h3>
        <QuestionForm
          onSubmit={(data) => createQuestion(data)}
          isPending={isSubmitting}
          submitError={submitError?.message}
        />
      </div>
    </section>
  );
}

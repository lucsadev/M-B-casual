/**
 * Admin Questions Page — manage customer product questions.
 *
 * Route: /admin/preguntas
 *
 * Features:
 * - Filter bar: Todas / Sin responder / Respondidas
 * - Expandable question list with inline answer form
 * - Responsive: cards on all screen sizes
 * - Loading skeleton and empty states per filter
 *
 * UI copy in Spanish (neutral/professional).
 */
import { useState } from 'react';
import { useAdminQuestions, useUnansweredCount } from '../api/use-admin-questions';
import { QuestionCard } from '../components/question-card';
import { Button } from '@/components/ui/button';
import type { QuestionsFilter } from '@mbt/shared';

// ---------------------------------------------------------------------------
// Filter definitions
// ---------------------------------------------------------------------------

const FILTERS: { value: QuestionsFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'unanswered', label: 'Sin responder' },
  { value: 'answered', label: 'Respondidas' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuestionsPage() {
  const [filter, setFilter] = useState<QuestionsFilter>('all');
  const { data: questions, isLoading } = useAdminQuestions(filter);
  const { data: unansweredCount } = useUnansweredCount();

  // Determine empty state message based on active filter
  const emptyMessage =
    filter === 'unanswered'
      ? 'No hay preguntas sin responder.'
      : filter === 'answered'
        ? 'No hay preguntas respondidas.'
        : 'No hay preguntas todavía.';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Preguntas de clientes</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Gestioná las preguntas que los clientes hacen sobre los productos.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#1A1A1A] border-[#E2E2DC]'
            }
          >
            {f.label}
            {f.value === 'unanswered' &&
              unansweredCount &&
              unansweredCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#E8836B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unansweredCount}
                </span>
              )}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-md bg-[#F0F0EC]"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!questions || questions.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <p className="text-sm text-[#1A1A1A]/50">{emptyMessage}</p>
        </div>
      )}

      {/* Questions list */}
      {!isLoading && questions && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

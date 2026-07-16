/**
 * QuestionItem — Displays a single question and its answer (if available).
 *
 * Visual states:
 * - Answered: question text + customer name + answer text with "Vendedor" label
 * - Unanswered: question text + "Pendiente de respuesta" badge
 *
 * Styled consistently with the product detail page (creamy background,
 * dark text, gold/brown accents).
 */
import type { ProductQuestion } from '@mbt/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string to a relative or short display format in Spanish.
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date to a full Spanish date (for answer timestamps).
 */
function formatFullDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuestionItemProps {
  question: ProductQuestion;
}

export function QuestionItem({ question }: QuestionItemProps) {
  const isAnswered = !!question.answerText;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isAnswered
          ? 'border-[#E2E2DC] bg-white'
          : 'border-[#E2E2DC] bg-[#F0F0EC]/50',
      )}
    >
      {/* Question header: customer name + time */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[#1A1A1A]/50">
          {question.customerName ?? 'Cliente'}
        </span>
        <span className="text-xs text-[#1A1A1A]/40">
          {formatRelativeTime(question.createdAt)}
        </span>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium text-[#1A1A1A]">{question.questionText}</p>

      {/* Answer section */}
      {isAnswered && question.answerText ? (
        <div className="mt-3 rounded-md border border-[#E2E2DC] bg-[#F0F0EC]/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-[#E8836B] uppercase tracking-wide">
              Vendedor
            </span>
            {question.answeredAt && (
              <span className="text-xs text-[#1A1A1A]/40">
                {formatFullDate(question.answeredAt)}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
            {question.answerText}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            Pendiente de respuesta
          </Badge>
        </div>
      )}
    </div>
  );
}

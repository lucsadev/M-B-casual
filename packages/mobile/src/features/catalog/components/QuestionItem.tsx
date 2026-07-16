/**
 * QuestionItem — Displays a single question and its answer (if available).
 *
 * Visual states:
 * - Answered: question text + customer name + answer text with "Vendedor" label
 * - Unanswered: question text + "Pendiente de respuesta" badge
 *
 * Mirrors the web component in packages/web/src/features/catalog/components/question-item.tsx.
 * Styled to match the mobile app theme (NativeWind).
 */
import { View, Text } from 'react-native';
import type { ProductQuestion } from '@mbt/shared';

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
    <View
      className={`rounded-lg border p-4 ${
        isAnswered
          ? 'border-[#E2E2DC] bg-white'
          : 'border-[#E2E2DC] bg-[#F0F0EC]/50'
      }`}
    >
      {/* Question header: customer name + time */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-[#1A1A1A]/50">
          {question.customerName ?? 'Cliente'}
        </Text>
        <Text className="text-xs text-[#1A1A1A]/40">
          {formatRelativeTime(question.createdAt)}
        </Text>
      </View>

      {/* Question text */}
      <Text className="text-sm font-medium text-[#1A1A1A]">
        {question.questionText}
      </Text>

      {/* Answer section */}
      {isAnswered && question.answerText ? (
        <View className="mt-3 rounded-md border border-[#E2E2DC] bg-[#F0F0EC]/30 p-3">
          <View className="mb-1 flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-[#E8836B] uppercase tracking-wide">
              Vendedor
            </Text>
            {question.answeredAt && (
              <Text className="text-xs text-[#1A1A1A]/40">
                {formatFullDate(question.answeredAt)}
              </Text>
            )}
          </View>
          <Text className="text-sm leading-relaxed text-[#1A1A1A]/80">
            {question.answerText}
          </Text>
        </View>
      ) : (
        <View className="mt-2 self-start rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
          <Text className="text-xs font-medium text-amber-700">
            Pendiente de respuesta
          </Text>
        </View>
      )}
    </View>
  );
}

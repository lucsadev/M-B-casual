/**
 * Inline answer form for admin to respond to a customer question.
 *
 * - Textarea with 10-1000 character validation
 * - Submit button with loading state
 * - Cancel button to collapse the expanded question
 * - Supports editing an existing answer (pre-fills textarea)
 *
 * UI copy in Spanish (neutral/professional).
 */
import { useState } from 'react';
import { useAnswerQuestion } from '../api/use-admin-questions';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnswerFormProps {
  /** The question UUID to answer */
  questionId: string;
  /** Pre-fill the textarea with an existing answer (edit mode) */
  initialAnswer?: string;
  /** Called after a successful answer submission */
  onSuccess?: () => void;
  /** Called when the user cancels */
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnswerForm({
  questionId,
  initialAnswer = '',
  onSuccess,
  onCancel,
}: AnswerFormProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [error, setError] = useState<string | null>(null);
  const answerMutation = useAnswerQuestion();

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  function validate(): boolean {
    const trimmed = answer.trim();

    if (trimmed.length < 1) {
      setError('La respuesta no puede estar vacía');
      return false;
    }

    if (trimmed.length > 1000) {
      setError('La respuesta no puede superar los 1000 caracteres');
      return false;
    }

    setError(null);
    return true;
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await answerMutation.mutateAsync({
        questionId,
        answerText: answer.trim(),
      });
      onSuccess?.();
    } catch {
      // Error is handled by the mutation toast
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor={`answer-${questionId}`}
          className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1 block"
        >
          {initialAnswer ? 'Editar respuesta' : 'Respuesta'}
        </label>

        <textarea
          id={`answer-${questionId}`}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Escribí tu respuesta..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-[#E2E2DC] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:ring-2 focus:ring-[#E8836B]/50 resize-none"
        />

        {/* Validation error */}
        {error && (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        {/* Character count */}
        <p className="mt-1 text-xs text-[#1A1A1A]/40 text-right">
          {answer.length}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={answerMutation.isPending || answer.trim().length < 1}
          className="bg-[#1A1A1A] text-white hover:bg-[#333333] disabled:opacity-50"
        >
          {answerMutation.isPending
            ? 'Respondiendo...'
            : initialAnswer
              ? 'Actualizar respuesta'
              : 'Responder'}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

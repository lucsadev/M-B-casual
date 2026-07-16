/**
 * QuestionCard — renders a single question row/card in the admin panel.
 *
 * - Desktop: compact row inside a list
 * - Mobile: clickable card that expands full-width
 * - Clicking expands to show full question detail and answer form
 * - Status badge: "Sin responder" (secondary) or "Respondida" (success)
 *
 * The expanded area includes:
 * - Full question text
 * - Product link
 * - Customer name and date
 * - Existing answer (if any) or the AnswerForm
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductQuestion } from '@mbt/shared';
import { Badge } from '@/components/ui/badge';
import { AnswerForm } from './answer-form';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuestionCardProps {
  question: ProductQuestion;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuestionCard({ question }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-[#E2E2DC] bg-white transition-colors">
      {/* Collapsed row / header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F0F0EC] transition-colors"
      >
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#1A1A1A] truncate">
              {question.customerName ?? 'Cliente'}
            </span>
            <span className="text-xs text-[#1A1A1A]/40">·</span>
            <span className="text-xs text-[#1A1A1A]/40">
              {formatDate(question.createdAt)}
            </span>
            <span className="text-xs text-[#1A1A1A]/40">·</span>
            <span className="text-xs text-[#1A1A1A]/40 truncate max-w-[150px]">
              ID: {question.productId.slice(0, 8)}
            </span>
          </div>

          {/* Question preview */}
          <p className="text-sm text-[#1A1A1A]/80 line-clamp-2">
            {question.questionText}
          </p>
        </div>

        {/* Status badge */}
        <div className="ml-4 flex-shrink-0">
          {question.answerText ? (
            <Badge variant="success">Respondida</Badge>
          ) : (
            <Badge variant="secondary">Sin responder</Badge>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#E2E2DC] p-4 space-y-4">
          {/* Full question */}
          <div>
            <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
              Pregunta
            </p>
            <p className="text-sm text-[#1A1A1A]">{question.questionText}</p>
          </div>

          {/* Product link */}
          <div>
            <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
              Producto
            </p>
            <Link
              to={`/admin/productos/${question.productId}/editar`}
              className="text-sm text-[#E8836B] hover:underline"
            >
              Ver producto →
            </Link>
          </div>

          {/* Customer */}
          {question.customerName && (
            <div>
              <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
                Cliente
              </p>
              <p className="text-sm text-[#1A1A1A]">
                {question.customerName}
                {question.customerId && (
                  <span className="text-xs text-[#1A1A1A]/40 ml-1">
                    (registrado)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Existing answer or answer form */}
          {question.answerText ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider">
                  Respuesta
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-xs text-[#E8836B] hover:underline"
                >
                  Editar
                </button>
              </div>

              <div className="rounded-md bg-[#F0F0EC] p-3">
                <p className="text-sm text-[#1A1A1A]">{question.answerText}</p>
                {question.answeredAt && (
                  <p className="text-xs text-[#1A1A1A]/40 mt-1">
                    Respondida el {formatDate(question.answeredAt)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-2">
                Responder
              </p>
              <AnswerForm
                questionId={question.id}
                onSuccess={() => setExpanded(false)}
                onCancel={() => setExpanded(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

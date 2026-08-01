/**
 * UserQuestionsPage — /preguntas route.
 *
 * Shows the current user's product questions with their answers.
 * Links back to the product detail page for context.
 */
import { Link } from 'react-router-dom';
import { useUserQuestions } from '../api/use-user-questions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function UserQuestionsPage() {
  const { data: questions, isLoading, isError } = useUserQuestions();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/perfil" className="text-sm text-[#E8836B] hover:underline">
          ← Volver a mi perfil
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1A1A1A]">Mis Preguntas</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Todas tus preguntas y sus respuestas
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">
            No se pudieron cargar tus preguntas. Intentalo de nuevo más tarde.
          </p>
        </div>
      )}

      {/* Questions list */}
      {!isLoading && !isError && questions && (
        <>
          {questions.length === 0 ? (
            <div className="rounded-lg border border-[#E2E2DC] bg-white p-8 text-center">
              <p className="text-4xl mb-3">❓</p>
              <p className="text-lg font-medium text-[#1A1A1A] mb-2">
                No hiciste preguntas todavía
              </p>
              <p className="text-sm text-[#1A1A1A]/60 mb-6">
                Podés preguntar sobre cualquier producto desde su página de detalle.
              </p>
              <Link to="/catalogo">
                <Button className="bg-[#E8836B] text-white hover:bg-[#E8836B]/90">
                  Explorar productos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-[#E2E2DC] bg-white p-4"
                >
                  {/* Product name */}
                  {q.productName && (
                    <Link
                      to={`/producto/${q.productName?.toLowerCase().replace(/\s+/g, '-')}`}
                      className="mb-2 inline-block text-xs font-medium uppercase tracking-wide text-[#E8836B] hover:underline"
                    >
                      {q.productName}
                    </Link>
                  )}

                  {/* Question */}
                  <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                    {q.questionText}
                  </p>
                  <p className="text-xs text-[#1A1A1A]/40 mb-3">
                    {new Date(q.createdAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Answer */}
                  {q.answerText ? (
                    <div className="rounded-lg bg-[#F0F0EC] p-3 border-l-4 border-[#D4A853]">
                      <p className="text-xs font-semibold text-[#D4A853] mb-1">
                        Respuesta del vendedor
                      </p>
                      <p className="text-sm text-[#1A1A1A]">{q.answerText}</p>
                      {q.answeredAt && (
                        <p className="mt-1 text-xs text-[#1A1A1A]/40">
                          {new Date(q.answeredAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[#FFF9E6] p-3 border-l-4 border-amber-400">
                      <p className="text-xs font-medium text-amber-600">
                        Esperando respuesta
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

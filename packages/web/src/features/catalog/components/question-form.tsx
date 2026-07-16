/**
 * QuestionForm — Form to submit a new question on a product.
 *
 * Behaviour depends on auth state:
 * - Authenticated: name field hidden, name derived from user metadata
 * - Anonymous: name input required
 *
 * Client-side validation:
 * - Question: 10–500 characters
 * - Name (anonymous): 2–100 characters
 *
 * After successful submit, shows a success message and resets the form.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_QUESTION_LENGTH = 1;
const MAX_QUESTION_LENGTH = 500;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuestionFormProps {
  /** Called with the question data when the form is submitted */
  onSubmit: (data: { questionText: string; customerName?: string; sessionId?: string }) => void;
  /** Whether the mutation is currently pending */
  isPending: boolean;
  /** Error message from the mutation, if any */
  submitError?: string | null;
}

export function QuestionForm({ onSubmit, isPending, submitError }: QuestionFormProps) {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Generate a stable session ID for anonymous rate limiting
  const [sessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  });

  // Reset form after successful submission
  useEffect(() => {
    if (!isPending && !submitError && submitted) {
      setName('');
      setQuestion('');
      setCharCount(0);
      setNameError(null);
      setQuestionError(null);

      // Show success indicator briefly
      const timer = setTimeout(() => setSubmitted(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isPending, submitError, submitted]);

  // Derive display name for authenticated users
  const isAuthenticated = !!user;
  const authDisplayName = isAuthenticated
    ? (user?.user_metadata?.nombre
        ? `${user.user_metadata.nombre}${user.user_metadata.apellido ? ` ${user.user_metadata.apellido}` : ''}`
        : user?.user_metadata?.full_name ??
          user?.user_metadata?.name ??
          user?.email?.split('@')[0] ??
          '')
    : '';

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  function validate(): boolean {
    let valid = true;

    // Name validation (anonymous only)
    if (!isAuthenticated) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setNameError('El nombre es obligatorio');
        valid = false;
      } else if (trimmedName.length < MIN_NAME_LENGTH) {
        setNameError(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`);
        valid = false;
      } else if (trimmedName.length > MAX_NAME_LENGTH) {
        setNameError(`El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`);
        valid = false;
      } else {
        setNameError(null);
      }
    } else {
      setNameError(null);
    }

    // Question validation
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setQuestionError('La pregunta no puede estar vacía');
      valid = false;
    } else if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
      setQuestionError('La pregunta no puede estar vacía');
      valid = false;
    } else if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      setQuestionError(`La pregunta no puede superar los ${MAX_QUESTION_LENGTH} caracteres`);
      valid = false;
    } else {
      setQuestionError(null);
    }

    return valid;
  }

  // -----------------------------------------------------------------------
  // Submit handler
  // -----------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      questionText: question.trim(),
      customerName: isAuthenticated
        ? (authDisplayName || user?.email?.split('@')[0] || 'Cliente')
        : (name.trim() || undefined),
      sessionId: isAuthenticated ? undefined : sessionId,
    });

    setSubmitted(true);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Login prompt for guests */}
      {!isAuthenticated && (
        <p className="text-xs text-[#1A1A1A]/50">
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-[#E8836B] hover:text-[#E8836B]/80 underline-offset-2 hover:underline"
          >
            Iniciá sesión
          </Link>{' '}
          o preguntá como visitante.
        </p>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        {/* Name input (anonymous only) */}
        {!isAuthenticated && (
          <div>
            <Input
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              disabled={isPending}
              className={cn(
                'border-[#E2E2DC] bg-white text-[#1A1A1A]',
                nameError && 'border-red-400',
              )}
              aria-label="Tu nombre"
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            )}
          </div>
        )}

        {/* Textarea + char count */}
        <div>
          <Textarea
            ref={textareaRef}
            placeholder="Escribí tu pregunta..."
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setCharCount(e.target.value.length);
              if (questionError) setQuestionError(null);
            }}
            disabled={isPending}
            className={cn(
              'min-h-[80px] border-[#E2E2DC] bg-white text-[#1A1A1A] resize-y',
              questionError && 'border-red-400',
            )}
            aria-label="Tu pregunta"
            aria-invalid={!!questionError}
            maxLength={MAX_QUESTION_LENGTH}
          />
          <div className="mt-1 flex items-center justify-between">
            {questionError ? (
              <p className="text-xs text-red-500">{questionError}</p>
            ) : (
              <span />
            )}
            <span
              className={cn(
                'text-xs',
                charCount > MAX_QUESTION_LENGTH
                  ? 'text-red-500'
                  : charCount > MAX_QUESTION_LENGTH * 0.9
                    ? 'text-amber-500'
                    : 'text-[#1A1A1A]/40',
              )}
            >
              {charCount}/{MAX_QUESTION_LENGTH}
            </span>
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <p className="text-xs text-red-500">{submitError}</p>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#E8836B] text-white hover:bg-[#E8836B]/90 sm:w-auto disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Enviando...
            </span>
          ) : (
            'Preguntar'
          )}
        </Button>
      </form>

      {/* Post-submit success message */}
      {submitted && !isPending && !submitError && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">
            Pregunta enviada. Esperá la respuesta del vendedor.
          </p>
        </div>
      )}
    </div>
  );
}

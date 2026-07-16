/**
 * QuestionForm — Form to submit a new question on a product (mobile).
 *
 * Mirrors the web component in packages/web/src/features/catalog/components/question-form.tsx.
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
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../auth/context/AuthContext';

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
  const questionInputRef = useRef<TextInput>(null);

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

  function handleSubmit() {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
      <View className="gap-3">
        {/* Login prompt for guests */}
        {!isAuthenticated && (
          <Text className="text-xs text-[#1A1A1A]/50">
            ¿Ya tenés cuenta? Iniciá sesión o preguntá como visitante.
          </Text>
        )}

        <View className="gap-3">
          {/* Name input (anonymous only) */}
          {!isAuthenticated && (
            <View>
              <TextInput
                placeholder="Tu nombre"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(null);
                }}
                editable={!isPending}
                className={`h-12 rounded-md border bg-white px-3 text-sm text-[#1A1A1A] ${
                  nameError ? 'border-red-400' : 'border-[#E2E2DC]'
                }`}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Tu nombre"
              />
              {nameError && (
                <Text className="mt-1 text-xs text-red-500">{nameError}</Text>
              )}
            </View>
          )}

          {/* TextInput + char count */}
          <View>
            <TextInput
              ref={questionInputRef}
              placeholder="Escribí tu pregunta..."
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                setCharCount(text.length);
                if (questionError) setQuestionError(null);
              }}
              editable={!isPending}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={MAX_QUESTION_LENGTH}
              className={`min-h-[80px] rounded-md border bg-white px-3 py-2.5 text-sm text-[#1A1A1A] leading-relaxed ${
                questionError ? 'border-red-400' : 'border-[#E2E2DC]'
              }`}
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Tu pregunta"
            />
            <View className="mt-1 flex-row items-center justify-between">
              {questionError ? (
                <Text className="text-xs text-red-500">{questionError}</Text>
              ) : (
                <View />
              )}
              <Text
                className={`text-xs ${
                  charCount > MAX_QUESTION_LENGTH
                    ? 'text-red-500'
                    : charCount > MAX_QUESTION_LENGTH * 0.9
                      ? 'text-amber-500'
                      : 'text-[#1A1A1A]/40'
                }`}
              >
                {charCount}/{MAX_QUESTION_LENGTH}
              </Text>
            </View>
          </View>

          {/* Submit error */}
          {submitError && (
            <Text className="text-xs text-red-500">{submitError}</Text>
          )}

          {/* Submit button */}
          <TouchableOpacity
            disabled={isPending}
            onPress={handleSubmit}
            className={`w-full flex-row items-center justify-center gap-2 rounded-md py-3 ${
              isPending ? 'bg-neutral-300' : 'bg-[#E8836B] active:bg-[#E8836B]/80'
            }`}
            accessibilityLabel="Preguntar"
            accessibilityRole="button"
          >
            {isPending && (
              <ActivityIndicator size="small" color="#FFFFFF" />
            )}
            <Text className="text-base font-semibold text-white">
              {isPending ? 'Enviando...' : 'Preguntar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Post-submit success message */}
        {submitted && !isPending && !submitError && (
          <View className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <Text className="text-sm font-medium text-emerald-800">
              Pregunta enviada. Esperá la respuesta del vendedor.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAnswerQuestion } from '../api/use-admin-questions';

interface AnswerFormProps {
  questionId: string;
  initialAnswer?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AnswerForm({
  questionId,
  initialAnswer = '',
  onSuccess,
  onCancel,
}: AnswerFormProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [error, setError] = useState<string | null>(null);
  const answerMutation = useAnswerQuestion();

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

  async function handleSubmit() {
    if (!validate()) return;

    try {
      await answerMutation.mutateAsync({
        questionId,
        answerText: answer.trim(),
      });
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <View className="gap-3">
      <View>
        <Text className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
          {initialAnswer ? 'Editar respuesta' : 'Respuesta'}
        </Text>

        <TextInput
          value={answer}
          onChangeText={(text) => {
            setAnswer(text);
            if (error) setError(null);
          }}
          placeholder="Escribí tu respuesta..."
          multiline
          numberOfLines={3}
          maxLength={1000}
          className="w-full rounded-md border border-[#E2E2DC] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {error && (
          <Text className="mt-1 text-xs text-red-500">{error}</Text>
        )}

        <Text className="mt-1 text-xs text-[#1A1A1A]/40 text-right">
          {answer.length}/1000
        </Text>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={answerMutation.isPending || answer.trim().length < 1}
          className={`flex-1 py-2.5 rounded-md items-center ${
            answerMutation.isPending || answer.trim().length < 1
              ? 'bg-neutral-300'
              : 'bg-[#1A1A1A]'
          }`}
        >
          {answerMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-medium text-sm">
              {initialAnswer ? 'Actualizar respuesta' : 'Responder'}
            </Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            className="px-4 py-2.5 rounded-md border border-[#E2E2DC]"
          >
            <Text className="text-sm text-[#1A1A1A]">Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

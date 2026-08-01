import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ProductQuestion } from '@mbt/shared';
import { AnswerForm } from './AnswerForm';

interface AdminQuestionCardProps {
  question: ProductQuestion;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminQuestionCard({ question }: AdminQuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="rounded-md border border-[#E2E2DC] bg-white overflow-hidden">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="p-4 active:bg-[#F0F0EC]"
      >
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-sm font-medium text-[#1A1A1A] flex-1" numberOfLines={1}>
            {question.customerName ?? 'Cliente'}
          </Text>
          <Text className="text-xs text-[#1A1A1A]/40">
            {formatDate(question.createdAt)}
          </Text>
        </View>

        <Text className="text-sm text-[#1A1A1A]/80 mb-2" numberOfLines={2}>
          {question.questionText}
        </Text>

        <View className="flex-row items-center gap-2">
          <View
            className={`px-2 py-0.5 rounded-full ${
              question.answerText ? 'bg-emerald-100' : 'bg-neutral-100'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                question.answerText ? 'text-emerald-700' : 'text-neutral-600'
              }`}
            >
              {question.answerText ? 'Respondida' : 'Sin responder'}
            </Text>
          </View>
          <Text className="text-xs text-[#1A1A1A]/40">
            ID: {question.productId.slice(0, 8)}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="border-t border-[#E2E2DC] p-4 gap-4">
          <View>
            <Text className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
              Pregunta
            </Text>
            <Text className="text-sm text-[#1A1A1A]">{question.questionText}</Text>
          </View>

          {question.customerName && (
            <View>
              <Text className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
                Cliente
              </Text>
              <Text className="text-sm text-[#1A1A1A]">
                {question.customerName}
                {question.customerId && (
                  <Text className="text-xs text-[#1A1A1A]/40"> (registrado)</Text>
                )}
              </Text>
            </View>
          )}

          {question.answerText ? (
            <View>
              <Text className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-1">
                Respuesta
              </Text>
              <View className="rounded-md bg-[#F0F0EC] p-3">
                <Text className="text-sm text-[#1A1A1A]">{question.answerText}</Text>
                {question.answeredAt && (
                  <Text className="text-xs text-[#1A1A1A]/40 mt-1">
                    Respondida el {formatDate(question.answeredAt)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-2">
                Responder
              </Text>
              <AnswerForm
                questionId={question.id}
                onSuccess={() => setExpanded(false)}
                onCancel={() => setExpanded(false)}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

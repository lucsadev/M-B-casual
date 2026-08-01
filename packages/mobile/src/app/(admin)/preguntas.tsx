import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { QuestionsFilter } from '@mbt/shared';
import {
  useAdminQuestions,
  useUnansweredCount,
} from '../../features/admin/api/use-admin-questions';
import { AdminQuestionCard } from '../../features/admin/components/AdminQuestionCard';

const FILTERS: { value: QuestionsFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'unanswered', label: 'Sin responder' },
  { value: 'answered', label: 'Respondidas' },
];

export default function AdminQuestionsScreen() {
  const [filter, setFilter] = useState<QuestionsFilter>('all');
  const { data: questions, isLoading } = useAdminQuestions(filter);
  const { data: unansweredCount } = useUnansweredCount();

  const emptyMessage =
    filter === 'unanswered'
      ? 'No hay preguntas sin responder.'
      : filter === 'answered'
        ? 'No hay preguntas respondidas.'
        : 'No hay preguntas todavía.';

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
    >
      <View className="px-4 mb-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Preguntas de clientes</Text>
        <Text className="mt-1 text-sm text-[#1A1A1A]/60">
          Gestioná las preguntas que los clientes hacen sobre los productos.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full ${
              filter === f.value ? 'bg-[#1A1A1A]' : 'bg-white border border-[#E2E2DC]'
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-sm font-medium ${
                  filter === f.value ? 'text-white' : 'text-[#1A1A1A]'
                }`}
              >
                {f.label}
              </Text>
              {f.value === 'unanswered' &&
                unansweredCount !== undefined &&
                unansweredCount > 0 && (
                  <View className="bg-red-500 px-1.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-white">
                      {unansweredCount}
                    </Text>
                  </View>
                )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="h-20 rounded-md bg-[#F0F0EC]"
            />
          ))}
        </View>
      )}

      {!isLoading && (!questions || questions.length === 0) && (
        <View className="mx-4 items-center justify-center rounded-md border border-dashed border-[#E2E2DC] py-16">
          <Text className="text-sm text-[#1A1A1A]/50">{emptyMessage}</Text>
        </View>
      )}

      {!isLoading && questions && questions.length > 0 && (
        <View className="px-4 gap-3">
          {questions.map((q) => (
            <AdminQuestionCard key={q.id} question={q} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

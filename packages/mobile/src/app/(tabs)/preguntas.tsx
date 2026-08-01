/**
 * Mis Preguntas route — shows the user's product questions with answers.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUserQuestions } from '../../features/customers/api/use-user-questions';

export default function UserQuestionsRoute() {
  const { data: questions, isLoading, isError } = useUserQuestions();

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Mis Preguntas' }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#D4A853" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-600 text-sm text-center">
            No se pudieron cargar tus preguntas.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-[#D4A853] text-sm font-medium">Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={questions ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">❓</Text>
              <Text className="text-base font-semibold text-[#1A1A1A] mb-2">
                No hiciste preguntas todavía
              </Text>
              <Text className="text-sm text-[#1A1A1A]/60 text-center mb-6">
                Podés preguntar sobre cualquier producto desde su página de detalle.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/catalogo')}
                className="bg-[#D4A853] px-6 py-2.5 rounded-md"
              >
                <Text className="text-white font-medium text-sm">
                  Explorar productos
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item: q }) => (
            <View className="rounded-lg border border-[#E8E4D9] bg-white p-4 mb-4">
              {/* Product name */}
              {(q as any).productName && (
                <Text className="text-xs font-semibold uppercase tracking-wide text-[#E8836B] mb-2">
                  {(q as any).productName}
                </Text>
              )}

              {/* Question */}
              <Text className="text-sm font-medium text-[#1A1A1A] mb-1">
                {q.questionText}
              </Text>
              <Text className="text-xs text-[#1A1A1A]/40 mb-3">
                {new Date(q.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              {/* Answer */}
              {q.answerText ? (
                <View className="rounded-lg bg-[#F0F0EC] p-3 border-l-4 border-[#D4A853]">
                  <Text className="text-xs font-semibold text-[#D4A853] mb-1">
                    Respuesta del vendedor
                  </Text>
                  <Text className="text-sm text-[#1A1A1A]">{q.answerText}</Text>
                  {q.answeredAt && (
                    <Text className="mt-1 text-xs text-[#1A1A1A]/40">
                      {new Date(q.answeredAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              ) : (
                <View className="rounded-lg bg-amber-50 p-3 border-l-4 border-amber-400">
                  <Text className="text-xs font-medium text-amber-600">
                    Esperando respuesta
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

/**
 * ProductQuestionsSheet — Bottom sheet / modal for product Q&A on mobile.
 *
 * Displays:
 * - "Preguntas y respuestas" header with close button
 * - Scrollable list of answered questions (newest first)
 * - Empty state when no questions exist
 * - Loading state while fetching
 * - Error state on fetch failure
 * - Ask form at the bottom (collapsed behind the list)
 *
 * Uses React Native Modal (no external bottom-sheet dependency required).
 * Styled to match the mobile app theme.
 */
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProductQuestions, useCreateQuestion } from '../hooks/use-product-questions';
import { QuestionItem } from './QuestionItem';
import { QuestionForm } from './QuestionForm';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.85;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProductQuestionsSheetProps {
  /** Product UUID to fetch questions for */
  productId: string;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

export function ProductQuestionsSheet({
  productId,
  visible,
  onClose,
}: ProductQuestionsSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const {
    data: questions,
    isLoading,
    isError,
    error,
  } = useProductQuestions(productId);

  const {
    mutate: createQuestion,
    isPending: isSubmitting,
    error: submitError,
  } = useCreateQuestion(productId);

  // Animate slide-up when visible changes
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  // Track keyboard state
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="absolute inset-0 bg-black/40" />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0"
        style={{ maxHeight: SHEET_MAX_HEIGHT }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            className="bg-white rounded-t-2xl"
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SHEET_MAX_HEIGHT, 0],
                  }),
                },
              ],
              paddingBottom: keyboardVisible ? 16 : insets.bottom + 16,
            }}
          >
            {/* Handle bar */}
            <View className="items-center py-3">
              <View className="h-1 w-10 rounded-full bg-[#D4A853]/30" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pb-3">
              <Text className="text-lg font-bold text-[#1A1A1A] uppercase tracking-wide">
                Preguntas y respuestas
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#F0F0EC]"
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
              >
                <Text className="text-sm font-bold text-[#1A1A1A]">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Loading state */}
              {isLoading && (
                <View className="gap-3">
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className="rounded-lg border border-[#E2E2DC] bg-white p-4"
                    >
                      <View className="mb-2 h-3 w-24 rounded bg-[#E8E4D9]" />
                      <View className="mb-1 h-4 w-full rounded bg-[#E8E4D9]" />
                      <View className="h-4 w-3/4 rounded bg-[#E8E4D9]" />
                    </View>
                  ))}
                </View>
              )}

              {/* Error state */}
              {isError && !isLoading && (
                <View className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <Text className="text-sm text-red-700">
                    {error?.message ?? 'Error al cargar las preguntas. Intentalo de nuevo más tarde.'}
                  </Text>
                </View>
              )}

              {/* Question list */}
              {!isLoading && !isError && questions && questions.length > 0 && (
                <View className="mb-6 gap-3">
                  {questions.map((q) => (
                    <QuestionItem key={q.id} question={q} />
                  ))}
                </View>
              )}

              {/* Empty state */}
              {!isLoading && !isError && questions && questions.length === 0 && (
                <View className="mb-6 items-center rounded-lg border border-dashed border-[#E2E2DC] bg-[#F0F0EC]/30 p-6">
                  <Text className="text-center text-sm text-[#1A1A1A]/60">
                    Todavía no hay preguntas. ¡Sé el primero en preguntar!
                  </Text>
                </View>
              )}

              {/* Ask form */}
              <View className="border-t border-[#E2E2DC]/50 pt-4">
                <Text className="mb-3 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                  Hacé tu pregunta
                </Text>
                <QuestionForm
                  onSubmit={(data) => createQuestion(data)}
                  isPending={isSubmitting}
                  submitError={submitError?.message}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

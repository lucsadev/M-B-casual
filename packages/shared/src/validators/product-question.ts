import { z } from 'zod';

/**
 * Schema for creating a new product question.
 * questionText must be 1-500 characters.
 * customerName is required when the user is anonymous.
 */
export const createQuestionSchema = z.object({
  productId: z.string().uuid(),
  questionText: z
    .string()
    .min(1, 'La pregunta no puede estar vacía')
    .max(500, 'La pregunta no puede superar los 500 caracteres'),
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  sessionId: z.string().optional(),
});

/**
 * Schema for answering a product question (admin only).
 * answerText must be 1-1000 characters.
 */
export const answerQuestionSchema = z.object({
  questionId: z.string().uuid(),
  answerText: z
    .string()
    .min(1, 'La respuesta no puede estar vacía')
    .max(1000, 'La respuesta no puede superar los 1000 caracteres'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type AnswerInput = z.infer<typeof answerQuestionSchema>;

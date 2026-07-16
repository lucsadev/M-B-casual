/**
 * ProductQuestion represents a question and optional answer on a product.
 * Maps to the `product_questions` table in Supabase.
 */
export interface ProductQuestion {
  /** UUID primary key */
  id: string;
  /** Foreign key to `products.id` */
  productId: string;
  /** Foreign key to `customers.id` (null for anonymous questions) */
  customerId?: string;
  /** Display name for anonymous questions; required when customerId is null */
  customerName?: string;
  /** The question text (minimum 1 character) */
  questionText: string;
  /** The admin's answer (null until answered) */
  answerText?: string;
  /** Foreign key to `auth.users.id` of the admin who answered */
  answeredBy?: string;
  /** ISO timestamp of when the question was answered */
  answeredAt?: string;
  /** Whether the question is visible to the public (admin toggle) */
  isVisible: boolean;
  /** Anonymous session identifier for rate limiting */
  sessionId?: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Input for creating a new question.
 */
export interface CreateQuestionInput {
  /** Product to ask about */
  productId: string;
  /** The question text (1-500 characters) */
  questionText: string;
  /** Display name for anonymous users; omit if authenticated */
  customerName?: string;
  /** Anonymous session identifier for rate limiting */
  sessionId?: string;
}

/**
 * Input for answering a question (admin only).
 */
export interface AnswerInput {
  /** Question to answer */
  questionId: string;
  /** The answer text (1-1000 characters) */
  answerText: string;
}

/**
 * Filter options for the admin questions list.
 */
export type QuestionsFilter = 'all' | 'unanswered' | 'answered';

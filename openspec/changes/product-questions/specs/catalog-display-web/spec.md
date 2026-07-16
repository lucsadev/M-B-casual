# Delta for Catalog Display Web

## ADDED Requirements

### Requirement: Q&A section on product detail

The product detail page MUST render a Q&A section below the add-to-cart area. The section SHALL display the heading "Preguntas y Respuestas" and contain: a list of answered questions and an ask form.

#### Scenario: Q&A section renders on product detail

- GIVEN a visitor on `/producto/:slug`
- WHEN scrolling past the add-to-cart area
- THEN a "Preguntas y Respuestas" section is visible

### Requirement: Question list

The questions list SHALL display answered questions ordered by `created_at DESC`. Each item SHALL show: customer name, question text, answer text, and relative timestamp.

#### Scenario: Answered questions are displayed

- GIVEN a product with 3 answered questions
- WHEN viewing the Q&A section
- THEN all 3 answered questions are shown, newest first

#### Scenario: Empty state for no questions

- GIVEN a product with zero questions
- WHEN viewing the Q&A section
- THEN the empty state reads "Todavía no hay preguntas. ¡Sé el primero en preguntar!"

#### Scenario: Loading state

- GIVEN the questions query is in-flight
- WHEN the Q&A section renders
- THEN a skeleton placeholder is shown (3 gray bars mimicking question cards)

### Requirement: Ask question form

The form SHALL include a `<textarea>` (min 10 chars, max 500 chars) with a "Preguntar" submit button. Authenticated users SHALL NOT be asked for their name (pre-filled from `customer.name`). Anonymous users SHALL see a "Tu nombre" input before the textarea. After submission, the form SHALL reset and the new question SHALL appear in the list.

#### Scenario: Authenticated user asks question

- GIVEN an authenticated user on product detail
- WHEN they type a 50-character question and click "Preguntar"
- THEN the question is inserted, the form resets, and their question appears (unanswered)

#### Scenario: Anonymous user asks question with name

- GIVEN an anonymous visitor
- WHEN they enter "Carlos" in the name field and a 50-character question
- THEN the question is inserted with `customer_name = 'Carlos'`

#### Scenario: Question below minimum length is rejected client-side

- GIVEN a user trying to submit "Hola"
- WHEN they click "Preguntar"
- THEN the form shows "La pregunta debe tener al menos 10 caracteres" AND no insert is attempted

#### Scenario: Guest sees login prompt instead of form

- GIVEN an unauthenticated visitor
- WHEN the Q&A section is visible
- THEN a message "Iniciá sesión para preguntar" with a login link is shown above the form (they can still see the form to type as anonymous)

### Requirement: Data fetching

Questions SHALL be fetched via TanStack Query with `useProductQuestions(productId)` and `useAskQuestion(productId)` mutation. The mutation SHALL invalidate the questions query on success.

#### Scenario: New question appears without page reload

- GIVEN a user who just submitted a question
- WHEN the mutation succeeds and invalidates the query
- THEN the question list updates to show the new question

## Acceptance Criteria

- [ ] Q&A section renders below add-to-cart on product detail
- [ ] Answered questions list sorted newest first
- [ ] Empty state with correct Spanish text
- [ ] Loading state with skeleton
- [ ] Auth-aware ask form (pre-filled name for logged in, name field for anonymous)
- [ ] Client-side validation (10-500 chars)
- [ ] Mutation invalidates query on success

## Dependencies

- `product-questions` — underlying DB schema and types
- `shared-package` — `QuestionInput`, `ProductQuestion` types

# Delta for Mobile Catalog

## ADDED Requirements

### Requirement: Q&A bottom sheet

The product detail screen MUST render a "Preguntas y respuestas" section at the bottom. On mobile, this SHALL be implemented as a bottom sheet (or expandable section) containing: a scrollable list of answered questions and an ask input area.

#### Scenario: Open Q&A bottom sheet

- GIVEN a user on the product detail screen
- WHEN they scroll to the bottom
- THEN a "Preguntas y respuestas" section is visible, expandable as a bottom sheet

### Requirement: Question list

The list SHALL display answered questions ordered by `created_at DESC`. Each item SHALL show: customer name, question text, answer text, and relative timestamp.

#### Scenario: Answered questions displayed in sheet

- GIVEN a product with 2 answered questions
- WHEN the user opens the Q&A bottom sheet
- THEN both questions appear, newest first, with question and answer clearly distinguished

#### Scenario: Empty state

- GIVEN a product with no questions
- WHEN opening the Q&A sheet
- THEN the text "Todavía no hay preguntas. ¡Sé el primero en preguntar!" is shown

### Requirement: Ask question form

The bottom sheet SHALL include a text input with placeholder "Escribí tu pregunta..." (min 10 chars, max 500) and a "Preguntar" submit button. Authenticated users SHALL see only the question input. Anonymous users SHALL see an additional "Tu nombre" input.

#### Scenario: Authenticated user asks on mobile

- GIVEN an authenticated user on the Q&A sheet
- WHEN they type a valid question and tap "Preguntar"
- THEN the question is inserted, the input clears, and the question appears in the list

#### Scenario: Anonymous user asks on mobile

- GIVEN an anonymous user on the Q&A sheet
- WHEN they enter "María" as name, type a valid question, and tap "Preguntar"
- THEN the question is inserted with `customer_name = 'María'`

#### Scenario: Validation prevents short question

- GIVEN a user typing "Corto"
- WHEN they tap "Preguntar"
- THEN the validation error "Mínimo 10 caracteres" is shown below the input

### Requirement: Data fetching

Questions SHALL be fetched via TanStack Query with `useProductQuestions(productId)`. The mutation `useAskQuestion(productId)` SHALL invalidate the query on success.

#### Scenario: New question appears immediately

- GIVEN a user submitted a question via the mutation
- WHEN the mutation succeeds and the query is invalidated
- THEN the new question appears in the list without manual refresh

## Acceptance Criteria

- [ ] Bottom sheet "Preguntas y respuestas" opens from product detail
- [ ] Answered questions listed newest first with Q&A distinction
- [ ] Empty state text in Spanish
- [ ] Auth-aware form: name input for anonymous, none for authenticated
- [ ] Client-side validation (min 10 chars)
- [ ] Mutation invalidates query on success

## Dependencies

- `product-questions` — underlying DB schema
- `shared-package` — `QuestionInput`, `ProductQuestion` types

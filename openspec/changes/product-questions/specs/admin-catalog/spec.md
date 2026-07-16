# Delta for Admin Catalog

## ADDED Requirements

### Requirement: Admin questions page

The admin panel MUST add a route at `/admin/preguntas` that renders a questions management view. The page SHALL display a filter bar (todos / sin responder / respondidos) and a list of questions ordered by `created_at DESC`.

#### Scenario: Navigate to questions page

- GIVEN an authenticated admin
- WHEN navigating to `/admin/preguntas`
- THEN the page shows a list of all questions, newest first

#### Scenario: Filter by unanswered

- GIVEN the admin has 5 answered and 3 unanswered questions
- WHEN they select the "Sin responder" filter
- THEN only the 3 unanswered questions are displayed

#### Scenario: Empty filter result

- GIVEN no unanswered questions exist
- WHEN the "Sin responder" filter is active
- THEN an empty state "No hay preguntas sin responder" is shown

### Requirement: Answer form

Each unanswered question SHALL render an inline answer form with a `<textarea>` (max 1000 chars) and a "Responder" button. On submission, the answer SHALL be persisted, the UI SHALL update to show the answer, and the unanswered count SHALL decrement.

#### Scenario: Admin answers a question

- GIVEN an unanswered question displayed to an admin
- WHEN they type an answer and click "Responder"
- THEN `answer_text`, `answered_by`, and `answered_at` are set AND the question moves to the "responded" state in the UI

#### Scenario: Answer validation

- GIVEN an admin typing a 2-character answer
- WHEN they click "Responder"
- THEN the form shows "La respuesta debe tener al menos 10 caracteres" AND no update is sent

### Requirement: Realtime unanswered badge

The admin navigation SHALL display a badge next to "Preguntas" with the count of unanswered questions. This count SHALL update in realtime via Supabase Realtime subscription.

#### Scenario: Badge shows correct count on load

- GIVEN 3 unanswered questions exist
- WHEN the admin loads the page
- THEN the badge reads "3"

#### Scenario: Badge increments on new question

- GIVEN an admin on the admin panel
- WHEN a customer submits a new question
- THEN the badge count increments by 1 without page reload

#### Scenario: Badge decrements on answer

- GIVEN the badge shows "3"
- WHEN the admin answers one of those questions
- THEN the badge decrements to "2"

### Requirement: Responsive layout

The questions page MUST work on desktop (table layout with columns: customer, product, question, status, actions) and mobile (single-column card layout).

#### Scenario: Desktop layout

- GIVEN an admin on a screen > 1024px
- WHEN viewing `/admin/preguntas`
- THEN questions render in a table with columns

#### Scenario: Mobile layout

- GIVEN an admin on a screen < 640px
- WHEN viewing `/admin/preguntas`
- THEN questions render as cards with stacked fields

## Acceptance Criteria

- [ ] `/admin/preguntas` route loads with full question list
- [ ] Filters (todos / sin responder / respondidos) work
- [ ] Inline answer form updates question and UI
- [ ] Realtime badge updates on new questions and answers
- [ ] Responsive: table on desktop, cards on mobile

## Dependencies

- `product-questions` — underlying DB schema
- `database-schema` — Realtime publication for live updates

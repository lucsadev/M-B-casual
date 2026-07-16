# Product Questions Specification

## Purpose

Public Q&A per product — customers ask questions, admins answer, and all visitors see answered questions. Reduces support load and increases purchase confidence.

## Requirements

### Requirement: Schema

The system MUST provide a `product_questions` table with: `id` (uuid PK, default gen_random_uuid()), `product_id` (uuid FK → products.id ON DELETE CASCADE, NOT NULL), `customer_id` (nullable uuid FK → customers.id), `customer_name` (text, nullable — required when customer_id is NULL), `question_text` (text, NOT NULL, min 10 chars enforce at DB level), `answer_text` (nullable text), `answered_by` (nullable uuid FK → auth.users), `answered_at` (nullable timestamptz), `is_visible` (boolean, default true — for admin hide), `session_id` (text, nullable — for anonymous rate limiting), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()).

#### Scenario: Full schema applied

- GIVEN a fresh migration
- WHEN `\d product_questions` is inspected
- THEN all columns are present with correct types and constraints

#### Scenario: Product deletion cascades questions

- GIVEN a product with 3 questions
- WHEN the product is deleted
- THEN all related `product_questions` rows are deleted

### Requirement: RLS policies

The table MUST enforce RLS with three policies: (1) SELECT — anyone MAY read rows WHERE `answer_text IS NOT NULL`; authenticated users MAY additionally read their own unanswered rows (`customer_id = auth.uid()`). (2) INSERT — anyone MAY insert; if `customer_id` is NULL, `customer_name` MUST be provided. (3) UPDATE — only admin users (role = 'admin') MAY update `answer_text`, `answered_by`, `answered_at`, and `is_visible`.

#### Scenario: Visitor sees only answered questions

- GIVEN a product with 2 answered and 1 unanswered question
- WHEN a visitor (unauthenticated) queries `product_questions` for that product
- THEN only the 2 answered rows are returned

#### Scenario: Authenticated user sees own unanswered

- GIVEN an authenticated customer who asked 1 unanswered question
- WHEN they query `product_questions` filtered by `customer_id = auth.uid()`
- THEN their unanswered question is included in the result set

#### Scenario: Anonymous insert requires name

- GIVEN an anonymous visitor
- WHEN inserting a question with `customer_name = NULL`
- THEN RLS rejects the insert

#### Scenario: Admin can answer any question

- GIVEN an admin user
- WHEN updating `answer_text` on any question
- THEN the update succeeds

#### Scenario: Non-admin cannot answer

- GIVEN a regular authenticated user
- WHEN attempting to update `answer_text`
- THEN RLS rejects with permission denied

### Requirement: Rate limiting

The system MUST enforce a maximum of 3 questions per hour per session. Anonymous requests SHALL use `session_id` for rate tracking; authenticated requests SHALL use `customer_id`.

#### Scenario: Rate limit blocks excess inserts

- GIVEN a session that inserted 3 questions in the last hour
- WHEN a 4th insert is attempted from the same session
- THEN the insert is rejected

#### Scenario: Rate limit resets after one hour

- GIVEN a session with 3 questions, the oldest being 61 minutes ago
- WHEN a new insert is attempted
- THEN the insert succeeds

### Requirement: Indexes

The migration MUST create indexes on `(product_id, created_at DESC)` for listing queries, and `(session_id, created_at)` for rate-limit lookups.

#### Scenario: Question list uses index

- GIVEN the composite index on `(product_id, created_at DESC)`
- WHEN querying `SELECT * FROM product_questions WHERE product_id = ? ORDER BY created_at DESC`
- THEN `EXPLAIN ANALYZE` shows an Index Scan

### Requirement: Realtime publication

The table MUST be added to the Supabase Realtime publication so admins receive live notifications of new questions.

#### Scenario: New question triggers realtime event

- GIVEN an admin subscribed to the `product_questions` channel
- WHEN a new question is inserted
- THEN a Realtime broadcast event is sent with the new row payload

## Acceptance Criteria

- [ ] Migration creates `product_questions` with all columns and constraints
- [ ] RLS: visitors see answered only; users see own unanswered; admin can answer
- [ ] Rate limit blocks >3/hour/session
- [ ] Indexes cover the two query patterns
- [ ] Realtime broadcasts new questions

## Dependencies

- `database-schema` — underlying migration and RLS
- `shared-package` — `ProductQuestion`, `QuestionInput`, `AnswerInput` types

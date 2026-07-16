# Delta for Database Schema

## ADDED Requirements

### Requirement: Product questions migration

A new migration `00014_product_questions.sql` MUST create the `product_questions` table with the schema defined in the product-questions spec. The migration SHALL also create indexes, RLS policies, and add the table to the Realtime publication.

#### Scenario: Migration applies cleanly

- GIVEN a Supabase project at migration 00013
- WHEN migration 00014 runs
- THEN it completes without errors

#### Scenario: Rolling back the migration

- GIVEN a Supabase project where migration 00014 was applied
- WHEN `supabase migration repair --status reverted 00014` is executed and the file is deleted
- THEN the `product_questions` table no longer exists

### Requirement: RLS policies SQL

The migration MUST include SQL for three RLS policies: `select_answered_questions` (anyone WHERE answer_text IS NOT NULL), `select_own_unanswered` (authenticated WHERE customer_id = auth.uid()), `insert_questions` (anyone, with name requirement), `update_answers_admin` (admin-only update).

#### Scenario: RLS policies exist

- GIVEN the migration has been applied
- WHEN querying `SELECT * FROM pg_policies WHERE tablename = 'product_questions'`
- THEN exactly 4 policies are returned

### Requirement: Realtime enablement

The migration MUST execute `ALTER PUBLICATION supabase_realtime ADD TABLE product_questions;`.

#### Scenario: Table is in realtime publication

- GIVEN the migration has been applied
- WHEN checking `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_questions'`
- THEN one row is returned

## Acceptance Criteria

- [ ] Migration 00014 applies and rolls back cleanly
- [ ] All 4 RLS policies registered on `product_questions`
- [ ] Table is in the Realtime publication
- [ ] Indexes exist: `(product_id, created_at DESC)` and `(session_id, created_at)`

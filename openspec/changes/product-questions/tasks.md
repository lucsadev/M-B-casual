# Tasks: Product Q&A (Preguntas al Vendedor)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 (4 slices) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | Slice 1 (DB) → Slice 2 (Web) → Slice 3 (Admin) → Slice 4 (Mobile) |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Est. Lines |
|------|------|-----------|------|------------|
| 1 | DB schema + shared types | PR#1 | `feat/product-questions` | ~200 |
| 2 | Web frontend Q&A | PR#2 | `feat/product-questions/1-db-shared` | ~250 |
| 3 | Admin panel + realtime | PR#3 | `feat/product-questions/2-web-qa` | ~230 |
| 4 | Mobile Q&A | PR#4 | `feat/product-questions/3-admin` | ~220 |

---

## Slice 1 → PR#1: Database + Shared Types

**Branch**: `feat/product-questions/1-db-shared`

- [x] **1.1** Create `supabase/migrations/00014_product_questions.sql` — table, indexes, rate-limit function, RLS policies, realtime publication, grants
- [x] **1.2** Enable Realtime for `product_questions` via `alter publication supabase_realtime add table product_questions`
- [ ] **1.3** Apply migration & verify: `supabase db reset` + check `\d product_questions`, `pg_policies`, rate-limit function
- [x] **1.4** Create `packages/shared/src/types/product-question.ts` — `ProductQuestion` interface, `CreateQuestionInput`, `AnswerInput` types + `QuestionsFilter`
- [x] **1.5** Modify `packages/shared/src/types/index.ts` — export new types
- [x] **1.6** Create `packages/shared/src/validators/product-question.ts` — Zod schemas with min 10/max 500 for question (ES errors), min 1/max 1000 for answer
- [x] **1.7** Modify `packages/shared/src/validators/index.ts` — export new validators
- [x] **1.8** Update `packages/web/src/lib/database.types.ts` with `product_questions` Row/Insert/Update types

## Slice 2 → PR#2: Web Frontend Q&A

**Branch**: `feat/product-questions/2-web-qa` (base: `feat/product-questions/1-db-shared`)

- [ ] **2.1** Add `getProductQuestions(productId)` + `createQuestion(input)` query functions in `packages/web/src/features/catalog/api/queries.ts`
- [ ] **2.2** Create `packages/web/src/features/catalog/hooks/use-product-questions.ts` — `useProductQuestions(productId)`, `useAskQuestion()` mutation with query invalidation
- [ ] **2.3** Create `packages/web/src/features/catalog/components/question-item.tsx` — display customer name, question, answer, relative timestamp
- [ ] **2.4** Create `packages/web/src/features/catalog/components/ask-question-form.tsx` — textarea (10-500 chars), name input (anon only), submit button, client-side validation, success/error states
- [ ] **2.5** Create `packages/web/src/features/catalog/components/product-questions.tsx` — Q&A section with heading, `QuestionList` (answered sorted newest), `AskQuestionForm`, loading skeleton, empty state ("Todavía no hay preguntas..."), login prompt for guests
- [ ] **2.6** Modify `packages/web/src/features/catalog/pages/product-detail-page.tsx` — import and render `<ProductQuestions productId={product.id} />` below add-to-cart area
- [ ] **2.7** Modify `packages/web/src/features/catalog/index.ts` — export new hooks and components

## Slice 3 → PR#3: Admin Panel + Realtime

**Branch**: `feat/product-questions/3-admin` (base: `feat/product-questions/2-web-qa`)

- [ ] **3.1** Create `packages/web/src/features/admin/questions/api/use-admin-questions.ts` — `useAdminQuestions(filters)`, `useAnswerQuestion()` mutation, `useUnansweredCount()` with realtime subscription
- [ ] **3.2** Create `packages/web/src/features/admin/questions/components/answer-form.tsx` — inline textarea (10-1000 chars), "Responder" button, validation, loading state
- [ ] **3.3** Create `packages/web/src/features/admin/questions/components/question-card.tsx` — table row (desktop) / card (mobile) with customer info, product, question, status, answer form
- [ ] **3.4** Create `packages/web/src/features/admin/questions/pages/QuestionsPage.tsx` — filter bar (todos/sin responder/respondidos), question list, empty state, responsive layout
- [ ] **3.5** Create `packages/web/src/features/admin/questions/components/QuestionsNavBadge.tsx` — realtime badge for unanswered count, subscribes to `product_questions` INSERT channel
- [ ] **3.6** Modify `packages/web/src/app/router.tsx` — add `/admin/preguntas` route pointing to `<QuestionsPage />` under AdminLayout
- [ ] **3.7** Modify `packages/web/src/app/layouts/admin-layout.tsx` — add "Preguntas" nav item with `<QuestionsNavBadge />` to `NAV_ITEMS` and `ROUTE_LABELS`

## Slice 4 → PR#4: Mobile Q&A

**Branch**: `feat/product-questions/4-mobile` (base: `feat/product-questions/3-admin`)

- [ ] **4.1** Add `getProductQuestions(productId)` + `createQuestion(input)` query functions in `packages/mobile/src/features/catalog/api/queries.ts`
- [ ] **4.2** Create `packages/mobile/src/features/catalog/hooks/use-product-questions.ts` — `useProductQuestions(productId)`, `useAskQuestion()` mutation with query invalidation
- [ ] **4.3** Create `packages/mobile/src/features/catalog/components/question-item.tsx` — question + answer display, customer name, relative time
- [ ] **4.4** Create `packages/mobile/src/features/catalog/components/ask-question-form.tsx` — text input (10-500 chars), name input (anon only), "Preguntar" button, validation
- [ ] **4.5** Create `packages/mobile/src/features/catalog/components/ProductQuestionsSheet.tsx` — bottom sheet with question list + ask form, loading/empty/error states, "Preguntas y respuestas" header
- [ ] **4.6** Integrate into mobile product detail screen — add `<ProductQuestionsSheet />` at bottom of product detail view
- [ ] **4.7** Modify `packages/mobile/src/features/catalog/index.ts` — export new hooks and components

---

## Risks

- Migration number `00014` may conflict if other migrations were added. Verify latest migration before creating file.
- Realtime badge requires the admin sidebar to support dynamic content insertion — `QuestionsNavBadge` may need a React context or portal pattern if `NAV_ITEMS` is static.
- Mobile bottom sheet depends on whether the project uses `@gorhom/bottom-sheet` or a custom implementation — confirm before starting Slice 4.
- Anonymous rate limiting relies on `session_id` generated client-side — if `crypto.randomUUID()` is unavailable in the target runtime, use a timestamp-based fallback.

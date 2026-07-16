# Proposal: Product Q&A (Preguntas al Vendedor)

## Intent

Customers cannot ask about products before buying — they leave the site or guess. This adds Mercado Libre-style Q&A so customers ask publicly, sellers answer once, and every future buyer benefits. Reduces support load and increases purchase confidence.

## Scope

### In Scope
- DB schema + RLS for `product_questions` table
- Shared TypeScript types and validators
- Web: Q&A section on product detail page (ask + view all)
- Admin: questions management panel with realtime notifications
- Mobile: Q&A section on product detail screen
- Public visibility for answered questions; authenticated/anonymous asking

### Out of Scope
- Stars/ratings system (deferred)
- Question moderation queue (auto-publish with admin hide/delete)
- Email notifications for answers
- Multi-language support for questions

## Capabilities

### New Capabilities
- `product-questions`: Public Q&A per product — ask, list, answer, realtime admin notification

### Modified Capabilities
- `database-schema`: Add `product_questions` table, indexes, RLS policies
- `catalog-display-web`: Add Q&A section to product detail page
- `admin-catalog`: Add questions management view with answer form + realtime badge
- `mobile-catalog`: Add Q&A section to product detail screen

## Approach

1. **DB**: `product_questions` table with `customer_name` for anonymous, `customer_id` FK for authenticated. RLS: anyone reads answered + own unanswered; anyone inserts (anon requires name); admin-only update answer. Realtime publication for live admin updates. Rate limit via RLS (max 3/hour per session_id or IP).
2. **Shared**: Zod schema for question input (min 10 chars, max 500). Types: `ProductQuestion`, `QuestionInput`, `AnswerInput`.
3. **Web**: TanStack Query `useProductQuestions(productId)` + `useAskQuestion` mutation. Section below product description. Login prompt for guests, name field for anonymous.
4. **Admin**: `useAdminQuestions` query with `is:unanswered` filter. Realtime subscription for new questions badge. Inline answer form per question.
5. **Mobile**: Same data flow via TanStack Query. Section at bottom of product detail screen.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/00014_product_questions.sql` | New | Migration for table, RLS, realtime |
| `packages/shared/src/types/product-questions.ts` | New | Types + Zod schemas |
| `packages/shared/src/types/index.ts` | Modified | Export new types |
| `packages/web/src/features/catalog/pages/product-detail-page.tsx` | Modified | Add Q&A section |
| `packages/web/src/features/catalog/api/queries.ts` | Modified | Add question queries/mutations |
| `packages/web/src/features/admin/` | Modified | Add questions route + panel |
| `packages/mobile/src/features/catalog/` | Modified | Add Q&A section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Spam / anonymous abuse | High | Rate limit (3/hour/session). RLS blocks excess inserts. |
| Real-time cost at scale | Low | Only admin subscribes; one channel per project. |
| Admin overwhelmed by questions | Medium | Badge count + unanswered sort. Future: auto-responder. |
| Anonymous name spoofing | Low | Acceptable — no auth required. Showing "Anónimo" prefix optional. |

## Milestones / Slices

1. **Slice 1** — DB + shared types: migration, RLS, realtime, types, validators (~150 lines)
2. **Slice 2** — Web frontend: Q&A on product detail, ask form, question list (~200 lines)
3. **Slice 3** — Admin panel: questions view, answer form, realtime badge (~250 lines)
4. **Slice 4** — Mobile: Q&A on product detail screen (~150 lines)

Each slice is independently verifiable and deployable without breaking existing features.

## Rollback

1. **Revert migration**: `supabase migration repair --status reverted 00014_product_questions` + delete file
2. **Remove admin route**: Delete routes and components, remove from nav
3. **Revert frontend**: Git revert commits for web and mobile Q&A sections
4. **All slices revertible independently** — no cross-slice coupling

## Success Criteria

- [ ] Customer can ask question (auth + anonymous) from product detail
- [ ] Answered questions visible to all visitors on product detail
- [ ] Admin receives realtime badge when new question arrives
- [ ] Admin can write and publish an answer inline
- [ ] Rate limit blocks > 3 questions/hour from same session
- [ ] All unchanged existing specs still pass

-- =============================================================
-- M&B Trend — Product Q&A RLS fixes
-- Migration: 00015_fix_product_questions_rls.sql
-- Description: Fixes RLS policies so admin can read all questions
--              and authenticated users can see their own unanswered.
-- =============================================================

-- Fix 1: Drop the broken policy that compares customer_id to auth.uid()
-- customer_id references customers.id, NOT auth.users.id.
drop policy if exists "Users can read own unanswered questions"
  on product_questions;

-- Recreate with correct subquery: customers.id → customers.user_id → auth.uid()
create policy "Users can read own unanswered questions"
  on product_questions for select
  using (
    answer_text is null
    and customer_id in (
      select id from customers where user_id = auth.uid()
    )
  );

-- Fix 2: Add SELECT policy so admin can see ALL questions (answered + unanswered)
-- Without this, admins only see answered questions (Policy 1) or their own (Policy 2).
create policy "Admin can read all questions"
  on product_questions for select
  using (is_admin());

-- =============================================================
-- M&B Trend — Product Q&A
-- Migration: 00014_product_questions.sql
-- Description: product_questions table, RLS, rate limiting,
--              indexes, and realtime publication
-- =============================================================

-- 1. PRODUCT QUESTIONS TABLE
create table product_questions (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  customer_name text,
  question_text text not null check (char_length(question_text) >= 10),
  answer_text   text,
  answered_by   uuid references auth.users(id) on delete set null,
  answered_at   timestamptz,
  is_visible    boolean not null default true,
  session_id    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_customer_name_required
    check (customer_id is not null or (customer_name is not null and customer_name <> ''))
);

comment on table product_questions is 'Public Q&A per product — customers ask, admins answer';
comment on column product_questions.customer_name is 'Display name for anonymous questions; required when customer_id is null';
comment on column product_questions.session_id is 'Anonymous session identifier for rate limiting';
comment on column product_questions.is_visible is 'Admin toggle to hide inappropriate questions';

-- 2. TRIGGER: auto-update updated_at
create trigger trg_product_questions_updated_at
  before update on product_questions
  for each row
  execute function set_updated_at();

-- 3. INDEXES
create index idx_pq_product_created on product_questions (product_id, created_at desc);
create index idx_pq_session_rate on product_questions (session_id, created_at);
create index idx_pq_customer_rate on product_questions (customer_id, created_at);

-- 4. RATE LIMIT — disabled in RLS, implemented at application layer
-- Application should check max 3 questions/hour before calling insert.

-- 5. RLS
alter table product_questions enable row level security;

-- Policy 1: Anyone can read answered and visible questions
create policy "Anyone can read answered questions"
  on product_questions for select
  using (answer_text is not null and is_visible = true);

-- Policy 2: Authenticated users can read their own unanswered questions
create policy "Users can read own unanswered questions"
  on product_questions for select
  using (customer_id = auth.uid() and answer_text is null);

-- Policy 3: Anyone can insert (name required for anonymous)
create policy "Anyone can insert questions"
  on product_questions for insert
  with check (
    (customer_id is not null or (customer_name is not null and customer_name <> ''))
    and product_id is not null
  );

-- Policy 4: Admin can update answers and visibility
create policy "Admin can answer questions"
  on product_questions for update
  using (is_admin())
  with check (is_admin());

-- 6. REALTIME PUBLICATION
alter publication supabase_realtime add table product_questions;

-- 7. GRANTS
grant select on product_questions to anon, authenticated;
grant insert on product_questions to anon, authenticated;
grant update on product_questions to authenticated;

-- =============================================================
-- M&B Trend — Loosen question_text minimum length
-- Migration: 00016_loosen_question_text_check.sql
-- Description: Changes question_text check from >= 10 to >= 1
-- =============================================================

alter table product_questions
  drop constraint if exists product_questions_question_text_check;

alter table product_questions
  add constraint product_questions_question_text_check
  check (char_length(question_text) >= 1);

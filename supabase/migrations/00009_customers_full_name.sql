-- =============================================================
-- M&B Casual — Customers full_name generated column
-- Migration: 00009_customers_full_name.sql
-- Adds a stored full_name column (first + last) so orders can be
-- searched by the customer's complete name, not just fragments.
-- =============================================================

alter table customers
  add column if not exists full_name text
  generated always as (
    trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
  ) stored;

comment on column customers.full_name is
  'Stored first_name + last_name for name search (e.g. "Lucía Gómez")';

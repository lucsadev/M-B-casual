# Supabase Auth Specification

## Purpose

Configure Supabase Auth with email/password, link `customers` table to `auth.users`, and define base RLS policies for admin vs customer roles.

## Requirements

### Requirement: Email/password authentication

Supabase Auth MUST enable the email/password provider. The sign-up flow MUST create a user in `auth.users` and automatically insert a corresponding row in `customers`.

#### Scenario: User registration creates auth user and customer

- GIVEN a new user submits email + password + first_name
- WHEN `supabase.auth.signUp()` succeeds
- THEN a row exists in `auth.users` AND a linked row in `customers` with the same `user_id`

#### Scenario: Duplicate email registration fails

- GIVEN an existing user with email `test@example.com`
- WHEN a second registration with the same email is attempted
- THEN the API returns an error indicating email already registered

### Requirement: Customer creation trigger

A database trigger on `auth.users` AFTER INSERT MUST create a `customers` row with the new `user_id` and empty profile fields.

#### Scenario: Trigger fires on auth insert

- GIVEN a new row inserted into `auth.users`
- WHEN the AFTER INSERT trigger executes
- THEN a corresponding `customers` row is created within the same transaction

### Requirement: Base RLS policies

Tables MUST have RLS enabled with these policies: `products` — SELECT for everyone, all for admin; `orders` — customers see own, admin sees all; `cash_movements` — admin only.

#### Scenario: Customer cannot see admin data

- GIVEN a non-admin authenticated user
- WHEN querying `cash_movements`
- THEN the result is empty (RLS blocks access)

#### Scenario: Admin sees all orders

- GIVEN a user with JWT claiming `role = 'admin'`
- WHEN querying `orders`
- THEN ALL orders are returned, regardless of `customer_id`

## Acceptance Criteria

- [ ] Email/password sign-up creates auth user + customer row
- [ ] RLS policies prevent customer from accessing other customers' orders
- [ ] Admin user can access all tables

## Dependencies

- `database-schema` — `customers` table must exist before trigger

# Auth UI Web — Specification

## Purpose

Provide login and registration forms for web customers with Zod validation and Supabase Auth error handling. All forms SHALL use shared schemas from `@mbt/shared`.

## Requirements

### Requirement: Login form at /login

The system MUST render a login form with email and password fields at `/login`. Validation SHALL use Zod schemas. On success, the user SHALL be redirected to the page they came from or `/perfil`.

#### Scenario: Successful login redirects to previous page

- GIVEN a user with valid credentials
- WHEN submitting email and password on `/login`
- THEN `supabase.auth.signInWithPassword()` succeeds
- AND the user is redirected to the stored referrer URL, or `/perfil` if none

#### Scenario: Invalid credentials show inline error

- GIVEN the login form
- WHEN submitting wrong email or password
- THEN an inline error "Email o contraseña incorrectos" is displayed
- AND the password field keeps its value

#### Scenario: Invalid email format blocked by Zod

- GIVEN the login form
- WHEN typing an invalid email and submitting
- THEN Zod validation shows "Email inválido"
- AND the form is NOT submitted

### Requirement: Registration form at /register

The system MUST render a registration form at `/register` with fields: first_name, last_name, email, phone, password. All fields SHALL be validated with Zod.

#### Scenario: Successful registration creates account

- GIVEN a new user fills all required fields validly
- WHEN submitting registration
- THEN `supabase.auth.signUp()` creates the auth user
- AND the `handle_new_user` trigger inserts a `customers` row
- AND the user is redirected to `/perfil`

#### Scenario: Duplicate email shows specific error

- GIVEN an email already registered
- WHEN submitting registration with that email
- THEN the form shows "Este email ya está registrado"
- AND no auth user is created

#### Scenario: Short password blocked by Zod

- GIVEN the registration form
- WHEN typing a password under 6 characters
- THEN Zod validation shows "La contraseña debe tener al menos 6 caracteres"
- AND the form is NOT submitted

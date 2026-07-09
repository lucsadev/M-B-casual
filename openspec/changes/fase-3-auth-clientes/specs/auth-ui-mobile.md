# Auth UI Mobile — Specification

## Purpose

Provide login and registration screens for the mobile app (Expo Router) with the same shared Zod validation and error handling as the web client. Session persistence SHALL use Supabase's built-in SecureStore storage.

## Requirements

### Requirement: LoginScreen at /auth/login

The mobile app MUST render a LoginScreen at `/auth/login` with email and password fields. Validation SHALL use shared Zod schemas. On success, the app SHALL navigate to `/profile`.

#### Scenario: Successful login navigates to profile

- GIVEN a user with valid credentials
- WHEN submitting login on LoginScreen
- THEN `supabase.auth.signInWithPassword()` succeeds
- AND the app navigates to `/profile`
- AND the bottom tab bar updates to show authenticated state

#### Scenario: Invalid credentials show error inline

- GIVEN the LoginScreen
- WHEN submitting wrong credentials
- THEN a red inline error "Email o contraseña incorrectos" appears
- AND the user stays on LoginScreen

#### Scenario: Empty field blocked by Zod before API call

- GIVEN the LoginScreen with empty email
- WHEN tapping "Iniciar sesión"
- THEN Zod validation shows "El email es requerido"
- AND `supabase.auth.signInWithPassword()` is NOT called

### Requirement: RegisterScreen at /auth/register

The RegisterScreen SHALL collect first_name, last_name, email, phone, and password. On success, the app SHALL navigate to `/profile`.

#### Scenario: Successful registration

- GIVEN a new user with valid data
- WHEN submitting registration
- THEN `supabase.auth.signUp()` creates the auth user
- AND the app navigates to `/profile`

#### Scenario: Network error during registration

- GIVEN no internet connection
- WHEN submitting the form
- THEN an error "Error de conexión. Intenta de nuevo." is shown
- AND the form fields retain their values for retry

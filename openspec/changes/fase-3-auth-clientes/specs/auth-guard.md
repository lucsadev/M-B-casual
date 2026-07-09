# Auth Guard — Specification

## Purpose

Protect authenticated-only routes (`/checkout`, `/perfil`/`/profile`) and redirect authenticated users away from guest-only routes (`/login`, `/register`). Handle loading state while session is being resolved.

## Requirements

### Requirement: Protected routes require authentication

The system MUST redirect unauthenticated users to `/login` (web) or `/auth/login` (mobile) when accessing `/checkout`, `/perfil` (web), or `/profile` (mobile). The original URL SHALL be saved for post-login redirect.

#### Scenario: Anonymous user redirected to login

- GIVEN a user without a valid session
- WHEN navigating to `/checkout`
- THEN the user is redirected to `/login`
- AND the original path (`/checkout`) is stored as redirect target
- AND after successful login, the user is redirected back to `/checkout`

#### Scenario: Loading spinner during session check

- GIVEN the app initializing
- WHEN before session state is resolved by Supabase Auth
- THEN a loading spinner or skeleton is displayed
- AND no redirect occurs until the session promise settles

### Requirement: Guest routes redirect authenticated users

The system MUST redirect authenticated users away from `/login` and `/register` (web) or `/auth/login` and `/auth/register` (mobile) to the home page.

#### Scenario: Authenticated user visits /login

- GIVEN an authenticated user
- WHEN navigating to `/login`
- THEN the user is immediately redirected to `/`
- AND the login form is never rendered

### Requirement: Auth state drives navigation UI

The header (web) and bottom tab bar (mobile) SHALL adapt based on auth state: show a profile icon when authenticated, a login icon when anonymous.

#### Scenario: Mobile bottom tab switches between Ingresar / Perfil

- GIVEN a mobile user
- WHEN the user is authenticated
- THEN the bottom tab shows "Perfil"
- WHEN the user signs out
- THEN the bottom tab shows "Ingresar"

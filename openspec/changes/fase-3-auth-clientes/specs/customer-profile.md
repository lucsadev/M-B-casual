# Customer Profile — Specification

## Purpose

Allow authenticated customers to view and edit personal data (first_name, last_name, phone) and browse their order history with status tracking.

## Requirements

### Requirement: Profile page displays personal data

The system MUST display the customer's first_name, last_name, email (read-only), and phone at `/perfil` (web) and `/profile` (mobile). Data SHALL be fetched from `customers` via TanStack Query.

#### Scenario: Profile loads authenticated user's data

- GIVEN an authenticated user
- WHEN navigating to `/perfil`
- THEN the customer's first_name, last_name, email, and phone are displayed
- AND the email field is read-only

#### Scenario: Edit and save profile fields

- GIVEN the profile page with pre-filled data
- WHEN editing first_name and clicking "Guardar"
- THEN a TanStack Query mutation updates the `customers` row
- AND a success toast "Datos actualizados" appears
- AND the displayed name updates immediately

#### Scenario: Empty required field blocked on save

- GIVEN the profile page with empty first_name
- WHEN clicking "Guardar"
- THEN Zod validation shows "El nombre es requerido"
- AND the mutation is NOT sent

### Requirement: Order history section

The profile page MUST include a "Mis órdenes" section listing the user's orders sorted by most recent. Each order SHALL show status, total, date, and link to detail.

#### Scenario: Orders display with status badge

- GIVEN an authenticated user with past orders
- WHEN viewing "Mis órdenes"
- THEN each order row shows: order ID, date, formatted total, and a colored status badge
- AND orders are sorted newest first

#### Scenario: Empty order history shows CTA

- GIVEN a new user with no orders
- WHEN viewing "Mis órdenes"
- THEN a message "Todavía no tenés órdenes" is shown
- AND a CTA button "Explorar productos" links to the catalog

### Requirement: Logout

The profile MUST include a "Cerrar sesión" button.

#### Scenario: Logout clears session and redirects home

- GIVEN an authenticated user on `/perfil`
- WHEN clicking "Cerrar sesión"
- THEN `supabase.auth.signOut()` clears the session
- AND the user is redirected to the home page
- AND protected routes become inaccessible

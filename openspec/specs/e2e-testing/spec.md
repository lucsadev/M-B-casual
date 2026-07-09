# E2E Testing Specification

## Purpose

End-to-end tests for three critical user flows using Playwright (web): catalog browsing, checkout, auth profile, and admin dashboard.

## Requirements

### Requirement: Catalog to checkout flow

The E2E suite MUST cover the full happy path: browse catalog → filter by category → view product → add to cart → proceed to checkout. The test SHALL assert each step's UI state.

#### Scenario: Complete purchase flow

- GIVEN a visitor on the home page
- WHEN they navigate to catalog, filter by "Mujer", click a product, select a variant, add to cart, and proceed to checkout
- THEN the checkout page shows the selected product with correct price AND the total is calculated

#### Scenario: Empty cart checkout blocked

- GIVEN a visitor with an empty cart
- WHEN they navigate to `/checkout`
- THEN they are redirected to `/carrito` with a "Your cart is empty" message

### Requirement: Auth profile and order history

The E2E suite MUST test: login → view profile → view order history. It SHALL use test credentials.

#### Scenario: View order history after login

- GIVEN a registered user with at least one order
- WHEN they log in, navigate to "My profile", and click "My orders"
- THEN the order list shows the existing order with status and total

#### Scenario: Login with wrong credentials

- GIVEN the login page
- WHEN submitting invalid email/password
- THEN an error message "Invalid credentials" is displayed AND the user is NOT redirected

### Requirement: Admin dashboard flow

The E2E suite MUST test: admin login → dashboard → clients list → client detail. Admin credentials SHALL be stored as CI secrets or `.env` vars.

#### Scenario: Admin views client detail

- GIVEN an admin user logged in
- WHEN navigating to Admin → Clientes and clicking a client row
- THEN the client detail page shows the client's name, contact info, and order history

#### Scenario: Non-admin blocked from /admin

- GIVEN a regular authenticated user (cliente role)
- WHEN navigating to `/admin`
- THEN the page shows "Access denied" or redirects to home

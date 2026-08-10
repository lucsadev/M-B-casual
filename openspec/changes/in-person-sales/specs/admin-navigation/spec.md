# Delta for Admin Navigation

## ADDED Requirements

### Requirement: In-person sales navigation item

The admin sidebar MUST include a navigation item labeled "Ventas Presencial" that routes to `/admin/ventas-presencial`. The item MUST appear after "Catálogo" and before any existing items.

#### Scenario: Admin navigates to in-person sales

- GIVEN an authenticated admin on any admin page
- WHEN they click "Ventas Presencial" in the sidebar
- THEN they are routed to `/admin/ventas-presencial` AND the page loads the in-person sales interface

#### Scenario: Navigation item highlights active page

- GIVEN an admin on `/admin/ventas-presencial`
- WHEN viewing the sidebar
- THEN "Ventas Presencial" is visually highlighted as active

### Requirement: Route configuration

The router MUST include a route for `/admin/ventas-presencial` that renders the InPersonSalesPage component. The route MUST be protected by admin authentication.

#### Scenario: Route accessible to admin

- GIVEN an authenticated admin user
- WHEN navigating to `/admin/ventas-presencial`
- THEN the InPersonSalesPage renders

#### Scenario: Route blocked for non-admin

- GIVEN a non-admin user or unauthenticated visitor
- WHEN navigating to `/admin/ventas-presencial`
- THEN they are redirected to login or 404

### Requirement: Page title and breadcrumb

The in-person sales page MUST display a page title "Ventas Presencial" and include breadcrumb navigation showing "Admin > Ventas Presencial".

#### Scenario: Page displays title

- GIVEN an admin on the in-person sales page
- WHEN the page loads
- THEN the title "Ventas Presencial" is visible at the top

## Acceptance Criteria

- [ ] Sidebar includes "Ventas Presencial" navigation item
- [ ] Navigation routes to `/admin/ventas-presencial`
- [ ] Route protected by admin authentication
- [ ] Active state highlights current page
- [ ] Page title and breadcrumb display correctly

## Dependencies

- `supabase-auth` — admin role check for route protection
- `packages/web/src/layouts/admin-layout.tsx` — sidebar navigation
- `packages/web/src/router.tsx` — route configuration

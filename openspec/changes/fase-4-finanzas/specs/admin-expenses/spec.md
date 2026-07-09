# Admin Expenses Specification

## Purpose

Admin panel for registering and managing operational expenses (alquiler, servicios, sueldos, marketing, logística, otros) with category and date filters.

## Requirements

### Requirement: Expense creation with validation

Admins MUST create expenses with description (required), amount (> 0), and category. Optional fields: expense_date (defaults today), receipt_url.

#### Scenario: Create expense with all fields

- GIVEN an authenticated admin on the /admin/gastos page
- WHEN they submit description "Alquiler local", amount 150000, category "alquiler", date "2026-07-01"
- THEN the expense is saved to `expenses` table AND a success toast is shown

#### Scenario: Create expense with zero amount fails

- GIVEN an authenticated admin on the /admin/gastos page
- WHEN they submit amount 0
- THEN the form SHALL reject with "El monto debe ser mayor a 0" AND no row is inserted

#### Scenario: Create expense without description fails

- GIVEN an authenticated admin on the /admin/gastos page
- WHEN they submit an empty description
- THEN the form SHALL reject with "La descripción es obligatoria" AND no row is inserted

### Requirement: Expense listing with filters

Admins MUST list expenses with pagination, filterable by category (exact match) and date range. Results SHALL be ordered by expense_date descending.

#### Scenario: List expenses filtered by category

- GIVEN expenses exist for categories "marketing" and "logística"
- WHEN the admin selects category filter "marketing"
- THEN only marketing expenses are displayed

#### Scenario: List expenses filtered by date range

- GIVEN expenses on July 1 and July 15
- WHEN the admin sets date range July 1–July 10
- THEN only the July 1 expense appears

### Requirement: Expense update and delete

Admins MUST edit any expense field and delete expenses. Deletion MUST cascade to `cash_movements` if a movement exists for the expense.

#### Scenario: Update expense category

- GIVEN an existing expense with category "marketing"
- WHEN the admin changes category to "publicidad"
- THEN the expense row is updated AND the cash movement description is updated

#### Scenario: Delete expense

- GIVEN an existing expense with receipt_url
- WHEN the admin clicks delete and confirms
- THEN the expense row is removed AND the corresponding cash movement is removed

### Requirement: Restricted access

Only authenticated users with admin role SHALL access expenses CRUD.

#### Scenario: Non-admin cannot access expenses

- GIVEN an authenticated customer user
- WHEN they call `GET /rest/v1/expenses`
- THEN the API returns 401/403 via RLS
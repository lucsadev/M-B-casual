# In-Person Customers Specification

## Purpose

Manage walk-in customers who are not registered in the e-commerce platform. Tracks name, contact info, and balance for partial payment scenarios.

## Requirements

### Requirement: Customer CRUD operations

Admins MUST create, read, update, and soft-delete in-person customers. Each customer SHALL have a name (required) and optional phone, email, address, notes, and balance fields.

#### Scenario: Create customer with all fields

- GIVEN an authenticated admin on the in-person sales page
- WHEN they create a customer with name "María García", phone "1234567890", email "maria@email.com", address "Calle 123"
- THEN the customer is persisted to `in_person_customers` AND `balance = 0`, `is_active = true`

#### Scenario: Create customer with name only

- GIVEN an admin creating a walk-in customer
- WHEN they enter only the name "Cliente Mostrador"
- THEN the customer is saved with all optional fields NULL

#### Scenario: Update customer preserves balance

- GIVEN a customer with `balance = 1500`
- WHEN the admin updates the customer's phone number
- THEN the balance remains 1500 unchanged

#### Scenario: Soft delete customer

- GIVEN a customer with existing sales history
- WHEN the admin deactivates the customer (`is_active = false`)
- THEN the customer no longer appears in active customer lists AND historical sales remain accessible

### Requirement: Customer search

Admins MUST search in-person customers by name (case-insensitive partial match) and phone (exact or partial match). Search results SHALL be ordered by most recent first.

#### Scenario: Search by name returns matches

- GIVEN customers named "María García", "María López", "Juan Pérez"
- WHEN the admin searches "maría"
- THEN "María García" and "María López" are returned

#### Scenario: Search by phone returns exact match

- GIVEN a customer with phone "1234567890"
- WHEN the admin searches "123456"
- THEN the customer is returned

### Requirement: Balance tracking

The `balance` field MUST track accumulated unpaid amounts from partial payments. Balance SHALL be read-only via the UI — it updates automatically through the sales flow, not via direct customer edit.

#### Scenario: Balance increases on partial payment

- GIVEN a customer with `balance = 0`
- WHEN a sale is created with `total = 5000`, `amount_paid = 3000`, and the customer selected
- THEN the customer's `balance` becomes 2000

#### Scenario: Balance decreases when used for payment

- GIVEN a customer with `balance = 2000`
- WHEN a sale is created with `balance_used = 2000`
- THEN the customer's `balance` becomes 0

#### Scenario: Balance cannot go negative

- GIVEN a customer with `balance = 500`
- WHEN attempting to create a sale with `balance_used = 1000`
- THEN the system rejects with error "Saldo insuficiente. Saldo disponible: $500"

### Requirement: Validation rules

Customer name MUST be 1-200 characters. Phone MUST match optional pattern (digits, spaces, hyphens). Email MUST be valid email format if provided. Address MUST be max 500 characters. Notes MUST be max 1000 characters.

#### Scenario: Name validation enforces length

- GIVEN an admin entering a customer name
- WHEN the name is empty or exceeds 200 characters
- THEN validation fails with "El nombre es requerido (máx. 200 caracteres)"

#### Scenario: Email validation rejects invalid format

- GIVEN an admin entering customer email "not-an-email"
- WHEN the form is submitted
- THEN validation fails with "Email inválido"

### Requirement: Customer list display

The customer list MUST display: name, phone, balance, and last sale date. Balance MUST be highlighted (green for zero/negative, red for positive debt).

#### Scenario: Customer list shows balance indicator

- GIVEN a customer with `balance = 1500` (owes money)
- WHEN viewing the customer list
- THEN the balance shows in red with "$1,500" label

#### Scenario: Customer list shows zero balance

- GIVEN a customer with `balance = 0`
- WHEN viewing the customer list
- THEN the balance shows in green with "Sin saldo" label

## Acceptance Criteria

- [ ] Admin creates in-person customer with required and optional fields
- [ ] Customer search by name and phone works
- [ ] Balance updates automatically through sales (not editable directly)
- [ ] Soft delete hides customer from active lists
- [ ] Validation rules enforced on all fields
- [ ] Balance visual indicator distinguishes debt from clear accounts

## Dependencies

- `database-schema` — `in_person_customers` table with RLS
- `supabase-auth` — admin role for RLS
- `shared-package` — InPersonCustomer type and Zod validator

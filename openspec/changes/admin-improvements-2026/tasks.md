# Tasks: Admin Improvements 2026

## Task 1: Expense Date Bug Fix (Priority — Highest Value)

### 1.1 Fix expense_date mapping in queries.ts
- File: `packages/web/src/features/finance/api/queries.ts`
- In `getExpenses()`: map raw Supabase rows to camelCase Expense fields before returning
- In `getExpenseById()`: apply same mapping
- Map: `expense_date` → `expenseDate`, `receipt_url` → `receiptUrl`, `created_by` → `createdBy`, `created_at` → `createdAt`

## Task 2: Numeric Input Improvements

### 2.1 Add global CSS to hide number input spinners
- File: `packages/web/src/index.css`
- Add webkit and moz rules to hide spinner buttons

### 2.2 Remove value="0" defaults from numeric inputs
Files to update (remove `value={state}` where state init is `0`, use `""` or conditional):
- `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx` (6 inputs)
- `packages/web/src/features/admin/products/components/ProductForm.tsx` (2 inputs)
- `packages/web/src/features/admin/products/components/VariantManager.tsx` (2 inputs)
- `packages/web/src/features/admin/shipping/pages/ShippingSettingsPage.tsx` (2 inputs)
- `packages/web/src/features/admin/configuracion/pages/configuracion-page.tsx` (2 inputs)
- `packages/web/src/features/finance/pages/expenses-page.tsx` (1 input)
- `packages/web/src/features/finance/pages/purchases-page.tsx` (2 inputs)
- `packages/web/src/app/pages/expenses-admin.tsx` (1 input)
- `packages/web/src/app/pages/purchases-admin.tsx` (2 inputs)

## Task 3: Edit/Delete In-Person Customers

### 3.1 Add updateCustomer function
- File: `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx`
- Add `updateCustomer(input)` function similar to `createCustomer` but using `.update()`

### 3.2 Add deleteCustomer function with FK check
- File: `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx`
- Add `deleteCustomer(id)` that first checks for existing sales, blocks if sales exist

### 3.3 Add EditCustomerDialog component
- Mirror CreateCustomerDialog but pre-fill with existing data
- Same fields: name (required), phone, email, address, notes

### 3.4 Add DeleteCustomerDialog component
- Confirmation dialog showing customer name
- Warning if balance > 0
- Block deletion message if sales exist

### 3.5 Add edit/delete buttons to customer table row
- Add Edit (pencil) and Delete (trash) icon buttons
- Use e.stopPropagation() to prevent row click
- Place next to existing Cobrar/Info buttons

### 3.6 Wire up state and dialog triggers
- Add state for editing/deleting customer
- Connect buttons to open dialogs
- Refresh customer list after edit/delete

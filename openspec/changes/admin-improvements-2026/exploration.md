# Exploration: Admin Improvements 2026

Three targeted improvements to the M&B Trend admin web app.

---

## Task 1: Edit/Delete In-Person Sales Customers

### Current State

The customer list at `/admin/ventas-presencial` (`InPersonSalesPage.tsx`, 1792 lines) shows a table with columns: Nombre, Teléfono, Email, Dirección, Saldo, Creado. Each row has:

- **HandCoins (Cobrar)** button — only visible when `balance > 0`
- **Eye (Info)** button — opens `CustomerInfoDialog` (read-only view)

Clicking the row opens `CustomerMovementsDialog` (sales + payment history).

**Existing dialogs:**
- `CreateCustomerDialog` — creates new customers (name, phone, email, address, notes)
- `CustomerInfoDialog` — read-only info + Movimientos/Cobrar deuda buttons
- `CollectPaymentDialog` — records debt payments
- `CustomerMovementsDialog` — timeline of sales and payments

**No edit or delete functionality exists.** No `updateCustomer` or `deleteCustomer` functions.

### Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx` | Modified | Add EditCustomerDialog, DeleteCustomerDialog, Edit/Delete buttons in customer table row |
| Database: `in_person_customers` table | Read-only | Has `name`, `phone`, `email`, `address`, `notes`, `balance` columns |
| RLS policies | Read-only | Admin-only access already in place |

### Approach

**Add edit and delete directly in InPersonSalesPage.tsx** (same file, same patterns):

1. **EditCustomerDialog** — similar to `CreateCustomerDialog` but pre-filled with existing data. Calls `supabase.from('in_person_customers').update(...)`.
2. **DeleteCustomerDialog** — confirmation dialog (name + warning about balance if > 0). Calls `supabase.from('in_person_customers').delete(...)`.
3. **Customer table row** — add Edit (pencil) and Delete (trash) icon buttons next to existing Cobrar/Info buttons. Use `e.stopPropagation()` to prevent row click.

### Risks

- Deleting a customer with existing sales → sales reference `customer_id` FK. Need to decide: block deletion if sales exist, or allow with `SET NULL` on FK.
- The `in_person_sales` table has `customer_id UUID REFERENCES in_person_customers(id)` — no ON DELETE clause visible in the current schema, so deletion would fail if sales exist.

---

## Task 2: Remove Default "0" and Spinner from All Numeric Inputs

### Current State

**20 `type="number"` inputs** across the web app:

| File | Lines | Count |
|------|-------|-------|
| `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx` | 794, 1394, 1406, 1452, 1471, 1487 | 6 |
| `packages/web/src/features/admin/products/components/ProductForm.tsx` | 271, 287 | 2 |
| `packages/web/src/features/admin/products/components/VariantManager.tsx` | 58, 72 | 2 |
| `packages/web/src/features/admin/shipping/pages/ShippingSettingsPage.tsx` | 87, 105 | 2 |
| `packages/web/src/features/admin/configuracion/pages/configuracion-page.tsx` | 88, 106 | 2 |
| `packages/web/src/features/finance/pages/expenses-page.tsx` | 400 | 1 |
| `packages/web/src/features/finance/pages/purchases-page.tsx` | 608, 622 | 2 |
| `packages/web/src/app/pages/expenses-admin.tsx` | 239 | 1 |
| `packages/web/src/app/pages/purchases-admin.tsx` | 532, 548 | 2 |

### Approach

**Two-pronged approach:**

1. **CSS: Hide spinners globally** — Add a Tailwind utility or global CSS rule:
   ```css
   input[type="number"]::-webkit-inner-spin-button,
   input[type="number"]::-webkit-outer-spin-button {
     -webkit-appearance: none;
     margin: 0;
   }
   input[type="number"] { -moz-appearance: textfield; }
   ```
   This can go in `packages/web/src/index.css` or `tailwind.css`.

2. **Remove `value="0"` defaults** — For each input, ensure `value` starts as empty string `""` instead of `0`. Check each file for:
   - `value={someState}` where state initializes to `0` → change initial state to `""` or use `value={someState || ""}`
   - `onChange` handlers that parse with `parseFloat(e.target.value) || 0` → keep the `|| 0` for calculations but ensure the input displays empty when cleared

### Files to Modify

All 9 files listed above, plus `packages/web/src/index.css` (or equivalent global CSS file).

### Risks

- Low risk — cosmetic change only. Calculations that depend on `parseFloat(value) || 0` already handle empty strings.
- Need to verify no `min="0"` attributes conflict with empty values.

---

## Task 3: Fix Expense Date Not Saving

### Current State — THE BUG

**Two expense pages exist:**

1. **`packages/web/src/features/finance/pages/expenses-page.tsx`** — newer, with date range filters, edit, and delete
2. **`packages/web/src/app/pages/expenses-admin.tsx`** — older, simpler, create-only

**Root cause in `expenses-page.tsx`:**

The `Expense` type (shared) uses **camelCase**: `expenseDate`
The Supabase `expenses` table uses **snake_case**: `expense_date`

The `getExpenses` function in `packages/web/src/features/finance/api/queries.ts` returns raw Supabase data cast as `Expense[]`:
```typescript
return (data ?? []) as unknown as Expense[];
```

This means `expense.expenseDate` is **always `undefined`** because the raw data has `expense_date`, not `expenseDate`.

**Impact in expenses-page.tsx:**
- Line 171: `openEdit` sets `expenseDate: expense.expenseDate` → **undefined**, so the date field opens empty
- Line 329: `{formatDate(expense.expenseDate)}` → shows "Invalid Date" in the table
- Line 196: When saving, `expenseDate` is undefined → update doesn't include the date field

**The `expenses-admin.tsx` page works correctly** because it accesses `expense.expense_date` directly (snake_case) in the table display (line 164).

### Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `packages/web/src/features/finance/api/queries.ts` | Fix | Map `expense_date` → `expenseDate` in `getExpenses` response |
| `packages/web/src/features/finance/pages/expenses-page.tsx` | Verify | Confirm date displays correctly after fix |

### Approach

**Fix the mapping in `getExpenses`** (queries.ts):

```typescript
return (data ?? []).map((row) => ({
  ...row,
  expenseDate: row.expense_date,
  receiptUrl: row.receipt_url,
  createdBy: row.created_by,
  createdAt: row.created_at,
})) as unknown as Expense[];
```

Also apply the same mapping to `getExpenseById`.

### Risks

- Low — this is a clear bug with a straightforward fix.
- The `expenses-admin.tsx` page uses its own `useExpenses` from `use-finance-queries.ts` which returns raw `ExpenseRow` types, so it's unaffected.

---

## Recommendation

All three tasks are independent and low-risk. Implementation order:

1. **Task 3 (expense date bug)** — smallest, highest value, clear root cause
2. **Task 2 (numeric inputs)** — mechanical CSS + value changes across many files
3. **Task 1 (edit/delete customers)** — new UI components, needs careful FK handling

## Ready for Proposal

Yes — all three tasks have clear affected areas, known root causes (Task 3), and straightforward approaches. No ambiguity requiring further exploration.

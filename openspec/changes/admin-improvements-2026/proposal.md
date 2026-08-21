# Proposal: Admin Improvements 2026

## Intent

Three targeted improvements to the M&B Trend admin web app:
1. Enable editing and deleting in-person sales customers with confirmation
2. Remove default "0" value and spinner controls from all numeric inputs app-wide
3. Fix a bug where expense dates are not persisted when creating or editing expenses

## Scope

### In Scope
- EditCustomerDialog and DeleteCustomerDialog for in-person customers
- Edit/Delete buttons in the customer table row actions
- CSS rule to hide number input spinners globally
- Remove `value="0"` defaults from all numeric inputs
- Fix camelCase/snake_case mapping bug in expense queries
- Guard against deleting customers with existing sales

### Out of Scope
- Editing/deleting in-person sales (only customers)
- Changing the expense table schema or categories
- Adding new expense fields
- Refactoring the two expense pages into one

## Capabilities

### Modified Capabilities
- `in-person-customers`: Add edit and delete operations to existing customer management
- `admin-ui`: Global CSS improvement for numeric input UX
- `finance-expenses`: Fix date persistence bug in expense CRUD

## Approach

### Task 1: Edit/Delete In-Person Customers

**EditCustomerDialog**: Mirror `CreateCustomerDialog` structure but pre-fill with existing customer data. Calls `supabase.from('in_person_customers').update(...)`. Same fields: name (required), phone, email, address, notes.

**DeleteCustomerDialog**: Confirmation dialog showing customer name and warning if balance > 0. Before deletion, check for existing sales via `supabase.from('in_person_sales').select('id').eq('customer_id', id).limit(1)`. If sales exist, block deletion with a message. If no sales, proceed with `supabase.from('in_person_customers').delete()`.

**Customer table row**: Add Edit (pencil icon) and Delete (trash icon) buttons using `e.stopPropagation()` to prevent row click navigation. Buttons placed next to existing Cobrar/Info buttons.

### Task 2: Numeric Input Improvements

**Global CSS** in `packages/web/src/index.css`:
```css
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] { -moz-appearance: textfield; }
```

**Value defaults**: Review each of the 9 affected files. Where state initializes to `0` for a numeric input, change to `""` (empty string). The `parseFloat(value) || 0` pattern in onChange handlers already handles empty strings correctly for calculations.

### Task 3: Expense Date Bug Fix

**Root cause**: `getExpenses()` and `getExpenseById()` in `packages/web/src/features/finance/api/queries.ts` return raw Supabase data cast as `Expense[]` without mapping `expense_date` (snake_case) to `expenseDate` (camelCase). This makes `expense.expenseDate` always `undefined`.

**Fix**: Add mapping in both functions:
```typescript
return (data ?? []).map((row) => ({
  ...row,
  expenseDate: row.expense_date,
  receiptUrl: row.receipt_url,
  createdBy: row.created_by,
  createdAt: row.created_at,
})) as unknown as Expense[];
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/web/src/features/admin/sales/pages/InPersonSalesPage.tsx` | Modified | Add EditCustomerDialog, DeleteCustomerDialog, edit/delete buttons in customer table |
| `packages/web/src/features/finance/api/queries.ts` | Modified | Fix expense_date → expenseDate mapping in getExpenses and getExpenseById |
| `packages/web/src/index.css` | Modified | Add global CSS to hide number input spinners |
| 9 files with `type="number"` inputs | Modified | Remove value="0" defaults |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Deleting customer with existing sales breaks FK | Medium | Check for sales before deletion; block if sales exist |
| CSS spinner removal affects other browsers | Low | Use both -webkit and -moz prefixes |
| Empty string default breaks form validation | Low | All forms already use `parseFloat(value) || 0` pattern |

## Rollback Plan

1. **Task 1**: Remove EditCustomerDialog, DeleteCustomerDialog, and edit/delete buttons from InPersonSalesPage.tsx
2. **Task 2**: Remove CSS rules from index.css; revert value defaults
3. **Task 3**: Remove mapping in queries.ts (revert to cast-only)

All changes are additive or fix bugs — no destructive schema changes.

## Success Criteria

- [ ] Admin can edit an in-person customer's name, phone, email, address, notes
- [ ] Admin can delete an in-person customer with confirmation dialog
- [ ] Deletion is blocked if customer has existing sales
- [ ] All numeric inputs show no spinner controls
- [ ] All numeric inputs start empty (no default "0")
- [ ] Expense date is correctly displayed in the table after creation
- [ ] Expense date is correctly pre-filled when editing an expense
- [ ] Expense date is correctly saved when creating or editing

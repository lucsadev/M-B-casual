# Proposal: Ventas Presencial + Clientes Presenciales

## Intent

Add an "In-Person Sales" admin page to enable Marianela and Belén to process walk-in sales at their physical store. This requires a separate customer model (not linked to `auth.users`) because the existing `customers` table is tightly coupled to Supabase Auth via triggers and RLS policies — it cannot safely represent walk-in customers who have no login accounts.

## Scope

### In Scope
- New admin page at `/admin/ventas-presencial` with sidebar navigation
- New database tables: `in_person_customers`, `in_person_sales`, `in_person_sale_items`
- Customer CRUD: create, list, search, view balance/history
- Sales creation: add products/variants, apply discounts, select payment method
- Balance tracking: partial payments add remainder to customer balance
- Stock integration: sales decrement `product_variants.stock` via trigger
- Cash integration: sales create `cash_movements` entries via trigger
- Shared types and Zod validators for new entities

### Out of Scope
- Unified customer view (online + in-person) — deferred to future reporting phase
- Customer loyalty points or rewards
- Split payments across multiple methods in single sale
- Receipt printing / thermal printer integration
- Mobile/POS app — web admin only for now
- Refund/return flow for in-person sales

## Capabilities

### New Capabilities
- `in-person-customers`: Customer management for walk-in clients (name, phone, email, notes, balance)
- `in-person-sales`: Sales transaction creation with items, discounts, payment methods, balance usage
- `in-person-sale-items`: Line items linking sales to product variants with quantity/pricing

### Modified Capabilities
- `database-schema`: Add 3 new tables, 2 triggers (stock decrement, cash movement), indexes
- `admin-catalog`: Reuse existing product/variant types and stock display patterns

## Approach

**Separate `in_person_customers` table (Approach 1 from exploration)** — cleanest, lowest-risk option that avoids breaking auth-linked customers.

### Database Changes
```sql
-- In-person customers (NOT linked to auth.users)
CREATE TABLE in_person_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In-person sales
CREATE TABLE in_person_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES in_person_customers(id),
  total NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  balance_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID, -- admin user
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In-person sale items
CREATE TABLE in_person_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES in_person_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- Trigger: decrement stock on sale item insert
-- Trigger: create cash_movements entry on sale insert
```

### Frontend Structure
- `packages/web/src/features/admin/sales/` — new feature folder
  - `pages/InPersonSalesPage.tsx` — main page with customer selector + sale builder
  - `components/SaleBuilder.tsx` — add products, set quantities, apply discount
  - `components/CustomerSelector.tsx` — search/create in-person customers
  - `api/use-in-person-sales-queries.ts` — TanStack Query hooks
  - `api/use-in-person-sales-mutations.ts` — create sale, create customer
- `packages/web/src/app/layouts/admin-layout.tsx` — add "Ventas presencial" to `NAV_ITEMS`
- `packages/web/src/app/router.tsx` — add route `/admin/ventas-presencial`

### Integration Points
- **Stock**: `AFTER INSERT` trigger on `in_person_sale_items` → `UPDATE product_variants SET stock = stock - NEW.quantity`
- **Cash**: `AFTER INSERT` trigger on `in_person_sales` → `INSERT INTO cash_movements (type, amount, description, reference_type, reference_id) VALUES ('income', NEW.total - NEW.balance_used, 'Venta presencial', 'in_person_sales', NEW.id)`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Migration for 3 tables + 2 triggers + indexes |
| `packages/shared/src/types/` | New | `in-person-customer.ts`, `in-person-sale.ts`, `in-person-sale-item.ts` |
| `packages/shared/src/validators/` | New | Zod schemas for new entities |
| `packages/web/src/features/admin/sales/` | New | Complete feature folder with pages, components, API hooks |
| `packages/web/src/app/layouts/admin-layout.tsx` | Modified | Add "Ventas presencial" to sidebar `NAV_ITEMS` |
| `packages/web/src/app/router.tsx` | Modified | Add `/admin/ventas-presencial` route |
| `packages/web/src/components/ui/` | Reused | shadcn/ui Table, Dialog, Button, Input, Select, Badge |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Customer confusion: two "customer" concepts | Medium | Clear UI labels: "Usuarios" (online) vs "Clientes presenciales" (in-person) |
| Balance tracking atomicity | Medium | Use DB transactions for sale + balance update; trigger-based stock/cash |
| Stock decrement race conditions | Low | Trigger runs in same transaction as sale item insert |
| Admin RLS bypass (no auth.users link) | Low | New tables admin-only via RLS: `USING (auth.jwt() ->> 'role' = 'admin')` |
| Migration rollback on production data | Low | Tables are additive; no existing data depends on them |

## Rollback Plan

1. **Drop tables** (in order due to FKs):
   ```sql
   DROP TABLE IF EXISTS in_person_sale_items CASCADE;
   DROP TABLE IF EXISTS in_person_sales CASCADE;
   DROP TABLE IF EXISTS in_person_customers CASCADE;
   ```
2. **Remove triggers** (if created separately): `DROP TRIGGER ... ON in_person_sale_items; DROP TRIGGER ... ON in_person_sales;`
3. **Remove frontend**: Delete `packages/web/src/features/admin/sales/` folder
4. **Remove route/nav**: Remove entry from `NAV_ITEMS` in `admin-layout.tsx` and route from `router.tsx`
5. **Remove shared types/validators**: Delete the three new files in `packages/shared/src/`

All changes are additive — no existing tables, routes, or components are modified (only extended).

## Dependencies

- `database-schema` — existing `products`, `product_variants`, `cash_movements` tables
- `admin-catalog` — product/variant types and stock display patterns reused
- `supabase-auth` — admin role check for RLS on new tables
- `shared-package` — TypeScript/Zod infrastructure

## Success Criteria

- [ ] Admin can navigate to `/admin/ventas-presencial` from sidebar
- [ ] Admin can create in-person customers with name, phone, email, notes
- [ ] Admin can search/select existing in-person customers
- [ ] Admin can build a sale: add product variants, set quantities, see line subtotals
- [ ] Admin can apply discount (percentage or fixed) to sale total
- [ ] Admin can select payment method (efectivo, tarjeta, transferencia, mixto)
- [ ] Admin can apply customer balance; remainder added to balance if underpaid
- [ ] Sale creation decrements `product_variants.stock` for each item
- [ ] Sale creation creates `cash_movements` income entry
- [ ] Customer balance updates correctly on sale and future payments
- [ ] All new tables have RLS policies restricting access to admin role
- [ ] Migration runs clean on fresh Supabase project
# Delta for Database Schema

## ADDED Requirements

### Requirement: Cash movement triggers

A trigger on `orders` SHALL auto-insert a cash_movement (type='income', amount=order.total) when status changes to 'confirmed'. A trigger on `expenses` SHALL auto-insert a cash_movement (type='expense') on INSERT. A trigger on `purchases` SHALL auto-insert a cash_movement (type='expense') on INSERT.

#### Scenario: Order confirmed triggers income
- GIVEN an order with total $50,000
- WHEN `UPDATE orders SET status = 'confirmed'`
- THEN `cash_movements` has a new row: type=income, amount=50000, reference_type=order, reference_id=order.id

#### Scenario: Expense insert triggers expense
- GIVEN an expense insert with amount $15,000
- WHEN the INSERT completes
- THEN `cash_movements` has a new row: type=expense, amount=15000, reference_type=expense

#### Scenario: Purchase insert triggers expense
- GIVEN a purchase insert with total $90,000
- WHEN the INSERT completes
- THEN `cash_movements` has a new row: type=expense, amount=90000, reference_type=purchase

#### Scenario: Duplicate trigger does not double-insert
- GIVEN an order already has a cash_movement for its status change
- WHEN status changes again (e.g., confirmed → shipped)
- THEN no new cash_movement is created for the second change

### Requirement: Product profitability view

A `product_profitability` view SHALL be created joining `order_items` (revenue) and `purchase_items` (COGS) per product. Formula: revenue - COGS per product, with margin percentage.

#### Scenario: Profitability view returns correct values
- GIVEN product "Remera Negra" with $100k revenue (order_items) and $60k COGS (purchase_items)
- WHEN querying `product_profitability`
- THEN it returns revenue=100000, cogs=60000, margin=40000, margin_pct=40

#### Scenario: Product with no COGS shows margin == revenue
- GIVEN a product with order sales but no purchase records
- WHEN querying `product_profitability`
- THEN cogs=0, margin=revenue, margin_pct=100

## Acceptance Criteria
- [ ] Migration `00005_finance_views.sql` applies without errors
- [ ] `product_profitability` view exists and returns correct values
- [ ] Each trigger fires exactly once per insert/status-change
- [ ] No duplicate cash movements on re-trigger
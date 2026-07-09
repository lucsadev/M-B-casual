# Admin Finance Dashboard Specification

## Purpose

Financial KPI dashboard showing current month revenue, expenses, gross margin, and order count. Includes a 6-month bar chart (income vs expenses) and product profitability table.

## Requirements

### Requirement: Monthly KPI cards

The dashboard SHALL display four KPI cards for the current month: total revenue (confirmed orders), total expenses, gross margin (revenue - expenses), and order count.

#### Scenario: KPIs reflect current month data

- GIVEN July has 10 confirmed orders totaling $500,000 and $120,000 in expenses
- WHEN the admin opens /admin/finanzas
- THEN revenue shows $500,000, expenses $120,000, margin $380,000, orders 10

#### Scenario: Empty month shows zero KPIs

- GIVEN no orders or expenses exist for the current month
- WHEN the admin opens the dashboard
- THEN all KPI cards show $0 and 0 orders

### Requirement: 6-month income vs expense chart

The dashboard SHALL display a bar chart comparing monthly income (confirmed orders) vs expenses for the last 6 months. Data sources: `monthly_sales` view for income, expenses table aggregated by month.

#### Scenario: Chart shows 6 bars per month

- GIVEN 6 months of orders and expenses
- WHEN the admin views the dashboard
- THEN each month shows two bars (blue for income, red for expenses)

#### Scenario: Partial months included

- GIVEN only 3 months of data exist
- WHEN the chart renders
- THEN only months with data appear (remaining months omitted)

### Requirement: Product profitability table

The dashboard SHALL include a table per product showing: revenue (from order_items), COGS (from purchase_items), and net margin. Data source: `product_profitability` view.

#### Scenario: Profitability table shows correct margin

- GIVEN product "Remera Negra" with $100,000 revenue and $60,000 in purchase costs
- WHEN the admin views the profitability table
- THEN margin displays $40,000 (40%)

#### Scenario: Product with no purchases shows 0 COGS

- GIVEN a product with sales but no purchase records
- WHEN the profitability table renders
- THEN COGS shows $0 and margin equals revenue

### Requirement: Date range filter

All dashboard values SHALL be filterable by a custom date range (default: current month). Changing the filter SHALL update all KPIs, chart, and table.

#### Scenario: Apply custom date range

- GIVEN data for Q2 2026 (Apr–Jun)
- WHEN the admin selects April 1 – June 30
- THEN all KPIs, chart, and profitability table reflect Q2 data only
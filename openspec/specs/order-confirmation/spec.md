# Order Confirmation Specification

## Purpose

Display a success screen after order placement with the order number, purchased items summary, total, and next steps.

## Requirements

### Requirement: Success screen with order number

After successful checkout, the system MUST display a confirmation page at `/gracias/{orderId}` (web) or `/order/{id}` (mobile) showing the order number.

#### Scenario: Order number displayed

- GIVEN a just-created order
- WHEN the confirmation screen loads
- THEN the order ID (truncated or sequential number) is prominently displayed
- AND a success icon or message is shown

### Requirement: Purchase summary

The confirmation SHALL list all purchased items with name, variant, quantity, and line total. The order total and payment method SHALL be displayed.

#### Scenario: Summary matches what was bought

- GIVEN the created order
- WHEN viewing confirmation
- THEN each item from `order_items` is listed
- AND the total matches the `orders.total` field
- AND the selected payment method is shown

### Requirement: Order status indication

The confirmation MUST indicate the order is in `pending` status and explain what happens next.

#### Scenario: Pending status displayed

- GIVEN a confirmed order
- WHEN on the confirmation page
- THEN the status badge reads "Pendiente"
- AND a message says "Te notificaremos cuando el pedido sea confirmado"

### Requirement: Navigation actions

The confirmation screen SHALL provide a "Volver al catálogo" button and a shipping tracking link (placeholder for future).

#### Scenario: Back to catalog

- GIVEN the confirmation screen
- WHEN tapping "Volver al catálogo"
- THEN the app navigates to the catalog page

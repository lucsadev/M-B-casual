# Cart Mobile Specification

## Purpose

Provide a native cart experience on the mobile app: FlatList of items, swipe-to-delete, bottom sheet summary, and checkout entry point.

## Requirements

### Requirement: CartScreen with FlatList

The CartScreen SHALL render cart items in a FlatList with product image, name, variant info, quantity stepper, and line total.

#### Scenario: Items display correctly

- GIVEN a user with cart items
- WHEN navigating to CartScreen
- THEN each item shows image, name, selected variant, quantity, and subtotal

#### Scenario: Empty cart state

- GIVEN an empty cart
- WHEN viewing CartScreen
- THEN it displays a centered empty state message and "Explorar catálogo" CTA

### Requirement: Swipe to delete

Each cart item MUST support swipe-to-delete via react-native-gesture-handler. Deletion SHALL call the TanStack Query delete mutation.

#### Scenario: Swipe removes item

- GIVEN a cart item row
- WHEN the user swipes left on the item
- THEN a delete action appears
- AND tapping it removes the row from `cart_items` and the list

#### Scenario: Undo toaster after delete

- GIVEN a deleted cart item
- WHEN the item is removed
- THEN a brief undo toast appears (3s)
- AND the user can tap "Deshacer" to re-insert the item

### Requirement: Bottom sheet summary

A bottom sheet or fixed footer SHALL show item count, subtotal, shipping, and total, with a "Continuar al checkout" button.

#### Scenario: Summary updates on quantity change

- GIVEN the CartScreen with items
- WHEN the user changes quantity on any item
- THEN the bottom sheet total recalculates

#### Scenario: Checkout navigation

- GIVEN items in cart
- WHEN tapping "Continuar al checkout"
- THEN the app navigates to `/checkout`

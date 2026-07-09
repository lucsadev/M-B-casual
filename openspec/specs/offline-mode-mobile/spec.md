# Offline Mode Mobile Specification

## Purpose

Full offline resilience for mobile: catalog cached via TanStack Query persist + MMKV, connectivity indicator, and automatic refresh on reconnection. This extends the mobile-catalog offline cache with app-wide offline support.

## Requirements

### Requirement: App-wide query persistence

The TanStack Query client MUST use `@tanstack/query-persist-client-core` with an MMKV storage adapter. All GET queries SHOULD persist to MMKV unless explicitly excluded via `meta: {persist: false}`.

#### Scenario: Persist product list query

- GIVEN a mobile user navigates to the catalog
- WHEN the products query completes successfully
- THEN the response is persisted to MMKV AND available on next cold start

#### Scenario: Skip persistence for mutation queries

- GIVEN a mutation (e.g., create order)
- WHEN the mutation fires
- THEN it is NOT persisted to MMKV

### Requirement: Offline queue for mutations

The system SHOULD queue mutations (order creation, cart updates) made while offline. Queued mutations SHALL replay in order when connectivity is restored.

#### Scenario: Create order while offline

- GIVEN a mobile user with no connection on the checkout screen
- WHEN they tap "Confirmar orden"
- THEN the order is queued locally AND a "Pending sync" indicator appears
- AND when connectivity returns the order is created on the server

### Requirement: Connectivity badge (app-wide)

A global connectivity banner MUST display "Sin conexión" when the device is offline. The banner SHALL be non-blocking and dismissable after first acknowledgement.

#### Scenario: Connection lost mid-session

- GIVEN a user actively browsing
- WHEN internet drops
- THEN a "Sin conexión" banner slides in from the top within 1 second

# Delta for mobile-catalog

## ADDED Requirements

### Requirement: Connectivity indicator

The mobile catalog MUST display a visual offline badge ("Sin conexión") when `@react-native-community/netinfo` reports no connectivity. The badge SHALL appear at the top of the catalog and product detail screens, not as a blocking overlay.

#### Scenario: Show offline badge when connectivity lost

- GIVEN a user browsing the catalog with active connection
- WHEN the device goes offline
- THEN a non-blocking "Sin conexión" banner appears at the top within 1 second

#### Scenario: Hide badge when connectivity restored

- GIVEN an offline user with the badge visible
- WHEN connectivity returns
- THEN the banner disappears AND cached data auto-refreshes

## MODIFIED Requirements

### Requirement: Offline cache

The catalog MUST cache product data locally via TanStack Query persistence to MMKV. Cached data SHALL be shown immediately while fresh data loads in the background (stale-while-revalidate). The system SHOULD use a versioned cache key to allow invalidation when the app updates.
(Previously: Basic cache without version key or connectivity-aware refresh)

#### Scenario: View catalog offline

- GIVEN a user who previously visited the catalog with connectivity
- WHEN they open the catalog without internet
- THEN previously loaded products are displayed from MMKV cache AND the offline badge is visible

#### Scenario: Auto-refresh when connection restored

- GIVEN an offline user viewing cached catalog data
- WHEN connectivity returns
- THEN TanStack Query refetches fresh data AND the UI updates automatically AND the offline badge hides

## REMOVED Requirements

### Requirement: Offline cache (original)

(Reason: Replaced by upgraded requirement with connectivity detection and auto-refresh)

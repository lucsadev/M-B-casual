# Delta for Database Schema

## ADDED Requirements

### Requirement: Cart items table

The spec MUST document the `cart_items` table (already exists in DB). It SHALL have columns: id (uuid PK), user_id (FK → auth.users.id), product_id (FK → products.id), variant_id (nullable, FK → product_variants.id), quantity (int, CHECK > 0), created_at, updated_at.

#### Scenario: cart_items FK prevents dangling references

- GIVEN a `cart_items` row referencing a deleted product
- WHEN the product is deleted
- THEN the row is also deleted (CASCADE from product)

### Requirement: RLS policies for cart

`cart_items` MUST have RLS policies: users can SELECT/INSERT/UPDATE/DELETE only their own rows (WHERE user_id = auth.uid()).

#### Scenario: User sees only own cart items

- GIVEN two users with cart items
- WHEN user A queries `cart_items`
- THEN only user A's rows are returned

#### Scenario: Unauthenticated insert is rejected

- GIVEN no active session
- WHEN an INSERT into `cart_items` is attempted
- THEN RLS rejects with permission denied

### Requirement: Order creation RLS

`orders` and `order_items` MUST allow INSERT for authenticated users. `orders` SELECT policy SHALL return only own orders for non-admin users.

#### Scenario: User inserts own order

- GIVEN an authenticated user
- WHEN INSERTING into `orders` with their customer_id
- THEN the insert succeeds

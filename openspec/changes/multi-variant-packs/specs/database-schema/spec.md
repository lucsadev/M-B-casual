# Delta for database-schema

> Change: `multi-variant-packs` | Project: m-b-casual | Phase: spec

## ADDED Requirements

### Requirement: Pack units column

The migration MUST add a `pack_units` column to `products`: `smallint NULL` with `CHECK (pack_units IS NULL OR pack_units >= 2)`. `NULL` means "not a pack"; 2/3 mean x2/x3 pack (the CHECK allows future sizes without migration). A new migration `00007_product_pack_units.sql` SHALL be created and the column reconciled into `00000_full_database.sql` (repo convention) so fresh and migrated environments converge. The column MUST be additive: existing rows and existing behavior are unaffected (all current rows get `NULL`).

#### Scenario: Column exists with correct type and constraint

- GIVEN migration `00007_product_pack_units.sql` applied
- WHEN inspecting `products.pack_units`
- THEN it is `smallint`, nullable, with `CHECK (pack_units IS NULL OR pack_units >= 2)`

#### Scenario: CHECK rejects invalid pack sizes

- GIVEN a products row
- WHEN `UPDATE products SET pack_units = 1` (or 0)
- THEN the database rejects with a check violation

#### Scenario: NULL and valid sizes are accepted

- GIVEN a products row
- WHEN `pack_units` is set to `NULL`, `2`, or `3`
- THEN the update succeeds

#### Scenario: Existing rows reconcile to NULL

- GIVEN a migrated database with pre-existing products
- WHEN the migration completes
- THEN every existing product has `pack_units IS NULL` AND no data migration or destructive DDL is run

#### Scenario: Fresh database converges

- GIVEN a fresh Supabase project
- WHEN `00000_full_database.sql` runs
- THEN `products` includes `pack_units smallint NULL CHECK (pack_units IS NULL OR pack_units >= 2)` identical to the incremental migration

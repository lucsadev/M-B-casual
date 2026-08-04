-- =============================================================================
-- M&B Trend — REMOVE variant color_hex column
-- =============================================================================
-- Variant color is now text-only: the hex color picker was removed from the
-- admin variant form and catalog/order swatches no longer render hex values.
-- The `color` text column remains the single source for the variant color.
-- =============================================================================

alter table product_variants drop column color_hex;

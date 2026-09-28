-- Adds products.is_promotional, which application code has assumed exists since
-- before this migration history begins (types/database.types.ts declares it,
-- ProductCard/ProductDetails render a promotional badge from it, and the
-- inventory sync writes to it) but no migration ever actually created it.
--
-- On a SELECT this went unnoticed -- PostgREST simply omits an unknown column,
-- so `product.is_promotional` was just `undefined` and the badge silently never
-- rendered. It surfaced as a hard failure only once the sync started writing to
-- it: "column p.is_promotional does not exist", failing every inventory sync run
-- at the promotional-flag update step.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.is_promotional IS
    'Whether the product is currently a promotional/discounted offer per the supplier feeds. Written by the inventory sync (sync_supplier_promotional_flags); read by the storefront to show a promotional badge.';

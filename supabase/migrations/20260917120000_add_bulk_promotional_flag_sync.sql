-- Bulk synchronization of products.is_promotional by SKU.
--
-- The inventory sync previously issued one PostgREST UPDATE per SKU, so a run
-- made as many HTTP round trips as there were products in the supplier feeds.
-- That is slow everywhere and impossible on Cloudflare Workers, where a single
-- invocation may only make 50 subrequests on the free plan (1,000 on paid).
-- This collapses the whole set into one call.

CREATE OR REPLACE FUNCTION sync_supplier_promotional_flags(
    p_flags JSONB
)
RETURNS TABLE (
    updated_rows INTEGER
) AS $$
DECLARE
    v_updated_rows INTEGER := 0;
BEGIN
    WITH flag_rows AS (
        SELECT DISTINCT ON (NULLIF(BTRIM(item.sku), ''))
            NULLIF(BTRIM(item.sku), '') AS sku,
            COALESCE(item.is_promotional, FALSE) AS is_promotional
        FROM jsonb_to_recordset(COALESCE(p_flags, '[]'::jsonb)) AS item(
            sku TEXT,
            is_promotional BOOLEAN
        )
        WHERE NULLIF(BTRIM(item.sku), '') IS NOT NULL
    )
    UPDATE products p
    SET
        is_promotional = f.is_promotional,
        updated_at = NOW()
    FROM flag_rows f
    WHERE p.sku = f.sku
      -- Skip no-op writes so updated_at stays meaningful and the write volume
      -- stays proportional to what actually changed.
      AND p.is_promotional IS DISTINCT FROM f.is_promotional;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    RETURN QUERY SELECT v_updated_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_supplier_promotional_flags(JSONB) IS
    'Bulk updates products.is_promotional by SKU from supplier feeds in a single round trip. Replaces per-SKU PostgREST updates.';

GRANT EXECUTE ON FUNCTION sync_supplier_promotional_flags(JSONB) TO service_role;

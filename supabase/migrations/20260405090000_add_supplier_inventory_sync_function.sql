-- Bulk supplier inventory + product metadata synchronization by SKU
-- Source feeds:
-- 1) stock/pricing feed (SKU, quantity, net, gross)
-- 2) product info feed (SKU, EAN, CN code, weight)

CREATE OR REPLACE FUNCTION sync_supplier_inventory(
    p_inventory JSONB,
    p_info JSONB
)
RETURNS TABLE (
    updated_rows INTEGER
) AS $$
DECLARE
    v_updated_rows INTEGER := 0;
BEGIN
    WITH inventory_rows AS (
        SELECT
            NULLIF(BTRIM(item.sku), '') AS sku,
            GREATEST(COALESCE(item.quantity, 0), 0) AS quantity,
            item.net_price AS net_price,
            item.gross_price AS gross_price
        FROM jsonb_to_recordset(COALESCE(p_inventory, '[]'::jsonb)) AS item(
            sku TEXT,
            quantity INTEGER,
            net_price NUMERIC,
            gross_price NUMERIC
        )
        WHERE NULLIF(BTRIM(item.sku), '') IS NOT NULL
    ),
    info_rows AS (
        SELECT
            NULLIF(BTRIM(item.sku), '') AS sku,
            NULLIF(BTRIM(item.ean), '') AS ean,
            NULLIF(BTRIM(item.code_cn), '') AS code_cn,
            item.weight_kg AS weight_kg
        FROM jsonb_to_recordset(COALESCE(p_info, '[]'::jsonb)) AS item(
            sku TEXT,
            ean TEXT,
            code_cn TEXT,
            weight_kg NUMERIC
        )
        WHERE NULLIF(BTRIM(item.sku), '') IS NOT NULL
    ),
    merged AS (
        SELECT
            COALESCE(i.sku, f.sku) AS sku,
            i.quantity,
            i.net_price,
            i.gross_price,
            f.ean,
            f.code_cn,
            f.weight_kg
        FROM inventory_rows i
        FULL JOIN info_rows f USING (sku)
        WHERE COALESCE(i.sku, f.sku) IS NOT NULL
    )
    UPDATE products p
    SET
        inventory_count = COALESCE(m.quantity, p.inventory_count),
        price_wholesale = COALESCE(m.net_price, p.price_wholesale),
        price_retail = COALESCE(m.gross_price, p.price_retail),
        specifications = jsonb_strip_nulls(
            COALESCE(p.specifications, '{}'::jsonb)
            || CASE WHEN m.ean IS NOT NULL THEN jsonb_build_object('ean', m.ean) ELSE '{}'::jsonb END
            || CASE WHEN m.code_cn IS NOT NULL THEN jsonb_build_object('code_cn', m.code_cn) ELSE '{}'::jsonb END
            || CASE WHEN m.weight_kg IS NOT NULL THEN jsonb_build_object('product_weight_kg', m.weight_kg) ELSE '{}'::jsonb END
        ),
        updated_at = NOW()
    FROM merged m
    WHERE p.sku = m.sku;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    RETURN QUERY SELECT v_updated_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_supplier_inventory(JSONB, JSONB) IS
    'Bulk updates products by SKU from external supplier feeds. Updates inventory, wholesale/retail prices and selected metadata in specifications JSON.';

GRANT EXECUTE ON FUNCTION sync_supplier_inventory(JSONB, JSONB) TO service_role;

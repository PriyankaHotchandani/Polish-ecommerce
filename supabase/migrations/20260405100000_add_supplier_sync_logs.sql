-- Store supplier inventory sync run history for admin monitoring.

CREATE TABLE IF NOT EXISTS supplier_sync_runs (
    id BIGSERIAL PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    updated_rows INTEGER NOT NULL DEFAULT 0 CHECK (updated_rows >= 0),
    inventory_rows_parsed INTEGER NOT NULL DEFAULT 0 CHECK (inventory_rows_parsed >= 0),
    info_rows_parsed INTEGER NOT NULL DEFAULT 0 CHECK (info_rows_parsed >= 0),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_runs_created_at
    ON supplier_sync_runs(created_at DESC);

ALTER TABLE supplier_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_sync_runs_admin_read ON supplier_sync_runs;
CREATE POLICY supplier_sync_runs_admin_read
    ON supplier_sync_runs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION log_supplier_sync_run(
    p_status TEXT,
    p_updated_rows INTEGER,
    p_inventory_rows_parsed INTEGER,
    p_info_rows_parsed INTEGER,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO supplier_sync_runs (
        status,
        updated_rows,
        inventory_rows_parsed,
        info_rows_parsed,
        error_message
    )
    VALUES (
        CASE WHEN p_status = 'success' THEN 'success' ELSE 'failed' END,
        GREATEST(COALESCE(p_updated_rows, 0), 0),
        GREATEST(COALESCE(p_inventory_rows_parsed, 0), 0),
        GREATEST(COALESCE(p_info_rows_parsed, 0), 0),
        NULLIF(BTRIM(COALESCE(p_error_message, '')), '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_latest_supplier_sync_run()
RETURNS TABLE (
    status TEXT,
    updated_rows INTEGER,
    inventory_rows_parsed INTEGER,
    info_rows_parsed INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        runs.status,
        runs.updated_rows,
        runs.inventory_rows_parsed,
        runs.info_rows_parsed,
        runs.error_message,
        runs.created_at
    FROM supplier_sync_runs runs
    ORDER BY runs.created_at DESC
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION log_supplier_sync_run(TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_latest_supplier_sync_run() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_supplier_sync_run() TO service_role;

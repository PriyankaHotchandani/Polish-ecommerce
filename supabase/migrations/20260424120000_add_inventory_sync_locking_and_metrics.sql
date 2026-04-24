-- Add locking and richer telemetry for high-frequency inventory sync.

ALTER TABLE supplier_sync_runs
    DROP CONSTRAINT IF EXISTS supplier_sync_runs_status_check;

ALTER TABLE supplier_sync_runs
    ADD CONSTRAINT supplier_sync_runs_status_check
    CHECK (status IN ('success', 'failed', 'skipped_lock'));

ALTER TABLE supplier_sync_runs
    ADD COLUMN IF NOT EXISTS nokaut_rows_parsed INTEGER NOT NULL DEFAULT 0 CHECK (nokaut_rows_parsed >= 0),
    ADD COLUMN IF NOT EXISTS stock_rows_skipped INTEGER NOT NULL DEFAULT 0 CHECK (stock_rows_skipped >= 0),
    ADD COLUMN IF NOT EXISTS info_rows_skipped INTEGER NOT NULL DEFAULT 0 CHECK (info_rows_skipped >= 0),
    ADD COLUMN IF NOT EXISTS lock_acquired BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lock_owner TEXT,
    ADD COLUMN IF NOT EXISTS duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
    ADD COLUMN IF NOT EXISTS nokaut_fetch_ms INTEGER NOT NULL DEFAULT 0 CHECK (nokaut_fetch_ms >= 0),
    ADD COLUMN IF NOT EXISTS stock_fetch_ms INTEGER NOT NULL DEFAULT 0 CHECK (stock_fetch_ms >= 0),
    ADD COLUMN IF NOT EXISTS info_fetch_ms INTEGER NOT NULL DEFAULT 0 CHECK (info_fetch_ms >= 0);

CREATE TABLE IF NOT EXISTS supplier_sync_locks (
    lock_name TEXT PRIMARY KEY,
    lock_owner TEXT NOT NULL,
    locked_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_locks_locked_until
    ON supplier_sync_locks(locked_until);

CREATE OR REPLACE FUNCTION acquire_inventory_sync_lock(
    p_lock_name TEXT DEFAULT 'inventory_sync',
    p_lock_owner TEXT DEFAULT NULL,
    p_ttl_seconds INTEGER DEFAULT 600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner TEXT := COALESCE(NULLIF(BTRIM(p_lock_owner), ''), md5(random()::text || clock_timestamp()::text));
    v_ttl_seconds INTEGER := GREATEST(COALESCE(p_ttl_seconds, 600), 30);
BEGIN
    INSERT INTO supplier_sync_locks (lock_name, lock_owner, locked_until, created_at, updated_at)
    VALUES (
        p_lock_name,
        v_owner,
        NOW() + make_interval(secs => v_ttl_seconds),
        NOW(),
        NOW()
    )
    ON CONFLICT (lock_name)
    DO UPDATE SET
        lock_owner = EXCLUDED.lock_owner,
        locked_until = EXCLUDED.locked_until,
        updated_at = NOW()
    WHERE supplier_sync_locks.locked_until < NOW();

    RETURN EXISTS (
        SELECT 1
        FROM supplier_sync_locks
        WHERE lock_name = p_lock_name
          AND lock_owner = v_owner
          AND locked_until > NOW()
    );
END;
$$;

CREATE OR REPLACE FUNCTION release_inventory_sync_lock(
    p_lock_name TEXT DEFAULT 'inventory_sync',
    p_lock_owner TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    IF p_lock_owner IS NULL OR BTRIM(p_lock_owner) = '' THEN
        DELETE FROM supplier_sync_locks
        WHERE lock_name = p_lock_name;
    ELSE
        DELETE FROM supplier_sync_locks
        WHERE lock_name = p_lock_name
          AND lock_owner = p_lock_owner;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION acquire_inventory_sync_lock(TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_inventory_sync_lock(TEXT, TEXT) TO service_role;

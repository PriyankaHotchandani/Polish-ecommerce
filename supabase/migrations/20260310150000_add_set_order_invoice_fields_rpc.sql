-- Allow owners/admins to set invoice fields through a secure RPC.
-- This avoids edge-cases where direct UPDATE can be blocked by RLS evaluation.

CREATE OR REPLACE FUNCTION set_order_invoice_fields(
    p_order_id UUID,
    p_invoice_number TEXT,
    p_invoice_url TEXT,
    p_invoice_generated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM orders o
        WHERE o.id = p_order_id
          AND (o.user_id = auth.uid() OR is_admin())
    ) THEN
        RAISE EXCEPTION 'Order not found or access denied';
    END IF;

    UPDATE orders
    SET invoice_number = p_invoice_number,
        invoice_url = p_invoice_url,
        invoice_generated_at = p_invoice_generated_at,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_order_invoice_fields(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

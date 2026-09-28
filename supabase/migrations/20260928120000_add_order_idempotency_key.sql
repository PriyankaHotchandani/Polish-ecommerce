-- Idempotency protection for order creation.
--
-- create_order_with_inventory_check() had no way to recognize a retry of an
-- order that had already been created: every call unconditionally inserted a
-- new order and decremented inventory again. Any retry after the RPC had
-- already committed -- a dropped response, a platform-level error substituted
-- for the route's JSON, a double-click, a user navigating back and
-- resubmitting -- created a duplicate order and double-charged the customer's
-- cart against stock.
--
-- Callers now generate a UUID once per checkout attempt and resend the same
-- one on every retry of that attempt. The function short-circuits to the
-- existing order when it sees a key it has already committed, instead of
-- creating a second one.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key UUID;

-- A plain UNIQUE constraint is enough: Postgres treats every NULL as distinct
-- from every other NULL, so existing orders (and any request that omits the
-- key) are unaffected.
ALTER TABLE orders ADD CONSTRAINT orders_idempotency_key_key UNIQUE (idempotency_key);

COMMENT ON COLUMN orders.idempotency_key IS
    'Client-generated key, stable across retries of one checkout attempt. Lets create_order_with_inventory_check() recognize a retry and return the original order instead of creating a duplicate.';

-- Replacing rather than CREATE OR REPLACE: adding a new parameter changes the
-- function's signature, so CREATE OR REPLACE would leave the old 7-argument
-- version in place as a separate overload instead of updating it -- any call
-- that (for whatever reason) omitted the new argument would silently fall
-- through to the old, non-idempotent behavior.
DROP FUNCTION IF EXISTS create_order_with_inventory_check(UUID, DECIMAL, BOOLEAN, JSONB, JSONB, TEXT, JSONB);

CREATE FUNCTION create_order_with_inventory_check(
    p_user_id UUID,
    p_total_amount DECIMAL,
    p_is_b2b_invoice_required BOOLEAN,
    p_shipping_address JSONB,
    p_billing_address JSONB,
    p_payment_method TEXT,
    p_order_items JSONB,  -- Array of {product_id, quantity, price_at_purchase}
    p_idempotency_key UUID DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_price DECIMAL;
    v_current_stock INTEGER;
BEGIN
    -- A retry of an attempt we've already committed: hand back the original
    -- order instead of re-validating stock and creating a second one.
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_order_id FROM orders WHERE idempotency_key = p_idempotency_key;
        IF v_order_id IS NOT NULL THEN
            RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Validate all items have sufficient stock first (pessimistic locking)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        -- Lock the product row and check stock
        SELECT inventory_count INTO v_current_stock
        FROM products
        WHERE id = v_product_id
        FOR UPDATE;
        
        IF v_current_stock IS NULL THEN
            RETURN QUERY SELECT NULL::UUID, FALSE, 'Product not found: ' || v_product_id::TEXT;
            RETURN;
        END IF;
        
        IF v_current_stock < v_quantity THEN
            RETURN QUERY SELECT NULL::UUID, FALSE, 
                'Insufficient stock for product ' || v_product_id::TEXT || 
                '. Available: ' || v_current_stock || ', Requested: ' || v_quantity;
            RETURN;
        END IF;
    END LOOP;
    
    -- All validations passed, create the order
    BEGIN
        INSERT INTO orders (
            user_id,
            total_amount,
            is_b2b_invoice_required,
            shipping_address,
            billing_address,
            payment_method,
            payment_status,
            status,
            idempotency_key
        ) VALUES (
            p_user_id,
            p_total_amount,
            p_is_b2b_invoice_required,
            p_shipping_address,
            p_billing_address,
            p_payment_method,
            'pending'::payment_status,
            'pending'::order_status,
            p_idempotency_key
        )
        RETURNING id INTO v_order_id;
    EXCEPTION WHEN unique_violation THEN
        -- A genuinely concurrent retry raced this one to the insert (e.g. a
        -- double-fired submit) rather than arriving after we'd already
        -- returned. The other request's row is the real order; hand its id
        -- back instead of erroring, so the caller still sees success.
        SELECT id INTO v_order_id FROM orders WHERE idempotency_key = p_idempotency_key;
        RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
        RETURN;
    END;
    
    -- Create order items and decrement inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'price_at_purchase')::DECIMAL;
        
        -- Insert order item
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, v_product_id, v_quantity, v_price);
        
        -- Decrement inventory
        UPDATE products
        SET inventory_count = inventory_count - v_quantity,
            updated_at = NOW()
        WHERE id = v_product_id;
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_order_with_inventory_check IS 
    'Atomically creates an order with inventory validation and decrement. Idempotent on p_idempotency_key: a retry with the same key returns the original order instead of creating a duplicate. Returns order_id on success or error message on failure.';

GRANT EXECUTE ON FUNCTION create_order_with_inventory_check(UUID, DECIMAL, BOOLEAN, JSONB, JSONB, TEXT, JSONB, UUID) TO authenticated;

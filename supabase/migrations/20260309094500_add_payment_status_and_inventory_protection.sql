-- Add payment status tracking to orders and implement inventory protection

-- Add payment status enum and field
CREATE TYPE payment_status AS ENUM (
    'pending',           -- Payment not yet initiated
    'processing',        -- Payment being processed
    'completed',         -- Payment successful
    'failed',           -- Payment failed
    'refunded'          -- Payment refunded
);

ALTER TABLE orders
ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending';

CREATE INDEX idx_orders_payment_status ON orders(payment_status);

COMMENT ON COLUMN orders.payment_status IS 'Current payment processing state';

-- Create function to validate and decrement inventory atomically
CREATE OR REPLACE FUNCTION create_order_with_inventory_check(
    p_user_id UUID,
    p_total_amount DECIMAL,
    p_is_b2b_invoice_required BOOLEAN,
    p_shipping_address JSONB,
    p_billing_address JSONB,
    p_payment_method TEXT,
    p_order_items JSONB  -- Array of {product_id, quantity, price_at_purchase}
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
    INSERT INTO orders (
        user_id,
        total_amount,
        is_b2b_invoice_required,
        shipping_address,
        billing_address,
        payment_method,
        payment_status,
        status
    ) VALUES (
        p_user_id,
        p_total_amount,
        p_is_b2b_invoice_required,
        p_shipping_address,
        p_billing_address,
        p_payment_method,
        'pending'::payment_status,
        'pending'::order_status
    )
    RETURNING id INTO v_order_id;
    
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
    'Atomically creates an order with inventory validation and decrement. Returns order_id on success or error message on failure.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_inventory_check TO authenticated;

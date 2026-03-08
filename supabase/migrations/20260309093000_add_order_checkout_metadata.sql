-- Add checkout metadata columns to persist fulfillment-critical order context
-- Stores shipping/billing addresses and selected payment method at time of purchase

ALTER TABLE orders
ADD COLUMN shipping_address JSONB,
ADD COLUMN billing_address JSONB,
ADD COLUMN payment_method TEXT;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_method_check
CHECK (
    payment_method IS NULL
    OR payment_method IN ('card', 'transfer', 'cash_on_delivery')
);

COMMENT ON COLUMN orders.shipping_address IS 'Snapshot of shipping address captured during checkout';
COMMENT ON COLUMN orders.billing_address IS 'Snapshot of billing address captured during checkout';
COMMENT ON COLUMN orders.payment_method IS 'Selected payment method at checkout (pre-payment integration)';
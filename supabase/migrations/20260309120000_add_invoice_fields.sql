-- Add invoice fields to orders table
ALTER TABLE orders
ADD COLUMN invoice_number TEXT UNIQUE,
ADD COLUMN invoice_url TEXT,
ADD COLUMN invoice_generated_at TIMESTAMPTZ;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_sequence INT;
    invoice_num TEXT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_number FROM '\d+$') AS INT
        )
    ), 0) + 1
    INTO next_sequence
    FROM orders
    WHERE invoice_number LIKE 'INV/' || current_year || '/%';
    
    -- Format: INV/2026/00001
    invoice_num := 'INV/' || current_year || '/' || LPAD(next_sequence::TEXT, 5, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN orders.invoice_number IS 'Unique invoice number in format INV/YYYY/NNNNN';
COMMENT ON COLUMN orders.invoice_url IS 'URL to generated PDF invoice in Supabase Storage';
COMMENT ON COLUMN orders.invoice_generated_at IS 'Timestamp when invoice was generated';

-- Create invoices storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Add policies for invoices bucket
-- Policy: Users can read their own invoices
CREATE POLICY "Users can read own invoices"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'invoices' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can read all invoices
CREATE POLICY "Admins can read all invoices"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'invoices'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Policy: Service role can insert invoices
CREATE POLICY "Service can insert invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');

-- Policy: Service role can update invoices
CREATE POLICY "Service can update invoices"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoices');

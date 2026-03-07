-- Migration: Add profile fields (phone, default addresses) and standardize schema
-- Date: 2026-03-07

-- Add new profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS default_billing_address_id UUID,
ADD COLUMN IF NOT EXISTS default_shipping_address_id UUID;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_default_billing ON public.users(default_billing_address_id);
CREATE INDEX IF NOT EXISTS idx_users_default_shipping ON public.users(default_shipping_address_id);

-- Ensure updated_at trigger is working
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

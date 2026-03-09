-- Migration: Create saved addresses table for user address management
-- This allows users to save multiple shipping/billing addresses

CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    address_type TEXT NOT NULL CHECK (address_type IN ('shipping', 'billing', 'both')),
    label TEXT NOT NULL, -- e.g., "Home", "Office", "Warehouse"
    full_name TEXT NOT NULL,
    company_name TEXT,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Poland',
    phone TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_is_default ON public.saved_addresses(is_default);

-- Enable RLS
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own addresses
CREATE POLICY "Users can view their own addresses"
    ON public.saved_addresses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
    ON public.saved_addresses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
    ON public.saved_addresses
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
    ON public.saved_addresses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses"
    ON public.saved_addresses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Function to ensure only one default address per type per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated address is set as default
    IF NEW.is_default = TRUE THEN
        -- Unset any existing default for this user and address type
        UPDATE public.saved_addresses
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND (
              (address_type = NEW.address_type)
              OR (address_type = 'both' AND NEW.address_type IN ('shipping', 'billing'))
              OR (NEW.address_type = 'both' AND address_type IN ('shipping', 'billing'))
          );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single default address
CREATE TRIGGER trigger_ensure_single_default_address
    BEFORE INSERT OR UPDATE ON public.saved_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_default_address();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_saved_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_addresses_timestamp
    BEFORE UPDATE ON public.saved_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_saved_addresses_updated_at();

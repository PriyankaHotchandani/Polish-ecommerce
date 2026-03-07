-- Add email and name fields to public.users for easier querying
-- These fields will mirror auth.users for convenience

-- Add columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Sync existing data from auth.users
UPDATE public.users u
SET 
    email = au.email,
    first_name = au.raw_user_meta_data->>'first_name',
    last_name = au.raw_user_meta_data->>'last_name',
    company_name = au.raw_user_meta_data->>'company_name',
    nip_number = au.raw_user_meta_data->>'nip_number'
FROM auth.users au
WHERE u.id = au.id;

-- Create trigger function to keep users table in sync with auth.users
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update public.users when auth.users is updated
    UPDATE public.users
    SET 
        email = NEW.email,
        first_name = NEW.raw_user_meta_data->>'first_name',
        last_name = NEW.raw_user_meta_data->>'last_name',
        company_name = NEW.raw_user_meta_data->>'company_name',
        nip_number = NEW.raw_user_meta_data->>'nip_number',
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to sync metadata
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();

-- Create trigger function for new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users when new user signs up
    INSERT INTO public.users (id, email, first_name, last_name, role, company_name, nip_number)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'b2c_customer'::public.user_role),
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'nip_number'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        company_name = EXCLUDED.company_name,
        nip_number = EXCLUDED.nip_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

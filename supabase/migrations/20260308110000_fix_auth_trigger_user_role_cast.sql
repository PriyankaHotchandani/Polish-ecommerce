-- Fix auth signup trigger enum cast and sync additional user metadata
-- The auth trigger runs in auth context; enum types must be schema-qualified.

CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Note: These policies have been integrated into 20260223124500_add_rls_policies.sql
-- This file is kept for reference but the policies are already applied in the main RLS migration

-- Add admin policy to users table so admins can view all users
-- This is needed for the admin panel to display user information in orders and user management

-- Allow admins to view all users
-- CREATE POLICY "Admins can view all users"
-- ON public.users
-- FOR SELECT
-- TO authenticated
-- USING (is_admin());

-- Allow admins to update any user (for role changes, etc.)
-- CREATE POLICY "Admins can update any user"
-- ON public.users
-- FOR UPDATE
-- TO authenticated
-- USING (is_admin());

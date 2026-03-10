-- Fix users table UPDATE policy to include WITH CHECK clause
-- This allows users to update their own profile data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Recreate users update policy with WITH CHECK clause
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Recreate admins update policy with WITH CHECK clause
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

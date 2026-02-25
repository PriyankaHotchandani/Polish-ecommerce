-- Create Admin User Script
-- Run this script to promote an existing user to admin role
-- 
-- Usage:
-- 1. First, create a user account via the signup page (/auth/signup)
-- 2. Get the user's UUID from auth.users table
-- 3. Replace 'USER_UUID_HERE' below with the actual UUID
-- 4. Run this script

-- Option 1: Update existing user to admin role
UPDATE public.users 
SET role = 'admin', 
    updated_at = NOW()
WHERE id = 'USER_UUID_HERE';

-- Option 2: Check all users and their roles
SELECT 
    u.id,
    u.role,
    u.company_name,
    au.email,
    au.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY au.created_at DESC;

-- Option 3: Create admin user if you have auth credentials
-- (This requires creating the auth user first through Supabase Auth)
-- INSERT INTO public.users (id, role, created_at, updated_at)
-- VALUES ('AUTH_USER_UUID', 'admin', NOW(), NOW());

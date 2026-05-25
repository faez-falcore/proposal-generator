-- Fix admin update policy to avoid potential recursion issues
-- Drop the existing admin update policy
DROP POLICY IF EXISTS "profiles_update_admin_all" ON profiles;

-- Create a new, simpler admin update policy
-- This allows admins to update any profile including changing roles
CREATE POLICY "profiles_update_admin_all" ON profiles
    FOR UPDATE
    USING (
        -- Check if the current user is an admin by directly querying their profile
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Also ensure admins can insert new profiles (for creating sales reps)
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
CREATE POLICY "profiles_insert_admin" ON profiles
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        OR 
        auth.uid() = id  -- Allow users to create their own profile
    );
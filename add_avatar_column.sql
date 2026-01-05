-- Add avatar_url column to profiles table if it doesn't exist
alter table profiles 
add column if not exists avatar_url text;

-- Allow users to update their own avatar_url (covered by existing policy, but good to verify)
-- Existing policy: "Users can update own profile" using (id = auth.uid()) -> Covers it.

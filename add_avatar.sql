-- Add avatar_url column to profiles
alter table profiles 
add column if not exists avatar_url text;

-- (Optional) If we were setting up Storage, we would need policies here.
-- For now, we will handle the column existence.

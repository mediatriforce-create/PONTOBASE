-- Create a new storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated users to upload files to 'avatars' bucket
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Policy: Allow public access to view avatars (since profiles are visible)
create policy "Avatars are publicly accessible"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- Policy: Allow users to update/delete their own avatars? 
-- For MVP, standard insert/select is enough. We generate unique names to avoid collisions/overwrites issues for now.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. COMPANIES
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null, -- Code for employees to join (e.g., "ACME-1234")
  created_at timestamptz default now()
);

-- 2. PROFILES (Users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_id uuid references companies(id) on delete set null,
  role text check (role in ('admin', 'employee')) default 'employee',
  status text check (status in ('active', 'inactive')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TIME ENTRIES
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  entry_type text check (entry_type in ('entry', 'break_start', 'break_end', 'exit')) not null,
  timestamp timestamptz default now() not null,
  reason text, -- For manual edits
  edited_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 4. AUDIT LOGS
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS POLICIES --
alter table companies enable row level security;
alter table profiles enable row level security;
alter table time_entries enable row level security;
alter table audit_logs enable row level security;

-- Function to create profile on signup (Trigger)
-- Note: Logic for joining company via code needs to handle company assignment. 
-- For MVP, we might handle company assignment in the application logic after signup, or update profile triggers.
-- Simple approach: Insert into Profile is public (for self), update restricted.

-- COMPANIES POLICIES
create policy "Companies are viewable by their members"
  on companies for select
  using (
    id in (select company_id from profiles where id = auth.uid())
    or 
    -- Allow viewing if you are not in a company yet (to validate code)? 
    -- Better: create a secure function to validate code, OR allow select by code (if low risk).
    -- We'll allow public to select by code to join.
    true
  );

create policy "Admins can update their company"
  on companies for update
  using (
    id in (select company_id from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Authenticated can create companies"
  on companies for insert
  to authenticated
  with check (true);

-- PROFILES POLICIES
create policy "Users can view members of their company"
  on profiles for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    or id = auth.uid()
  );

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can update company members"
  on profiles for update
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin' and company_id = profiles.company_id
    )
  );

create policy "Public profile creation (Trigger usually handles this, but if client creates)"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

-- TIME ENTRIES POLICIES
create policy "Users view their own entries"
  on time_entries for select
  using (user_id = auth.uid());

create policy "Admins view company entries"
  on time_entries for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin' and company_id = time_entries.company_id
    )
  );

create policy "Users create entries for themselves"
  on time_entries for insert
  with check (
    user_id = auth.uid() 
    and 
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "Admins can edit/create entries"
  on time_entries for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin' and company_id = time_entries.company_id
    )
  );

-- AUDIT LOGS
create policy "Admins view audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin' and company_id = audit_logs.company_id
    )
  );

create policy "System/Users create logs"
  on audit_logs for insert
  to authenticated
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- Helper to auto-create profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'employee');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor

-- 1. Helper Functions (Security Definer to bypass RLS)
create or replace function get_my_company_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

create or replace function get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- 2. Fix PROFILES Policies
drop policy if exists "Users can view members of their company" on profiles;
drop policy if exists "Admins can update company members" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can view members of their company"
  on profiles for select
  using (
    company_id = get_my_company_id()
    or id = auth.uid()
  );

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can update company members"
  on profiles for update
  using (
    get_my_role() = 'admin' and company_id = get_my_company_id()
  );

-- 3. Fix TIME ENTRIES Policies
drop policy if exists "Admins view company entries" on time_entries;
drop policy if exists "Admins can edit/create entries" on time_entries;
drop policy if exists "Users create entries for themselves" on time_entries;

create policy "Users create entries for themselves"
  on time_entries for insert
  with check (
    user_id = auth.uid() 
    and 
    company_id = get_my_company_id()
  );

create policy "Admins view company entries"
  on time_entries for select
  using (
    get_my_role() = 'admin' and company_id = get_my_company_id()
  );

create policy "Admins can edit/create entries"
  on time_entries for all
  using (
    get_my_role() = 'admin' and company_id = get_my_company_id()
  );

-- 4. Fix AUDIT LOGS Policies
drop policy if exists "Admins view audit logs" on audit_logs;
drop policy if exists "System/Users create logs" on audit_logs;

create policy "Admins view audit logs"
  on audit_logs for select
  using (
    get_my_role() = 'admin' and company_id = get_my_company_id()
  );

create policy "System/Users create logs"
  on audit_logs for insert
  to authenticated
  with check (
    company_id = get_my_company_id()
  );

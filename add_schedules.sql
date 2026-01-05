-- Add Work Schedule columns to profiles
-- Run this in Supabase SQL Editor

alter table profiles 
add column if not exists work_schedule jsonb default '{"daily_hours": 8, "start_time": "09:00", "work_days": [1,2,3,4,5]}'::jsonb;

-- Explanation of JSONB structure:
-- {
--   "daily_hours": 8,         -- Total hours expected
--   "start_time": "09:00",    -- Expected entry time (for lateness calc)
--   "tolerance_minutes": 10,  -- Tolerance for lateness
--   "work_days": [1,2,3,4,5]  -- 0=Sun, 1=Mon, ... 6=Sat
-- }

-- Create Index for performance if needed
-- create index idx_profiles_company on profiles(company_id);

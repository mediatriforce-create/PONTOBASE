-- Clear work schedules for all profiles so tracking is opted-in
update profiles set work_schedule = null;

-- Remove the default constraint if possible (optional, but good practice)
alter table profiles alter column work_schedule drop default;

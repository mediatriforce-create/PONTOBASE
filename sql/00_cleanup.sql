-- 00_cleanup.sql
-- Use este script para LIMPAR o banco antes de recriar.

-- Descomente para apagar TODOS os usuários (CUIDADO)
-- DELETE FROM auth.users CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Limpar funções
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_confirm_email() CASCADE;
DROP FUNCTION IF EXISTS public.get_company_by_code(text) CASCADE;

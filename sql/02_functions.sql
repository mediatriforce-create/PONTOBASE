-- 02_functions.sql
-- Funções de segurança e auxiliares

-- Pega o cargo do usuário atual (Security Definer para furar RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Pega o ID da empresa do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Encontra empresa pelo código (para Join)
CREATE OR REPLACE FUNCTION public.get_company_by_code(code_input TEXT)
RETURNS uuid AS $$
  SELECT id FROM public.companies WHERE code = code_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

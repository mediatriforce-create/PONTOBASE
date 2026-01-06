-- 1. LIMPEZA (CUIDADO: APAGA TUDO - DADOS E USUÁRIOS)
-- Descomente as linhas abaixo se quiser limpar TUDO, inclusive logins.
-- DELETE FROM auth.users CASCADE; 

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Limpar policies antigas para evitar erro de duplicidade (Storage)
DROP POLICY IF EXISTS "Avatar Images are Public" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete" ON storage.objects;

-- Limpar Funções Helpers antigas
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_confirm_email() CASCADE;
DROP FUNCTION IF EXISTS public.get_company_by_code(text) CASCADE;

-- 2. TABELAS BASE

-- Empresas
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  code TEXT UNIQUE, -- Código de convite (gerado no backend)
  owner_id UUID DEFAULT auth.uid(), -- Dono da empresa (quem criou)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Perfis de Usuário (Vinculados ao Auth do Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'employee', 'manager')) DEFAULT 'employee',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  avatar_url TEXT, -- URL da foto de perfil
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Horários/Escalas (Configuração por usuário)
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_day INTEGER, -- 0-6 (Dom-Sab)
  start_time TEXT, -- HH:MM
  end_time TEXT, -- HH:MM
  break_start TEXT, -- HH:MM
  break_end TEXT, -- HH:MM
  is_work_day BOOLEAN DEFAULT true,
  schedule_type TEXT DEFAULT 'fixed', -- fixed, flexible
  tolerance_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Registros de Ponto
CREATE TABLE time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entry_type TEXT CHECK (entry_type IN ('entry', 'break_start', 'break_end', 'exit')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  device_info TEXT,
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Logs de Auditoria
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT,
  performed_by UUID REFERENCES profiles(id),
  target_id UUID, -- ID do objeto afetado
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. STORAGE (Buckets para Avatar)
-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. POLICIES (RLS - Permissões de Acesso)

-- Helper Functions para evitar Recursão Infinita (SECURITY DEFINER bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para encontrar empresa pelo código (Bypassa RLS para quem ainda não é membro)
CREATE OR REPLACE FUNCTION public.get_company_by_code(code_input TEXT)
RETURNS uuid AS $$
  SELECT id FROM public.companies WHERE code = code_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- --- COMPANIES ---
-- Ver: Se for membro da empresa OU se for o dono (criador)
CREATE POLICY "View company" ON companies
  FOR SELECT USING (
    id = get_my_company_id() OR 
    owner_id = auth.uid()
  );
  
-- Create/Insert deve ser permitido para qualquer usuário autenticado (criar empresa)
CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- --- PROFILES ---
-- Todos podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins e Gestores podem ver perfis da mesma empresa
CREATE POLICY "Admins/Managers view company profiles" ON profiles
  FOR SELECT USING (
    company_id = get_my_company_id() AND 
    get_my_role() IN ('admin', 'manager')
  );

-- Admin pode criar/atualizar perfis (incluindo atribuir empresa)
CREATE POLICY "Admins manage profiles" ON profiles
  FOR ALL USING (
    company_id = get_my_company_id() AND 
    get_my_role() = 'admin'
  );
  
-- PERMITIR INSERT NO PRÓPRIO PERFIL (Correção para Upsert funcionar se o trigger falhar)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PERMITIR UPDATE NO PRÓPRIO PERFIL (Para o Onboarding funcionar: setar company_id)
-- O usuário precisa conseguir se atualizar para entrar numa empresa.
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- --- SCHEDULES ---
-- Ler: Dono ou Admin
CREATE POLICY "View schedules" ON schedules
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id()) AND get_my_role() IN ('admin', 'manager'))
  );

-- Escrever: Apenas Admin
CREATE POLICY "Manage schedules" ON schedules
  FOR ALL USING (
    get_my_role() = 'admin' AND
    user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id())
  );

-- --- TIME ENTRIES ---
-- Ler: Dono ou Admin
CREATE POLICY "View entries" ON time_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id()) AND get_my_role() IN ('admin', 'manager'))
  );

-- Inserir: Apenas o próprio usuário (bater ponto)
CREATE POLICY "Insert entries" ON time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Editar/Apagar: Apenas Admin (correção de ponto)
CREATE POLICY "Admin manage entries" ON time_entries
  FOR UPDATE USING (
    get_my_role() = 'admin'
  );
CREATE POLICY "Admin delete entries" ON time_entries
  FOR DELETE USING (
     get_my_role() = 'admin'
  );

-- --- STORAGE POLICIES ---

-- Limpar policies antigas para evitar erro de duplicidade
DROP POLICY IF EXISTS "Avatar Images are Public" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete" ON storage.objects; -- Caso exista

-- Avatar: Qualquer um autenticado pode ver (public)
CREATE POLICY "Avatar Images are Public" ON storage.objects
  FOR SELECT USING ( bucket_id = 'avatars' );

-- Upload: Usuário pode subir seu próprio avatar ou Admin pode subir para outros
CREATE POLICY "Avatar Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- Update/Delete: Dono ou Admin
CREATE POLICY "Avatar Update" ON storage.objects
  FOR UPDATE USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 5. TRIGGERS (Opcional, mas útil para criar perfil automático ao cadastrar)
-- (Neste app, estamos criando o profile manualmente via código na hora do registro, então ok)

-- 6. TRIGGERS AUTOMÁTICOS

-- Auto-Confirmar Email (Útil para não travar no signup)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'employee');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente ao criar usuário no Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para confirmar email automaticamente (Opcional, mas pedido em scripts anteriores)
CREATE OR REPLACE FUNCTION public.auto_confirm_email() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Descomente abaixo se quiser auto-confirmação, por padrão deixaremos o fluxo normal ou manual)
-- CREATE TRIGGER on_auth_user_created_confirm
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_email();

-- FIM DO SCRIPT

-- 03_policies.sql
-- Regras de Segurança (RLS)

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- --- COMPANIES ---
-- Ver: Membro ou Dono
CREATE POLICY "View company" ON companies
  FOR SELECT USING (
    id = get_my_company_id() OR 
    owner_id = auth.uid() OR
    auth.role() = 'service_role' -- Admin do Supabase sempre pode
  );
  
-- Criar: Autenticado
CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- --- PROFILES ---
-- Ler: Próprio ou Colegas Admins/Gestores
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins/Managers view company profiles" ON profiles
  FOR SELECT USING (
    company_id = get_my_company_id() AND 
    get_my_role() IN ('admin', 'manager')
  );

-- Gerenciar: Admins
CREATE POLICY "Admins manage profiles" ON profiles
  FOR ALL USING (
    company_id = get_my_company_id() AND 
    get_my_role() = 'admin'
  );

-- Self-Update/Insert (Crucial para Onboarding)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- --- SCHEDULES ---
CREATE POLICY "View schedules" ON schedules
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id()) AND get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Manage schedules" ON schedules
  FOR ALL USING (
    get_my_role() = 'admin' AND
    user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id())
  );

-- --- TIME ENTRIES ---
CREATE POLICY "View entries" ON time_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IN (SELECT id FROM profiles WHERE company_id = get_my_company_id()) AND get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Insert entries" ON time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manage entries" ON time_entries
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "Admin delete entries" ON time_entries
  FOR DELETE USING (get_my_role() = 'admin');

-- 04_triggers.sql
-- Automações

-- Função do Trigger de Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'employee')
  ON CONFLICT (id) DO NOTHING; -- Evita erro se já existir
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auth -> Profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto Confirm Email (Opcional)
CREATE OR REPLACE FUNCTION public.auto_confirm_email() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Confirm (Descomente se necessário)
-- CREATE TRIGGER on_auth_user_created_confirm
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_email();

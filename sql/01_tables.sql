-- 01_tables.sql
-- Criação das tabelas base

-- Empresas
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  code TEXT UNIQUE, -- Código de convite
  owner_id UUID DEFAULT auth.uid(), -- Dono da empresa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Perfis
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'employee', 'manager')) DEFAULT 'employee',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  avatar_url TEXT, -- Apenas URL externa ou placeholder (sem upload de arquivo)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL -- Armazenado em UTC, convertido no front
);

-- Horários
CREATE TABLE public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_day INTEGER,
  start_time TEXT,
  end_time TEXT,
  break_start TEXT,
  break_end TEXT,
  is_work_day BOOLEAN DEFAULT true,
  schedule_type TEXT DEFAULT 'fixed',
  tolerance_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ponto
CREATE TABLE public.time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_type TEXT CHECK (entry_type IN ('entry', 'break_start', 'break_end', 'exit')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  device_info TEXT,
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  target_id UUID,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

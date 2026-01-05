-- ⚠️ SCRIPT DE LIMPEZA COMPLETA ⚠️
-- Escolha qual parte você quer rodar. Copie e cole apenas o bloco desejado no Supabase.

-- =======================================================
-- OPÇÃO 1: APENAS LIMPAR DADOS (PONTO E LOGS)
-- Use esta opção se você quer manter os usuários e empresas, mas zerar os registros de ponto.
-- =======================================================

truncate table time_entries cascade;
truncate table audit_logs cascade;

-- (Opcional) Resetar escalas dos funcionários para vazio
-- update profiles set work_schedule = null;

-- =======================================================
-- OPÇÃO 2: HARD RESET (LIMPAR TUDO, INCLUSIVE USUÁRIOS)
-- ⚠️ CUIDADO: Isso apaga empresas, perfis e tudo mais.
-- Você terá que criar conta e empresa do zero novamente.
-- (Os usuários no Auth do Supabase continuarão existindo, mas sem perfil no banco)
-- =======================================================

-- truncate table companies cascade;
-- truncate table profiles cascade; -- Isso vai apagar os perfis vinculados
-- truncate table time_entries cascade;
-- truncate table audit_logs cascade;

-- Nota: Para apagar os usuários do sistema de Login (Auth), você precisa ir manualmente no menu Authentication -> Users do Supabase e deletar lá.

-- ⚠️ LIMPEZA DE DADOS DE TESTE ⚠️
-- Este script apaga TODOS os registros de ponto e logs de auditoria.
-- Mantenha as tabelas 'profiles' e 'companies' intactas para não precisar criar contas novamente.

-- 1. Limpar registros de ponto
truncate table time_entries cascade;

-- 2. Limpar logs de auditoria
truncate table audit_logs cascade;

-- (Opcional) Se quiser resetar as escalas de trabalho também, descomente a linha abaixo:
-- update profiles set work_schedule = null;

-- TRIGGER PARA AUTO-CONFIRMAR USUÁRIOS
-- Isso permite login imediato após cadastro, ignorando a verificação de email.

create or replace function public.handle_new_user_confirmation()
returns trigger as $$
begin
  new.email_confirmed_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Remove trigger se já existir para evitar duplicidade
drop trigger if exists on_auth_user_created_for_confirmation on auth.users;

-- Cria o trigger
create trigger on_auth_user_created_for_confirmation
before insert on auth.users
for each row execute procedure public.handle_new_user_confirmation();

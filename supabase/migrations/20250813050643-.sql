-- Fix security linter warnings: set SECURITY DEFINER and empty search_path on trigger functions

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
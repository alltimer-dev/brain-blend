-- Conversations & messages schema with RLS and triggers (retry without IF NOT EXISTS)

-- 1) Tables
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- 3) RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Owner-only policies for conversations
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages accessible only through ownership of parent conversation
create policy "Users can view messages from their conversations"
  on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));

create policy "Users can insert messages into their conversations"
  on public.messages for insert
  with check (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));

create policy "Users can delete messages from their conversations"
  on public.messages for delete
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));

-- 4) Timestamps trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger on conversations before update
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.update_updated_at_column();

-- When a message is inserted, bump parent conversation.updated_at
create or replace function public.touch_conversation_updated_at()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger messages_after_insert_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_updated_at();
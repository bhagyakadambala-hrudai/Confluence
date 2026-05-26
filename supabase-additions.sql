-- Run this in your Supabase SQL Editor

-- Stars
create table if not exists public.starred_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  page_id uuid references public.pages on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, page_id)
);

create table if not exists public.starred_spaces (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  space_id uuid references public.spaces on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, space_id)
);

-- Watch
create table if not exists public.page_watches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  page_id uuid references public.pages on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, page_id)
);

-- Reactions
create table if not exists public.page_reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  page_id uuid references public.pages on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(user_id, page_id, emoji)
);

-- Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  actor_id uuid references auth.users on delete set null,
  type text not null check (type in ('page_updated','comment_added','space_invite','page_created')),
  page_id uuid references public.pages on delete cascade,
  space_id uuid references public.spaces on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.starred_pages enable row level security;
alter table public.starred_spaces enable row level security;
alter table public.page_watches enable row level security;
alter table public.page_reactions enable row level security;
alter table public.notifications enable row level security;

create policy "Users manage own page stars" on starred_pages for all using (user_id = auth.uid());
create policy "Users manage own space stars" on starred_spaces for all using (user_id = auth.uid());
create policy "Users manage own watches" on page_watches for all using (user_id = auth.uid());
create policy "Users manage own reactions insert" on page_reactions for insert with check (user_id = auth.uid());
create policy "Users delete own reactions" on page_reactions for delete using (user_id = auth.uid());
create policy "Reactions readable" on page_reactions for select using (true);
create policy "Users see own notifications" on notifications for all using (user_id = auth.uid());

-- Space overview content column
alter table public.spaces add column if not exists overview_content text default '';

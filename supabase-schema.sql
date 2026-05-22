-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (mirrors auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  email text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Spaces table
create table if not exists public.spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  emoji text default '📁',
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.spaces enable row level security;

create policy "Spaces visible to members"
  on spaces for select
  using (
    owner_id = auth.uid() or
    exists (
      select 1 from space_members
      where space_id = spaces.id and user_id = auth.uid()
    )
  );

create policy "Owners can update spaces"
  on spaces for update using (owner_id = auth.uid());

create policy "Owners can delete spaces"
  on spaces for delete using (owner_id = auth.uid());

create policy "Authenticated users can create spaces"
  on spaces for insert with check (auth.uid() = owner_id);

-- Space members table
create table if not exists public.space_members (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique (space_id, user_id)
);

alter table public.space_members enable row level security;

create policy "Members can view space members"
  on space_members for select using (
    user_id = auth.uid() or
    exists (
      select 1 from space_members sm2
      where sm2.space_id = space_members.space_id and sm2.user_id = auth.uid()
    )
  );

create policy "Space owners can manage members"
  on space_members for all using (
    exists (
      select 1 from spaces
      where id = space_members.space_id and owner_id = auth.uid()
    )
  );

create policy "Users can add themselves as owner"
  on space_members for insert with check (user_id = auth.uid());

-- Pages table
create table if not exists public.pages (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  parent_id uuid references public.pages on delete set null,
  title text not null default 'Untitled',
  content text not null default '',
  emoji text default '📄',
  author_id uuid references auth.users on delete set null,
  labels text[] default '{}',
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pages enable row level security;

create policy "Pages visible to space members"
  on pages for select using (
    exists (
      select 1 from space_members
      where space_id = pages.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = pages.space_id and owner_id = auth.uid()
    )
  );

create policy "Space members can create pages"
  on pages for insert with check (
    exists (
      select 1 from space_members
      where space_id = pages.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = pages.space_id and owner_id = auth.uid()
    )
  );

create policy "Space members can update pages"
  on pages for update using (
    exists (
      select 1 from space_members
      where space_id = pages.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = pages.space_id and owner_id = auth.uid()
    )
  );

create policy "Space members can delete pages"
  on pages for delete using (
    exists (
      select 1 from space_members
      where space_id = pages.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = pages.space_id and owner_id = auth.uid()
    )
  );

-- Page versions table
create table if not exists public.page_versions (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages on delete cascade not null,
  title text not null default 'Untitled',
  content text not null default '',
  version_number integer not null default 1,
  saved_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

alter table public.page_versions enable row level security;

create policy "Page versions visible to space members"
  on page_versions for select using (
    exists (
      select 1 from pages p
      join space_members sm on sm.space_id = p.space_id
      where p.id = page_versions.page_id and sm.user_id = auth.uid()
    ) or
    exists (
      select 1 from pages p
      join spaces s on s.id = p.space_id
      where p.id = page_versions.page_id and s.owner_id = auth.uid()
    )
  );

create policy "Space members can create versions"
  on page_versions for insert with check (
    exists (
      select 1 from pages p
      join space_members sm on sm.space_id = p.space_id
      where p.id = page_versions.page_id and sm.user_id = auth.uid()
    ) or
    exists (
      select 1 from pages p
      join spaces s on s.id = p.space_id
      where p.id = page_versions.page_id and s.owner_id = auth.uid()
    )
  );

-- Comments table
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages on delete cascade not null,
  author_id uuid references auth.users on delete cascade not null,
  parent_id uuid references public.comments on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments visible to space members"
  on comments for select using (
    exists (
      select 1 from pages p
      join space_members sm on sm.space_id = p.space_id
      where p.id = comments.page_id and sm.user_id = auth.uid()
    ) or
    exists (
      select 1 from pages p
      join spaces s on s.id = p.space_id
      where p.id = comments.page_id and s.owner_id = auth.uid()
    )
  );

create policy "Space members can create comments"
  on comments for insert with check (
    auth.uid() = author_id and (
      exists (
        select 1 from pages p
        join space_members sm on sm.space_id = p.space_id
        where p.id = comments.page_id and sm.user_id = auth.uid()
      ) or
      exists (
        select 1 from pages p
        join spaces s on s.id = p.space_id
        where p.id = comments.page_id and s.owner_id = auth.uid()
      )
    )
  );

create policy "Authors can update comments"
  on comments for update using (author_id = auth.uid());

create policy "Authors can delete comments"
  on comments for delete using (author_id = auth.uid());

-- Labels table
create table if not exists public.labels (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

alter table public.labels enable row level security;

create policy "Labels visible to space members"
  on labels for select using (
    exists (
      select 1 from space_members
      where space_id = labels.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = labels.space_id and owner_id = auth.uid()
    )
  );

create policy "Space members can create labels"
  on labels for insert with check (
    exists (
      select 1 from space_members
      where space_id = labels.space_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from spaces
      where id = labels.space_id and owner_id = auth.uid()
    )
  );

-- Enable Realtime on key tables
alter publication supabase_realtime add table public.spaces;
alter publication supabase_realtime add table public.pages;
alter publication supabase_realtime add table public.space_members;
alter publication supabase_realtime add table public.comments;

-- Storage bucket for images
insert into storage.buckets (id, name, public)
values ('page-images', 'page-images', true)
on conflict (id) do nothing;

create policy "Anyone can view page images"
  on storage.objects for select
  using (bucket_id = 'page-images');

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'page-images' and auth.role() = 'authenticated');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'page-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- AI Usage tracking
-- ============================================================
create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null default current_date,
  count int not null default 0,
  unique (user_id, day)
);

alter table ai_usage enable row level security;
create policy "Users manage own ai_usage" on ai_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Reflections
-- ============================================================
create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  surah int not null check (surah >= 1 and surah <= 114),
  ayah int not null check (ayah >= 1),
  content text not null check (char_length(content) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table reflections enable row level security;
create policy "Anyone can read reflections" on reflections for select using (true);
create policy "Users insert own reflections" on reflections for insert with check (auth.uid() = user_id);
create policy "Users update own reflections" on reflections for update using (auth.uid() = user_id);
create policy "Users delete own reflections" on reflections for delete using (auth.uid() = user_id);

create index idx_reflections_user on reflections(user_id, created_at desc);
create index idx_reflections_ayah on reflections(surah, ayah);

-- ============================================================
-- Reflection likes
-- ============================================================
create table if not exists reflection_likes (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid references reflections(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (reflection_id, user_id)
);

alter table reflection_likes enable row level security;
create policy "Anyone can read likes" on reflection_likes for select using (true);
create policy "Users insert own likes" on reflection_likes for insert with check (auth.uid() = user_id);
create policy "Users delete own likes" on reflection_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- Reflection comments
-- ============================================================
create table if not exists reflection_comments (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid references reflections(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null check (char_length(content) > 0),
  created_at timestamptz default now()
);

alter table reflection_comments enable row level security;
create policy "Anyone can read comments" on reflection_comments for select using (true);
create policy "Users insert own comments" on reflection_comments for insert with check (auth.uid() = user_id);
create policy "Users delete own comments" on reflection_comments for delete using (auth.uid() = user_id);

create index idx_comments_reflection on reflection_comments(reflection_id, created_at);

-- ============================================================
-- Follows
-- ============================================================
create table if not exists follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table follows enable row level security;
create policy "Anyone can read follows" on follows for select using (true);
create policy "Users manage own follows" on follows for insert with check (auth.uid() = follower_id);
create policy "Users delete own follows" on follows for delete using (auth.uid() = follower_id);

create index idx_follows_following on follows(following_id);

-- ============================================================
-- Profiles functions
-- ============================================================
create or replace function public.get_profile(uid uuid)
returns json language sql security definer as $$
  select json_build_object(
    'id', id,
    'full_name', coalesce(raw_user_meta_data->>'full_name', 'Anonymous'),
    'avatar_url', raw_user_meta_data->>'avatar_url'
  )
  from auth.users where id = uid;
$$;

create or replace function public.get_profiles(uids uuid[])
returns json language sql security definer as $$
  select coalesce(json_agg(json_build_object(
    'id', id,
    'full_name', coalesce(raw_user_meta_data->>'full_name', 'Anonymous'),
    'avatar_url', raw_user_meta_data->>'avatar_url'
  )), '[]'::json)
  from auth.users where id = any(uids);
$$;

-- ============================================================
-- AI usage increment function
-- ============================================================
create or replace function public.increment_ai_usage(uid uuid, d date)
returns void language plpgsql security definer as $$
begin
  insert into ai_usage (user_id, day, count)
  values (uid, d, 1)
  on conflict (user_id, day)
  do update set count = ai_usage.count + 1;
end;
$$;

-- ============================================================
-- Devotion: Prayers
-- ============================================================
create table if not exists devotion_prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null,
  prayer text not null check (prayer in ('fajr','dhuhr','asr','maghrib','isha')),
  completed boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id, day, prayer)
);

alter table devotion_prayers enable row level security;
create policy "Users manage own prayers" on devotion_prayers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Devotion: Dhikr
-- ============================================================
create table if not exists devotion_dhikr (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null default current_date,
  type text not null,
  label text,
  count int not null default 0,
  target int,
  created_at timestamptz default now()
);

alter table devotion_dhikr enable row level security;
create policy "Users manage own dhikr" on devotion_dhikr
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Devotion: Fasting
-- ============================================================
create table if not exists devotion_fasting (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null,
  type text not null default 'voluntary',
  completed boolean not null default true,
  unique (user_id, day)
);

alter table devotion_fasting enable row level security;
create policy "Users manage own fasting" on devotion_fasting
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Devotion: Duas
-- ============================================================
create table if not exists devotion_duas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table devotion_duas enable row level security;
create policy "Users manage own duas" on devotion_duas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AIVO database setup. Paste into Supabase > SQL Editor > New query > Run.

-- ============ TABLES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text, phone text,
  age int, sex text, height_cm numeric, weight_kg numeric,
  fitness_goal text, activity_level text, workouts_per_week int,
  dietary_preferences text[] default '{}', health_notes text,
  onboarded boolean not null default false,
  xp int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('workout','meal')),
  exercises_performed text, meals_logged text, calories_consumed int,
  logged_at timestamptz not null default now()
);

create table if not exists public.workout_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null, sets int, repetitions text, schedule text,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text, meal_recommendation text not null, calories int,
  protein_g numeric, carbs_g numeric, fat_g numeric, recipes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_content text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY: each user sees only their own rows ============
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array['activity_logs','workout_plans','meal_plans','ai_recommendations','progress'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============ NEW SIGNUP -> PROFILE ROW (uses the username and phone from the signup form) ============
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, phone)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for accounts that already exist (like the one you just made)
insert into public.profiles (id, username, phone)
select id, raw_user_meta_data->>'username', raw_user_meta_data->>'phone' from auth.users
on conflict (id) do nothing;

-- ============ XP: +50 workout, +10 meal, +20 weigh-in ============
create or replace function public.award_log_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set xp = xp + (case new.kind when 'workout' then 50 else 10 end) where id = new.user_id;
  return new;
end $$;

create or replace function public.award_weighin_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set xp = xp + 20 where id = new.user_id;
  return new;
end $$;

drop trigger if exists xp_on_log on public.activity_logs;
create trigger xp_on_log after insert on public.activity_logs for each row execute function public.award_log_xp();
drop trigger if exists xp_on_weighin on public.progress;
create trigger xp_on_weighin after insert on public.progress for each row execute function public.award_weighin_xp();

-- ============ STOP USERS EDITING THEIR OWN XP FROM THE APP ============
-- (Remove these two lines if your generate-plan function must write xp with a user token.)
revoke update on public.profiles from authenticated;
grant update (username, phone, age, sex, height_cm, weight_kg, fitness_goal, activity_level,
              workouts_per_week, dietary_preferences, health_notes, onboarded)
  on public.profiles to authenticated;

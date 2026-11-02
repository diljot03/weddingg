-- ─────────────────────────────────────────────────────────────────────────────
-- Wedding Guest Companion · Supabase schema
-- Run once in Supabase → SQL Editor. Then enable Anonymous sign-ins
-- (Authentication → Sign In / Providers → Anonymous) and change the host code
-- at the bottom of this file.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Guests ---------------------------------------------------------------------
create table if not exists public.guests (
  id               uuid primary key,             -- = auth.uid() of the anonymous session
  name             text not null check (char_length(name) between 1 and 80),
  phone            text,
  side             text not null check (side in ('bride', 'groom')),
  avatar_url       text,
  face_descriptor  jsonb,                          -- 128-number face embedding for photo matching
  role             text not null default 'guest' check (role in ('guest', 'host')),
  created_at       timestamptz not null default now()
);

-- Secrets nobody can read through the API (no RLS policies = no access).
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);

create or replace function public.is_host() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from guests where id = auth.uid() and role = 'host');
$$;

create or replace function public.claim_host(code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from app_secrets where key = 'host_code' and value = code) then
    update guests set role = 'host' where id = auth.uid();
    return found;
  end if;
  return false;
end $$;

-- Content tables ---------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  author_name text,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null default auth.uid(),
  sender_name   text not null,
  sender_avatar text,
  side          text,
  body          text not null check (char_length(body) between 1 and 1000),
  created_at    timestamptz not null default now()
);

create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  uploader_id   uuid not null default auth.uid(),
  uploader_name text,
  url           text not null,
  path          text,
  event_id      text,
  hashtags      text[] not null default '{}',
  faces         jsonb,                            -- array of face embeddings found in the photo
  created_at    timestamptz not null default now()
);

create table if not exists public.photo_likes (
  photo_id   uuid references public.photos(id) on delete cascade,
  guest_id   uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (photo_id, guest_id)
);

create table if not exists public.songs (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null default auth.uid(),
  requester_name text,
  title          text not null,
  artist         text,
  artwork_url    text,
  played         boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.song_votes (
  song_id    uuid references public.songs(id) on delete cascade,
  guest_id   uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (song_id, guest_id)
);

create table if not exists public.performances (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null default auth.uid(),
  performer  text not null,
  song_title text,
  audio_url  text,
  audio_name text,
  status     text not null default 'upcoming' check (status in ('upcoming', 'on stage', 'done')),
  created_at timestamptz not null default now()
);

create table if not exists public.trivia_answers (
  guest_id    uuid not null default auth.uid(),
  question_id text not null,
  choice      int  not null,
  correct     boolean not null,
  side        text,
  guest_name  text,
  created_at  timestamptz not null default now(),
  primary key (guest_id, question_id)
);

create table if not exists public.poll_votes (
  guest_id   uuid not null default auth.uid(),
  poll_id    text not null,
  option     int  not null,
  created_at timestamptz not null default now(),
  primary key (guest_id, poll_id)
);

-- Host-editable configuration: wedding, events, logistics, theme, games.
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row level security -----------------------------------------------------------
alter table public.guests         enable row level security;
alter table public.app_secrets    enable row level security;
alter table public.announcements  enable row level security;
alter table public.messages       enable row level security;
alter table public.photos         enable row level security;
alter table public.photo_likes    enable row level security;
alter table public.songs          enable row level security;
alter table public.song_votes     enable row level security;
alter table public.performances   enable row level security;
alter table public.trivia_answers enable row level security;
alter table public.poll_votes     enable row level security;
alter table public.settings       enable row level security;

-- Guests can never change their own role directly; only claim_host() can.
revoke update on public.guests from anon, authenticated;
-- (id is listed because upserts re-send it; RLS still pins it to auth.uid())
grant update (id, name, phone, side, avatar_url, face_descriptor) on public.guests to authenticated;

create policy "guests read"   on public.guests for select to authenticated using (true);
create policy "guests insert" on public.guests for insert to authenticated with check (id = auth.uid() and role = 'guest');
create policy "guests update" on public.guests for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "guests delete" on public.guests for delete to authenticated using (id = auth.uid());

create policy "ann read"   on public.announcements for select to authenticated using (true);
create policy "ann write"  on public.announcements for insert to authenticated with check (public.is_host());
create policy "ann delete" on public.announcements for delete to authenticated using (public.is_host());

create policy "msg read"   on public.messages for select to authenticated using (true);
create policy "msg write"  on public.messages for insert to authenticated with check (sender_id = auth.uid());
create policy "msg delete" on public.messages for delete to authenticated using (sender_id = auth.uid() or public.is_host());

create policy "photo read"   on public.photos for select to authenticated using (true);
create policy "photo write"  on public.photos for insert to authenticated with check (uploader_id = auth.uid());
create policy "photo update" on public.photos for update to authenticated using (uploader_id = auth.uid());
create policy "photo delete" on public.photos for delete to authenticated using (uploader_id = auth.uid() or public.is_host());

create policy "like read"   on public.photo_likes for select to authenticated using (true);
create policy "like write"  on public.photo_likes for insert to authenticated with check (guest_id = auth.uid());
create policy "like delete" on public.photo_likes for delete to authenticated using (guest_id = auth.uid());

create policy "song read"   on public.songs for select to authenticated using (true);
create policy "song write"  on public.songs for insert to authenticated with check (requester_id = auth.uid());
create policy "song update" on public.songs for update to authenticated using (public.is_host());
create policy "song delete" on public.songs for delete to authenticated using (requester_id = auth.uid() or public.is_host());

create policy "vote read"   on public.song_votes for select to authenticated using (true);
create policy "vote write"  on public.song_votes for insert to authenticated with check (guest_id = auth.uid());
create policy "vote delete" on public.song_votes for delete to authenticated using (guest_id = auth.uid());

create policy "perf read"   on public.performances for select to authenticated using (true);
create policy "perf write"  on public.performances for insert to authenticated with check (guest_id = auth.uid());
create policy "perf update" on public.performances for update to authenticated using (public.is_host());
create policy "perf delete" on public.performances for delete to authenticated using (guest_id = auth.uid() or public.is_host());

create policy "trivia read"  on public.trivia_answers for select to authenticated using (true);
create policy "trivia write" on public.trivia_answers for insert to authenticated with check (guest_id = auth.uid());

create policy "poll read"  on public.poll_votes for select to authenticated using (true);
create policy "poll write" on public.poll_votes for insert to authenticated with check (guest_id = auth.uid());

create policy "settings read"   on public.settings for select to anon, authenticated using (true);
create policy "settings insert" on public.settings for insert to authenticated with check (public.is_host());
create policy "settings update" on public.settings for update to authenticated using (public.is_host());

-- Realtime ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.guests, public.announcements, public.messages, public.photos, public.photo_likes,
  public.songs, public.song_votes, public.performances, public.trivia_answers,
  public.poll_votes, public.settings;

-- Storage (photos, avatars, Sangeet audio) -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 26214400)  -- 25 MB per file
on conflict (id) do nothing;

create policy "media read"   on storage.objects for select using (bucket_id = 'media');
create policy "media upload" on storage.objects for insert to authenticated with check (bucket_id = 'media');

-- Host code ---------------------------------------------------------------------
-- CHANGE THIS before sharing the app. Hosts type it in the "Invite code" box.
insert into public.app_secrets (key, value) values ('host_code', 'CHANGE-ME-2027')
on conflict (key) do update set value = excluded.value;

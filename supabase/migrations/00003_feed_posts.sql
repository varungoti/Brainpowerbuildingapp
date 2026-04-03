-- Community feed posts with RLS. Moderators: insert rows into public.feed_moderators (user_id = auth.users.id).
-- App uses this table when Supabase Auth is configured and the signed-in user has a Supabase session (uuid id).

create table if not exists public.feed_moderators (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.feed_moderators enable row level security;

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  community_id text not null default 'default',
  channel text not null check (channel in ('general', 'ai_news', 'parent_tips', 'announcements')),
  title text not null,
  body text not null,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  author_display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_posts_community_channel_created_idx
  on public.feed_posts (community_id, channel, created_at desc);

alter table public.feed_posts enable row level security;

create policy "feed_posts_select_authenticated"
  on public.feed_posts
  for select
  to authenticated
  using (true);

create policy "feed_posts_insert_own"
  on public.feed_posts
  for insert
  to authenticated
  with check (auth.uid() = author_user_id);

create policy "feed_posts_update_author_or_moderator"
  on public.feed_posts
  for update
  to authenticated
  using (
    auth.uid() = author_user_id
    or exists (select 1 from public.feed_moderators m where m.user_id = auth.uid())
  )
  with check (
    auth.uid() = author_user_id
    or exists (select 1 from public.feed_moderators m where m.user_id = auth.uid())
  );

create policy "feed_posts_delete_author_or_moderator"
  on public.feed_posts
  for delete
  to authenticated
  using (
    auth.uid() = author_user_id
    or exists (select 1 from public.feed_moderators m where m.user_id = auth.uid())
  );

grant select, insert, update, delete on public.feed_posts to authenticated;

create or replace function public.set_feed_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feed_posts_set_updated_at on public.feed_posts;
create trigger feed_posts_set_updated_at
  before update on public.feed_posts
  for each row
  execute function public.set_feed_posts_updated_at();

-- Realtime: in Dashboard → Database → Publications, add public.feed_posts to supabase_realtime,
-- or run: alter publication supabase_realtime add table public.feed_posts;
--
-- Moderators (can edit/delete any post): insert into public.feed_moderators (user_id)
--   select id from auth.users where lower(email) = lower('ops@yourdomain.com');

-- Adds RLS policies for public.feed_moderators.
-- Background: 00003_feed_posts.sql enabled RLS on feed_moderators but defined no policies,
-- which silently broke the moderator `exists (...)` checks in feed_posts update/delete policies
-- (those sub-queries run in the caller's security context, so with RLS enabled and no SELECT
-- policy the row is invisible and no user is ever treated as a moderator).
--
-- We expose only the caller's own moderator row. Writes remain service-role only, which is
-- the correct admin path (insert moderators via SQL / service role). This keeps the list of
-- moderator user_ids from leaking across authenticated users.

alter table public.feed_moderators enable row level security;

drop policy if exists "feed_moderators_select_self" on public.feed_moderators;
create policy "feed_moderators_select_self"
  on public.feed_moderators
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes explicitly closed to authenticated — only service_role (which bypasses RLS) may mutate.
drop policy if exists "feed_moderators_no_insert_authenticated" on public.feed_moderators;
create policy "feed_moderators_no_insert_authenticated"
  on public.feed_moderators
  for insert
  to authenticated
  with check (false);

drop policy if exists "feed_moderators_no_update_authenticated" on public.feed_moderators;
create policy "feed_moderators_no_update_authenticated"
  on public.feed_moderators
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "feed_moderators_no_delete_authenticated" on public.feed_moderators;
create policy "feed_moderators_no_delete_authenticated"
  on public.feed_moderators
  for delete
  to authenticated
  using (false);

grant select on public.feed_moderators to authenticated;

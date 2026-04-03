-- One-shot: enable Realtime for community feeds (idempotent).
alter publication supabase_realtime add table public.feed_posts;

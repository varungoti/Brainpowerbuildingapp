-- 00019_marketing_cron.sql
-- Schedules the social-publish-worker every 5 minutes via pg_cron + pg_net.
--
-- Safety / portability:
--   * pg_cron is available on Supabase but must be enabled per project. We
--     attempt to enable it; if your project hasn't toggled the extension on
--     Dashboard → Database → Extensions, the CREATE EXTENSION will succeed on
--     hosted Supabase but no-op on self-hosted Postgres without the extension
--     installed. The migration as a whole is wrapped in a DO block that
--     catches "extension not available" so it never blocks the rest of the
--     migration chain.
--   * The cron entry uses pg_net.http_post to call the function URL. Both
--     `app.settings.supabase_url` and `app.settings.cron_secret` are read from
--     the database GUCs which Supabase populates per project. If your project
--     does not expose them, set them once with:
--         alter database postgres set "app.settings.supabase_url"   = 'https://YOUR_REF.supabase.co';
--         alter database postgres set "app.settings.cron_secret"     = '<paste>';
--     and re-run this migration (it's idempotent).
--   * Running the worker at 5-min cadence costs ~9k invocations / month — well
--     within the Supabase free tier function limit.

do $$
declare
  v_supabase_url text;
  v_cron_secret  text;
begin
  -- Best-effort enable. Skip silently if pg_cron / pg_net aren't available so
  -- this migration never breaks `supabase db push` on environments without
  -- the extension toggled.
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron not enabled (skipping social-publish-worker schedule). Detail: %', sqlerrm;
    return;
  end;

  begin
    create extension if not exists pg_net;
  exception when others then
    raise notice 'pg_net not enabled (skipping social-publish-worker schedule). Detail: %', sqlerrm;
    return;
  end;

  -- Read secrets from per-database GUCs. If unset, document and bail without
  -- creating a half-broken cron job.
  begin
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_cron_secret  := current_setting('app.settings.cron_secret', true);
  exception when others then
    v_supabase_url := null;
    v_cron_secret  := null;
  end;

  if v_supabase_url is null or v_supabase_url = '' then
    raise notice 'app.settings.supabase_url not set; not scheduling worker. Run: alter database postgres set "app.settings.supabase_url" = ''https://YOUR_REF.supabase.co'';';
    return;
  end if;

  -- Idempotency: drop existing job by name before re-creating.
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'marketing-os-social-worker';

  perform cron.schedule(
    'marketing-os-social-worker',
    '*/5 * * * *',
    format(
      $cmd$
      select net.http_post(
        url := %L || '/functions/v1/social-publish-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_supabase_url,
      coalesce(v_cron_secret, '')
    )
  );
end $$;

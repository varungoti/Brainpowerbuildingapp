-- Grant superadmin to varungoti@gmail.com when that Auth user already exists.
-- If the user has not signed up yet, run: pnpm run admin:seed-user

insert into public.admin_users (user_id, email, role, disabled_at)
select id, email, 'superadmin'::admin_role, null
from auth.users
where lower(email) = lower('varungoti@gmail.com')
on conflict (user_id) do update
set
  email = excluded.email,
  role = 'superadmin'::admin_role,
  disabled_at = null;

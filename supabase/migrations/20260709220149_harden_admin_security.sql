-- =============================================================
-- M&B Trend — Harden Admin Security
-- Description:
--   - Enforce admin checks inside privileged admin RPCs.
--   - Remove public execution from internal finance helper RPCs.
--   - Keep callable admin RPCs on app_metadata-only authorization.
-- =============================================================

create or replace function public.remove_admin_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove admin role';
  end if;

  update auth.users
  set raw_app_meta_data = raw_app_meta_data - 'role'
  where id = target_user_id;
end;
$$;

comment on function public.remove_admin_role is
  'Removes admin role from a user. Only callable by admins.';

create or replace function public.get_admin_users()
returns table (id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can list admin users';
  end if;

  return query
  select u.id, u.email::text, u.created_at
  from auth.users u
  where u.raw_app_meta_data ->> 'role' = 'admin'
  order by u.created_at desc;
end;
$$;

comment on function public.get_admin_users is
  'Returns list of admin users. Only callable by admins.';

revoke execute on function public.update_stock_from_purchase(uuid) from anon, authenticated;
revoke execute on function public.auto_create_cash_movement(text, numeric, text, text, uuid) from anon, authenticated;

-- Populate customer names from Supabase Auth metadata for OAuth users.
-- Google commonly provides "full_name" or "name"; email/password signup
-- keeps using the app-provided "nombre" and "apellido" metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := trim(coalesce(
    metadata->>'nombre',
    metadata->>'full_name',
    metadata->>'name',
    ''
  ));
  derived_first_name text := '';
  derived_last_name text := '';
begin
  if display_name <> '' then
    derived_first_name := split_part(display_name, ' ', 1);
    derived_last_name := nullif(trim(substr(display_name, length(derived_first_name) + 1)), '');
  end if;

  insert into public.customers (user_id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(nullif(metadata->>'nombre', ''), derived_first_name, ''),
    coalesce(nullif(metadata->>'apellido', ''), derived_last_name, ''),
    nullif(metadata->>'telefono', '')
  );

  return new;
end;
$$;

update public.customers c
set
  first_name = coalesce(
    nullif(c.first_name, ''),
    nullif(u.raw_user_meta_data->>'nombre', ''),
    nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1), ''),
    c.first_name
  ),
  last_name = coalesce(
    nullif(c.last_name, ''),
    nullif(u.raw_user_meta_data->>'apellido', ''),
    nullif(trim(substr(
      coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
      length(split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1)) + 1
    )), ''),
    c.last_name
  )
from auth.users u
where c.user_id = u.id
  and (
    coalesce(nullif(c.first_name, ''), nullif(c.last_name, '')) is null
  )
  and coalesce(
    nullif(u.raw_user_meta_data->>'nombre', ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', '')
  ) is not null;

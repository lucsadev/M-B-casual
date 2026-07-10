-- Extend OAuth customer hydration with contact metadata when providers expose it.
-- Google only returns phone/address when the scopes are approved and the account
-- actually has that data available.

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
  derived_phone text := coalesce(
    nullif(metadata->>'telefono', ''),
    nullif(metadata->>'phone', ''),
    nullif(metadata->>'phone_number', ''),
    nullif(metadata->>'phoneNumber', ''),
    nullif(metadata#>>'{phone_numbers,0,value}', ''),
    nullif(metadata#>>'{phoneNumbers,0,value}', ''),
    nullif(metadata#>>'{phone_numbers,0,canonicalForm}', ''),
    nullif(metadata#>>'{phoneNumbers,0,canonicalForm}', '')
  );
  derived_address jsonb := coalesce(
    metadata->'address',
    metadata->'domicilio',
    metadata->'location',
    metadata#>'{addresses,0}'
  );
begin
  if display_name <> '' then
    derived_first_name := split_part(display_name, ' ', 1);
    derived_last_name := nullif(trim(substr(display_name, length(derived_first_name) + 1)), '');
  end if;

  insert into public.customers (user_id, first_name, last_name, phone, address)
  values (
    new.id,
    coalesce(nullif(metadata->>'nombre', ''), derived_first_name, ''),
    coalesce(nullif(metadata->>'apellido', ''), derived_last_name, ''),
    derived_phone,
    derived_address
  );

  return new;
end;
$$;

update public.customers c
set
  phone = coalesce(
    nullif(c.phone, ''),
    nullif(u.raw_user_meta_data->>'telefono', ''),
    nullif(u.raw_user_meta_data->>'phone', ''),
    nullif(u.raw_user_meta_data->>'phone_number', ''),
    nullif(u.raw_user_meta_data->>'phoneNumber', ''),
    nullif(u.raw_user_meta_data#>>'{phone_numbers,0,value}', ''),
    nullif(u.raw_user_meta_data#>>'{phoneNumbers,0,value}', ''),
    nullif(u.raw_user_meta_data#>>'{phone_numbers,0,canonicalForm}', ''),
    nullif(u.raw_user_meta_data#>>'{phoneNumbers,0,canonicalForm}', '')
  ),
  address = coalesce(
    c.address,
    u.raw_user_meta_data->'address',
    u.raw_user_meta_data->'domicilio',
    u.raw_user_meta_data->'location',
    u.raw_user_meta_data#>'{addresses,0}'
  )
from auth.users u
where c.user_id = u.id
  and (
    c.phone is null
    or c.phone = ''
    or c.address is null
  )
  and (
    coalesce(
      nullif(u.raw_user_meta_data->>'telefono', ''),
      nullif(u.raw_user_meta_data->>'phone', ''),
      nullif(u.raw_user_meta_data->>'phone_number', ''),
      nullif(u.raw_user_meta_data->>'phoneNumber', ''),
      nullif(u.raw_user_meta_data#>>'{phone_numbers,0,value}', ''),
      nullif(u.raw_user_meta_data#>>'{phoneNumbers,0,value}', ''),
      nullif(u.raw_user_meta_data#>>'{phone_numbers,0,canonicalForm}', ''),
      nullif(u.raw_user_meta_data#>>'{phoneNumbers,0,canonicalForm}', '')
    ) is not null
    or coalesce(
      u.raw_user_meta_data->'address',
      u.raw_user_meta_data->'domicilio',
      u.raw_user_meta_data->'location',
      u.raw_user_meta_data#>'{addresses,0}'
    ) is not null
  );

update public.users_profile
set phone = '+972545246426'
where role = 'super_admin'
  and (
    email = 'admin@konanut.local'
    or phone in (
      '050-7000001',
      '+972507000001',
      '972507000001'
    )
  );

update auth.users
set phone = '+972545246426'
where email = 'admin@konanut.local'
  and (
    phone is null
    or phone = ''
    or phone in (
      '050-7000001',
      '+972507000001',
      '972507000001'
    )
  );

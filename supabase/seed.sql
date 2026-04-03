do $$
declare
  auth_instance_id constant uuid := '00000000-0000-0000-0000-000000000000';
  admin_user_id constant uuid := '11111111-1111-1111-1111-111111111111';
  viewer_north_user_id constant uuid := '22222222-2222-2222-2222-222222222222';
  viewer_center_user_id constant uuid := '33333333-3333-3333-3333-333333333333';
  settlement_1_id constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  settlement_2_id constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
  settlement_3_id constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
  settlement_4_id constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4';
  training_1_id constant uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
  training_2_id constant uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2';
  training_3_id constant uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3';
begin
  truncate table
    public.feedbacks,
    public.training_settlements,
    public.alerts,
    public.settlement_rankings,
    public.trainings,
    public.user_settlements,
    public.settlements
  restart identity cascade;

  delete from auth.identities
  where user_id in (admin_user_id, viewer_north_user_id, viewer_center_user_id);

  delete from auth.users
  where id in (admin_user_id, viewer_north_user_id, viewer_center_user_id);

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    email_change_token_current,
    email_change_confirm_status,
    phone,
    phone_change,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  )
  values
    (
      auth_instance_id,
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@konanut.local',
      crypt('Konanut123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      0,
      null,
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"מנהל מערכת"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      auth_instance_id,
      viewer_north_user_id,
      'authenticated',
      'authenticated',
      'viewer.north@konanut.local',
      crypt('Konanut123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      0,
      null,
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"רכז צפון"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      auth_instance_id,
      viewer_center_user_id,
      'authenticated',
      'authenticated',
      'viewer.center@konanut.local',
      crypt('Konanut123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      0,
      null,
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"רכז מרכז"}'::jsonb,
      false,
      false,
      now(),
      now()
    );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      gen_random_uuid(),
      admin_user_id,
      format(
        '{"sub":"%s","email":"%s","email_verified":true}',
        admin_user_id,
        'admin@konanut.local'
      )::jsonb,
      'email',
      'admin@konanut.local',
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      viewer_north_user_id,
      format(
        '{"sub":"%s","email":"%s","email_verified":true}',
        viewer_north_user_id,
        'viewer.north@konanut.local'
      )::jsonb,
      'email',
      'viewer.north@konanut.local',
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      viewer_center_user_id,
      format(
        '{"sub":"%s","email":"%s","email_verified":true}',
        viewer_center_user_id,
        'viewer.center@konanut.local'
      )::jsonb,
      'email',
      'viewer.center@konanut.local',
      now(),
      now(),
      now()
    );

  update public.users_profile
  set
    full_name = 'מנהל מערכת',
    email = 'admin@konanut.local',
    phone = '050-7000001',
    role = 'super_admin',
    is_active = true
  where id = admin_user_id;

  update public.users_profile
  set
    full_name = 'רכז צפון',
    email = 'viewer.north@konanut.local',
    phone = '050-7000002',
    role = 'viewer',
    is_active = true
  where id = viewer_north_user_id;

  update public.users_profile
  set
    full_name = 'רכז מרכז',
    email = 'viewer.center@konanut.local',
    phone = '050-7000003',
    role = 'viewer',
    is_active = true
  where id = viewer_center_user_id;

  insert into public.settlements (
    id,
    name,
    regional_council,
    area,
    coordinator_name,
    coordinator_phone,
    is_active
  )
  values
    (
      settlement_1_id,
      'קדמת הגליל',
      'גליל עליון',
      'צפון',
      'אורי כהן',
      '050-1230001',
      true
    ),
    (
      settlement_2_id,
      'נווה רימון',
      'בקעת הירדן',
      'בקעה',
      'שחר לוי',
      '050-1230002',
      true
    ),
    (
      settlement_3_id,
      'גבעות כרמל',
      'חוף הכרמל',
      'מרכז',
      'מאיה אביטל',
      '050-1230003',
      true
    ),
    (
      settlement_4_id,
      'נחל צורים',
      'מטה בנימין',
      'יהודה ושומרון',
      'רועי הדר',
      '050-1230004',
      false
    );

  insert into public.user_settlements (user_id, settlement_id)
  values
    (viewer_north_user_id, settlement_1_id),
    (viewer_north_user_id, settlement_2_id),
    (viewer_center_user_id, settlement_3_id);

  insert into public.trainings (
    id,
    title,
    training_type,
    location,
    instructor_id,
    training_date,
    training_time,
    status,
    notes
  )
  values
    (
      training_1_id,
      'מטווח מחזור אביב',
      'מטווח',
      'מטווח מחוז צפון',
      admin_user_id,
      current_date + 7,
      '09:00',
      'מתוכנן',
      'דגש על ירי לילה ותרגילי מעבר מעמדות.'
    ),
    (
      training_2_id,
      'תרגיל הגנת יישוב אזורי',
      'הגנת יישוב',
      'קדמת הגליל',
      admin_user_id,
      current_date - 14,
      '18:30',
      'הושלם',
      'התרגיל כלל הזנקת כוח מהירה, חלוקת גזרות ותקשורת.'
    ),
    (
      training_3_id,
      'ריענון חירום רבעוני',
      'חירום',
      'מרכז הדרכה חוף הכרמל',
      admin_user_id,
      current_date + 21,
      '20:00',
      'מתוכנן',
      'מפגש משותף ליישובים תחת אחריות אזורית.'
    );

  insert into public.training_settlements (training_id, settlement_id)
  values
    (training_1_id, settlement_1_id),
    (training_1_id, settlement_2_id),
    (training_2_id, settlement_1_id),
    (training_2_id, settlement_3_id),
    (training_3_id, settlement_3_id);

  insert into public.feedbacks (
    training_id,
    settlement_id,
    instructor_id,
    rating,
    comment
  )
  values
    (
      training_2_id,
      settlement_1_id,
      admin_user_id,
      5,
      'שיתוף פעולה גבוה, הגעה בזמן ועמידה מלאה ביעדים.'
    ),
    (
      training_2_id,
      settlement_3_id,
      admin_user_id,
      4,
      'רמת ביצוע טובה, מומלץ לחזק את נוהל פתיחת הציר.'
    );

  insert into public.alerts (
    type,
    title,
    description,
    severity,
    related_settlement_id,
    related_training_id,
    status
  )
  values
    (
      'כשירות',
      'חוסר השלמת מטווח חצי שנתי',
      'היישוב נווה רימון טרם השלים מטווח לחציון הנוכחי.',
      'high',
      settlement_2_id,
      training_1_id,
      'open'
    ),
    (
      'לו"ז',
      'ריענון חירום נקבע לחודש הבא',
      'תרגיל חירום אזורי נקבע עבור גבעות כרמל.',
      'medium',
      settlement_3_id,
      training_3_id,
      'open'
    ),
    (
      'מערכת',
      'דוח דירוגים עודכן',
      'חישוב דירוגי היישובים לחציון הנוכחי הושלם בהצלחה.',
      'low',
      null,
      null,
      'resolved'
    );

  insert into public.settlement_rankings (
    settlement_id,
    half_year_period,
    shooting_completed,
    defense_completed,
    training_score,
    feedback_score,
    final_score,
    ranking_level
  )
  values
    (
      settlement_1_id,
      '2026-H1',
      true,
      true,
      92,
      95,
      94,
      'זהב'
    ),
    (
      settlement_2_id,
      '2026-H1',
      false,
      true,
      68,
      72,
      70,
      'כסף'
    ),
    (
      settlement_3_id,
      '2026-H1',
      true,
      true,
      88,
      84,
      86,
      'זהב'
    );
end
$$;

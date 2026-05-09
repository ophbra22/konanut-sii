// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1';

type UserProfile = {
  assigned_plaga: string | null;
  approval_status: string | null;
  full_name: string | null;
  id: string;
  is_active: boolean;
  role: string;
};

type TrainingRow = {
  end_time: string | null;
  id: string;
  instructor_id: string | null;
  title: string;
  training_date: string;
  training_time: string | null;
  training_type: string;
};

type SettlementRow = {
  area: string;
  council_id: string | null;
  id: string;
  name: string;
  regional_council: string | null;
  council?: { name: string; plaga_name: string | null } | null;
};

type PushTokenRow = {
  expo_push_token: string;
  user_id: string;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function getIsraelDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
  }).format(date);
}

function getTimeLabel(value: string | null) {
  return value ? value.slice(0, 5) : 'ללא שעה';
}

async function assertAuthorized(request: Request, allowCron: boolean) {
  const authorization = request.headers.get('Authorization') ?? '';
  const bearer = authorization.replace(/^Bearer\s+/i, '').trim();

  if (allowCron && CRON_SECRET && bearer === CRON_SECRET) {
    return null;
  }

  if (!bearer || bearer === SUPABASE_SERVICE_ROLE_KEY) {
    throw new Response('Unauthorized', { headers: corsHeaders, status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(bearer);

  if (error || !data.user) {
    throw new Response('Unauthorized', { headers: corsHeaders, status: 401 });
  }

  return data.user.id;
}

async function listTrainingSettlements(trainingId: string) {
  const { data, error } = await supabase
    .from('training_settlements')
    .select(
      `
        settlement:settlements (
          id,
          name,
          area,
          regional_council,
          council_id,
          council:regional_councils (
            name,
            plaga_name
          )
        )
      `
    )
    .eq('training_id', trainingId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => item.settlement)
    .filter((settlement): settlement is SettlementRow => Boolean(settlement));
}

async function getRelevantUsersForTraining(
  training: TrainingRow,
  settlements: SettlementRow[],
  excludeUserId: string | null
) {
  const [
    { data: profiles, error: profilesError },
    { data: userSettlements, error: userSettlementsError },
    { data: userCouncils, error: userCouncilsError },
  ] = await Promise.all([
    supabase
      .from('users_profile')
      .select('id, full_name, role, assigned_plaga, is_active, approval_status')
      .eq('is_active', true)
      .eq('approval_status', 'approved'),
    supabase.from('user_settlements').select('user_id, settlement_id'),
    supabase.from('user_regional_councils').select('user_id, regional_council'),
  ]);

  if (profilesError) {
    throw profilesError;
  }

  if (userSettlementsError) {
    throw userSettlementsError;
  }

  if (userCouncilsError) {
    throw userCouncilsError;
  }

  const settlementIds = new Set(settlements.map((settlement) => settlement.id));
  const regionalCouncils = new Set(settlements.map((settlement) => normalize(settlement.regional_council)));
  const plagas = new Set(
    settlements.map((settlement) => normalize(settlement.council?.plaga_name ?? settlement.area))
  );
  const settlementUsers = new Set(
    (userSettlements ?? [])
      .filter((link) => settlementIds.has(link.settlement_id))
      .map((link) => link.user_id)
  );
  const councilUsers = new Set(
    (userCouncils ?? [])
      .filter((link) => regionalCouncils.has(normalize(link.regional_council)))
      .map((link) => link.user_id)
  );

  return ((profiles ?? []) as UserProfile[]).filter((profile) => {
    if (excludeUserId && profile.id === excludeUserId) {
      return false;
    }

    if (['super_admin', 'razar', 'sarazar'].includes(profile.role)) {
      return true;
    }

    if (profile.role === 'instructor') {
      return profile.id === training.instructor_id;
    }

    if (['machbal', 'eshkol_officer'].includes(profile.role)) {
      return councilUsers.has(profile.id);
    }

    if (profile.role === 'mashkabat') {
      return settlementUsers.has(profile.id);
    }

    if (['mepag', 'samepag'].includes(profile.role)) {
      return plagas.has(normalize(profile.assigned_plaga));
    }

    return false;
  });
}

async function sendExpoPushMessages(messages: Array<Record<string, unknown>>) {
  const chunks: Array<Array<Record<string, unknown>>> = [];

  for (let index = 0; index < messages.length; index += 100) {
    chunks.push(messages.slice(index, index + 100));
  }

  const responses = [];

  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      body: JSON.stringify(chunk),
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    responses.push(await response.json());
  }

  return responses;
}

async function sendTrainingPush(params: {
  body: string;
  excludeUserId: string | null;
  notificationType: 'new_feedback' | 'training_today';
  title: string;
  training: TrainingRow;
}) {
  const settlements = await listTrainingSettlements(params.training.id);
  const users = await getRelevantUsersForTraining(
    params.training,
    settlements,
    params.excludeUserId
  );
  const userIds = users.map((user) => user.id);

  if (!userIds.length) {
    return { sent: 0 };
  }

  const { data: tokens, error: tokensError } = await supabase
    .from('user_push_tokens')
    .select('user_id, expo_push_token')
    .in('user_id', userIds)
    .eq('is_active', true);

  if (tokensError) {
    throw tokensError;
  }

  const messages = [];
  let skipped = 0;

  for (const token of (tokens ?? []) as PushTokenRow[]) {
    const { data: existingDelivery, error: existingDeliveryError } = await supabase
      .from('notification_deliveries')
      .select('id')
      .eq('user_id', token.user_id)
      .eq('training_id', params.training.id)
      .eq('type', params.notificationType)
      .eq('push_token', token.expo_push_token)
      .gte('sent_at', `${getIsraelDateKey()}T00:00:00+02:00`)
      .limit(1)
      .maybeSingle();

    if (existingDeliveryError) {
      throw existingDeliveryError;
    }

    if (existingDelivery) {
      skipped += 1;
      continue;
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        action_params: { training_id: params.training.id },
        action_screen: 'training_details',
        body: params.body,
        severity: params.notificationType === 'training_today' ? 'warning' : 'success',
        status: 'unread',
        title: params.title,
        training_id: params.training.id,
        type: params.notificationType === 'training_today' ? 'upcoming_training' : 'new_feedback',
        user_id: token.user_id,
      })
      .select('id')
      .single();

    if (notificationError) {
      throw notificationError;
    }

    messages.push({
      body: params.body,
      data: {
        notification_id: notification.id,
        screen: 'training_details',
        training_id: params.training.id,
        type: params.notificationType,
      },
      sound: 'default',
      title: params.title,
      to: token.expo_push_token,
    });

    await supabase.from('notification_deliveries').insert({
      notification_id: notification.id,
      push_token: token.expo_push_token,
      status: 'queued',
      training_id: params.training.id,
      type: params.notificationType,
      user_id: token.user_id,
    });
  }

  if (!messages.length) {
    return { sent: 0, skipped };
  }

  const expoResponses = await sendExpoPushMessages(messages);

  return {
    expoResponses,
    sent: messages.length,
    skipped,
  };
}

async function sendTodayTrainingReminders() {
  const today = getIsraelDateKey();
  const { data: trainings, error } = await supabase
    .from('trainings')
    .select('id, title, training_type, training_date, training_time, end_time, instructor_id')
    .eq('training_date', today)
    .neq('status', 'בוטל');

  if (error) {
    throw error;
  }

  const results = [];

  for (const training of (trainings ?? []) as TrainingRow[]) {
    results.push(
      await sendTrainingPush({
        body: `היום מתקיים ${training.title} ב-${getTimeLabel(training.training_time)}`,
        excludeUserId: null,
        notificationType: 'training_today',
        title: 'תזכורת לאימון היום',
        training,
      })
    );
  }

  return results;
}

async function sendNewFeedbackPush(trainingId: string, excludeUserId: string | null) {
  const { data: training, error } = await supabase
    .from('trainings')
    .select('id, title, training_type, training_date, training_time, end_time, instructor_id')
    .eq('id', trainingId)
    .single();

  if (error) {
    throw error;
  }

  return sendTrainingPush({
    body: `הוזן משוב חדש עבור אימון ${training.title}`,
    excludeUserId,
    notificationType: 'new_feedback',
    title: 'התקבל משוב חדש',
    training: training as TrainingRow,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const eventType = body.eventType ?? 'training_today';

    if (eventType === 'training_today') {
      await assertAuthorized(request, true);
      const result = await sendTodayTrainingReminders();

      return Response.json({ result, success: true }, { headers: corsHeaders });
    }

    if (eventType === 'new_feedback') {
      const callerUserId = await assertAuthorized(request, false);
      const result = await sendNewFeedbackPush(
        String(body.training_id ?? ''),
        body.exclude_user_id ? String(body.exclude_user_id) : callerUserId
      );

      return Response.json({ result, success: true }, { headers: corsHeaders });
    }

    return Response.json(
      { message: 'Unsupported eventType', success: false },
      { headers: corsHeaders, status: 400 }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      { message: 'Failed to send notifications', success: false },
      { headers: corsHeaders, status: 500 }
    );
  }
});

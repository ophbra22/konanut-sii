# send-training-reminders

Edge Function for Expo push notifications.

## Deploy

```bash
supabase functions deploy send-training-reminders
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
supabase secrets set CRON_SECRET="a-long-random-secret"
```

Do not commit secrets. `SUPABASE_URL` is provided by Supabase Functions.

## Daily Cron

Schedule a daily call at 08:00 Israel time. If your scheduler uses UTC, use
05:00 UTC during Israel summer time and 06:00 UTC during Israel winter time, or
use a scheduler that supports the `Asia/Jerusalem` timezone.

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://<project-ref>.supabase.co/functions/v1/send-training-reminders \
  -d '{"eventType":"training_today"}'
```

The function prevents duplicate daily push sends per user, token, training, and
notification type using `notification_deliveries`.

## New Feedback Push

The mobile app invokes this function after a feedback save:

```json
{
  "eventType": "new_feedback",
  "training_id": "...",
  "exclude_user_id": "..."
}
```

The function validates the user JWT, resolves users by the existing training
scope, and does not send the push to the feedback author.

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { markNotificationAsRead } from '@/src/services/notificationsService';
import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';

type PushNavigationTarget =
  | { pathname: '/settlements/[settlementId]'; params: { settlementId: string } }
  | { pathname: '/trainings/[trainingId]'; params: { trainingId: string } };

type PushNavigate = (target: PushNavigationTarget) => void;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  );
}

export async function savePushToken(token: string) {
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw createDataAccessError(userError, 'לא ניתן לזהות את המשתמש לשמירת פוש');
  }

  const userId = data.user?.id;

  if (!userId) {
    return;
  }

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      device_name: Device.deviceName ?? null,
      expo_push_token: token,
      is_active: true,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    {
      onConflict: 'user_id,expo_push_token',
    }
  );

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לשמור את טוקן הפוש');
  }
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const projectId = getProjectId();

  if (!projectId) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'default',
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (existingPermissions.status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  await savePushToken(token);

  return token;
}

export async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate?: PushNavigate
) {
  const data = response.notification.request.content.data as {
    notification_id?: string;
    screen?: string;
    settlement_id?: string;
    training_id?: string;
    type?: string;
  };

  if (data.notification_id) {
    await markNotificationAsRead(data.notification_id);
  }

  if (!navigate) {
    return;
  }

  if (data.training_id) {
    navigate({
      params: { trainingId: data.training_id },
      pathname: '/trainings/[trainingId]',
    });
    return;
  }

  if (data.settlement_id) {
    navigate({
      params: { settlementId: data.settlement_id },
      pathname: '/settlements/[settlementId]',
    });
  }
}

export function addNotificationResponseListener(navigate: PushNavigate) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    void handleNotificationResponse(response, navigate);
  });
}

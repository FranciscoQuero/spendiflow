import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppSettings } from '../types';
import { t } from '../locales/i18n';

/**
 * Identificador estable de la notificación programada: nos permite
 * cancelarla y reprogramarla sin tener que enumerar todas las notificaciones
 * pendientes de la app.
 */
export const DAILY_REMINDER_IDENTIFIER = 'spendiflow-daily-reminder';

/** Canal de Android para el recordatorio diario (requerido en Android 8+). */
export const DAILY_REMINDER_ANDROID_CHANNEL_ID = 'daily-reminder';

export type DailyReminderSyncResult =
  | { status: 'disabled' }
  | { status: 'scheduled' }
  | { status: 'permission-denied' };

/**
 * Construye el trigger diario repetitivo para expo-notifications a partir de
 * una hora/minuto. Función pura y testeable de forma aislada.
 */
export const buildDailyReminderTrigger = (
  hour: number,
  minute: number
): Notifications.DailyTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour,
  minute,
  channelId: Platform.OS === 'android' ? DAILY_REMINDER_ANDROID_CHANNEL_ID : undefined,
});

/**
 * Contenido i18n de la notificación, según el idioma activo en `i18n`.
 * Función pura y testeable de forma aislada.
 */
export const getDailyReminderContent = (): { title: string; body: string } => ({
  title: t('settings.dailyReminderNotificationTitle'),
  body: t('settings.dailyReminderNotificationBody'),
});

/** Formatea hour/minute como "HH:mm" para mostrarlo en el selector de ajustes. */
export const formatReminderTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/**
 * Handler básico de notificaciones: hace que la notificación también se
 * muestre con la app en primer plano. Se debe llamar una única vez, lo antes
 * posible en el arranque de la app.
 */
export const configureNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

/**
 * Sincroniza el recordatorio diario local con `settings.dailyReminder`:
 * - Cancela cualquier notificación diaria programada previamente.
 * - Si el recordatorio está desactivado (o no configurado), no hace nada más.
 * - Si está activado, pide permiso de notificaciones si hace falta y
 *   reprograma la notificación diaria repetitiva con el hour/minute actual.
 *
 * Se debe llamar cada vez que cambie `settings.dailyReminder` y una vez al
 * arrancar la app (para que sobreviva a reinstalaciones del binario nativo,
 * que en Android borran las notificaciones programadas).
 */
export const syncDailyReminder = async (
  settings: AppSettings
): Promise<DailyReminderSyncResult> => {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDENTIFIER).catch(() => {
    // No había ninguna notificación programada con este identificador: no es un error.
  });

  const reminder = settings.dailyReminder;
  if (!reminder || !reminder.enabled) {
    return { status: 'disabled' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DAILY_REMINDER_ANDROID_CHANNEL_ID, {
      name: t('settings.dailyReminder'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.status === 'granted';
  if (!granted && current.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.status === 'granted';
  }

  if (!granted) {
    return { status: 'permission-denied' };
  }

  const content = getDailyReminderContent();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDENTIFIER,
    content: {
      title: content.title,
      body: content.body,
    },
    trigger: buildDailyReminderTrigger(reminder.hour, reminder.minute),
  });

  return { status: 'scheduled' };
};

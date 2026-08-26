import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// `../locales/i18n` pulls in `i18n-js`, which in turn depends on the ESM-only
// `make-plural` package. The project's Jest config doesn't transform that
// package (no other currently-tested module reaches it, so this gap was
// never hit before), so it fails to parse under jest-expo. Mocking `t` here
// keeps this suite focused on `reminders.ts`'s own logic — which i18n keys
// it asks for — without depending on that unrelated pre-existing gap.
jest.mock('../locales/i18n', () => ({
  t: (key: string) => key,
}));

// eslint-disable-next-line import/first
import { buildDailyReminderTrigger, formatReminderTime, getDailyReminderContent } from './reminders';

describe('buildDailyReminderTrigger', () => {
  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('builds a repeating daily trigger with the given hour/minute', () => {
    const trigger = buildDailyReminderTrigger(21, 30);

    expect(trigger.type).toBe(Notifications.SchedulableTriggerInputTypes.DAILY);
    expect(trigger.hour).toBe(21);
    expect(trigger.minute).toBe(30);
  });

  it('omits channelId on iOS', () => {
    Platform.OS = 'ios';
    const trigger = buildDailyReminderTrigger(9, 0);
    expect(trigger.channelId).toBeUndefined();
  });

  it('sets the Android notification channel id on Android', () => {
    Platform.OS = 'android';
    const trigger = buildDailyReminderTrigger(9, 0);
    expect(trigger.channelId).toBe('daily-reminder');
  });
});

describe('getDailyReminderContent', () => {
  it('asks i18n for the reminder notification title and body', () => {
    const content = getDailyReminderContent();
    expect(content.title).toBe('settings.dailyReminderNotificationTitle');
    expect(content.body).toBe('settings.dailyReminderNotificationBody');
  });
});

describe('formatReminderTime', () => {
  it('zero-pads hour and minute', () => {
    expect(formatReminderTime(9, 5)).toBe('09:05');
  });

  it('formats the suggested default time', () => {
    expect(formatReminderTime(21, 30)).toBe('21:30');
  });

  it('handles midnight', () => {
    expect(formatReminderTime(0, 0)).toBe('00:00');
  });
});

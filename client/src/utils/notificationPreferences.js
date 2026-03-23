const STORAGE_KEY = 'hostelLifeNotificationPreferences';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  expenses: true,
  chores: true,
  bills: true
};

export const getNotificationPreferences = () => {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const saveNotificationPreferences = (preferences) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};

export const buildDailyNotificationKey = (type, id) => {
  const today = new Date().toISOString().slice(0, 10);
  return `hostelLife:notification:${type}:${id}:${today}`;
};

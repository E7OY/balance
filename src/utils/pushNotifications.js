const notificationsEnabledKey = (profileId) => `finance:${profileId}:pushNotifications`;

export const getPushNotificationsEnabled = (profileId) => {
  try {
    return localStorage.getItem(notificationsEnabledKey(profileId)) === 'true';
  } catch (error) {
    console.error('No se pudo leer la preferencia de notificaciones.', error);
    return false;
  }
};

export const setPushNotificationsEnabled = (profileId, enabled) => {
  try {
    if (enabled) {
      localStorage.setItem(notificationsEnabledKey(profileId), 'true');
    } else {
      localStorage.removeItem(notificationsEnabledKey(profileId));
    }
    window.dispatchEvent(new CustomEvent('balance:push-notifications-changed'));
  } catch (error) {
    console.error('No se pudo guardar la preferencia de notificaciones.', error);
    throw new Error('No se pudo guardar la preferencia de notificaciones en este dispositivo.');
  }
};

export const requestPushNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Este navegador no admite notificaciones.');
  }
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador no admite notificaciones de la app.');
  }
  if (!window.isSecureContext) {
    throw new Error('Las notificaciones requieren una conexión segura (HTTPS).');
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
};

export const showAppNotification = async ({ title, body, tag, url = '/', action = 'dashboard' }) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador no admite notificaciones de la app.');
  }

  const options = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag,
    data: { url, action },
  };
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
  return true;
};

export const claimDailyCheck = (profileId, date) => {
  const key = `finance:${profileId}:lastNoSpendNotification`;
  try {
    if (localStorage.getItem(key) === date) return false;
    localStorage.setItem(key, date);
    return true;
  } catch (error) {
    console.error('No se pudo comprobar el último aviso diario.', error);
    return false;
  }
};

export const releaseDailyCheck = (profileId, date) => {
  const key = `finance:${profileId}:lastNoSpendNotification`;
  try {
    if (localStorage.getItem(key) === date) localStorage.removeItem(key);
  } catch (error) {
    console.error('No se pudo liberar el aviso diario para reintentar.', error);
  }
};

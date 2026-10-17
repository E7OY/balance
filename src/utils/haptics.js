import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const hapticPatterns = {
  tap: [20],
  income: [25, 35, 25, 35, 45],
  heavy: [80],
};

export const triggerHaptic = (pattern = 'tap') => {
  if (Capacitor.isNativePlatform()) {
    const haptic = pattern === 'income'
      ? Haptics.notification({ type: NotificationType.Success })
      : Haptics.impact({
        style: pattern === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light,
      });
    haptic.catch((error) => console.error('No se pudo activar la respuesta háptica.', error));
    return;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(hapticPatterns[pattern] || hapticPatterns.tap);
  }
};

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const hapticPatterns = {
  tap: [20],
  income: [25, 35, 25, 35, 45],
  heavy: [80],
};

export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    if (type === 'light') {
      // Impacto muy corto e instantáneo (estilo iOS/TR)
      navigator.vibrate(10);
    } else if (type === 'medium') {
      navigator.vibrate(20);
    } else if (type === 'selection') {
      navigator.vibrate(8);
    }
  } catch (error) {
    // Si el navegador bloquea la vibración, silenciamos el error
  }
}
import { useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

export function useElasticScroll(maxPull = 85, resistance = 0.32) {
  const [pullY, setPullY] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const touchStartY = useRef(null);
  const hasTriggeredLimit = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    touchStartY.current = e.touches[0].clientY;
    setIsSnapping(false);
    hasTriggeredLimit.current = false;
  }, []);

  const onTouchMove = useCallback((e, scrollElement) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    const isAtTop = scrollElement ? scrollElement.scrollTop <= 0 : true;

    // Solo activamos resistencia cuando estamos en el tope y seguimos tirando hacia abajo
    if (isAtTop && deltaY > 0) {
      // Fórmula de resistencia no lineal (cuanto más tiras, más cuesta)
      const damped = Math.min(maxPull, deltaY * resistance);
      setPullY(damped);

      // Vibración sutil cuando llegas al punto de máxima tensión
      if (damped >= maxPull * 0.85 && !hasTriggeredLimit.current) {
        triggerHaptic();
        hasTriggeredLimit.current = true;
      }
    }
  }, [maxPull, resistance]);

  const onTouchEnd = useCallback(() => {
    touchStartY.current = null;
    setIsSnapping(true);
    setPullY(0);
  }, []);

  return {
    pullY,
    isSnapping,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/helpers';

const ANIMATION_DURATION = 1100;

const AnimatedCurrency = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    const targetValue = Number.isFinite(value) ? value : 0;
    const startValue = currentValueRef.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || targetValue === startValue) {
      currentValueRef.current = targetValue;
      setDisplayValue(targetValue);
      return undefined;
    }

    let startTime;
    let frameId;
    const animate = (timestamp) => {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / ANIMATION_DURATION, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      const nextValue = startValue + ((targetValue - startValue) * easedProgress);
      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{formatCurrency(displayValue)}</span>;
};

export default AnimatedCurrency;
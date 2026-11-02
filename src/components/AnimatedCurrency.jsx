import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/helpers';

const ANIMATION_DURATION = 1500;
const INITIAL_VALUE_RATIO = 0.55;

const AnimatedCurrency = ({ value }) => {
  const initialValue = Number.isFinite(value) ? value * INITIAL_VALUE_RATIO : 0;
  const [displayValue, setDisplayValue] = useState(initialValue);
  const currentValueRef = useRef(initialValue);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const targetValue = Number.isFinite(value) ? value : 0;
    const startValue = hasAnimatedRef.current
      ? currentValueRef.current
      : targetValue * INITIAL_VALUE_RATIO;
    hasAnimatedRef.current = true;
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
      const easedProgress = 1 - ((1 - progress) ** 5);
      const nextValue = startValue + ((targetValue - startValue) * easedProgress);
      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <span className="animated-currency">
      {Array.from(formatCurrency(displayValue), (character, index) => (
        <span
          key={index}
          className="animated-currency__character"
          style={{ animationDelay: `${index * 24}ms` }}
        >
          {character}
        </span>
      ))}
    </span>
  );
};

export default AnimatedCurrency;
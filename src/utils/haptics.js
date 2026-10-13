const hapticPatterns = {
  tap: [10],
  income: [8, 24, 14, 18, 22],
  heavy: [55],
};

export const triggerHaptic = (pattern = 'tap') => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(hapticPatterns[pattern] || hapticPatterns.tap);
  }
};

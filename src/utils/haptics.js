const hapticPatterns = {
  tap: [20],
  income: [25, 35, 25, 35, 45],
  heavy: [80],
};

export const triggerHaptic = (pattern = 'tap') => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(hapticPatterns[pattern] || hapticPatterns.tap);
  }
};

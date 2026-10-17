import { useRef } from 'react';

const useSwipeToClose = (onClose) => {
  const touchStart = useRef(null);

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    let scrollable = event.target;
    while (scrollable) {
      const { overflowY } = window.getComputedStyle(scrollable);
      if (
        (overflowY === 'auto' || overflowY === 'scroll')
        && scrollable.scrollHeight > scrollable.clientHeight
      ) {
        if (scrollable.scrollTop > 0) {
          touchStart.current = null;
          return;
        }
        break;
      }
      if (scrollable === event.currentTarget) break;
      scrollable = scrollable.parentElement;
    }

    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    if (touch.clientY - start.y > 80 && Math.abs(touch.clientX - start.x) < 60) {
      onClose();
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: () => { touchStart.current = null; },
  };
};

export default useSwipeToClose;

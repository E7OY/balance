import React, { useEffect, useState } from 'react';

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 450);
    const hideTimer = window.setTimeout(() => setVisible(false), 750);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: '#0075EB',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          boxShadow: '0 14px 34px rgba(0, 117, 235, 0.38)',
        }}
      >
        A
      </div>
      <span
        style={{
          marginTop: '14px',
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}
      >
        Axiom
      </span>
    </div>
  );
};

export default SplashScreen;
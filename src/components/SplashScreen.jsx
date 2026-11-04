import React, { useEffect, useState } from 'react';
import './splashScreen.css';

const HOLD_MS = 900;
const FADE_MS = 400;

const prefersReducedMotion = () => (
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
);

// Pantalla negra con logo y nombre al entrar en la app (solo al arrancar, no al navegar).
const SplashScreen = ({ logo = 'favicon.svg', name = 'Axion' }) => {
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? 'gone' : 'visible'));
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (phase === 'visible') {
      const timer = window.setTimeout(() => setPhase('leaving'), HOLD_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'leaving') {
      const timer = window.setTimeout(() => setPhase('gone'), FADE_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`splash-screen ${phase === 'leaving' ? 'leaving' : ''}`}
      aria-hidden="true"
      onClick={() => setPhase('leaving')}
    >
      {logoFailed ? (
        <span className="splash-logo splash-logo-fallback">{name.slice(0, 1).toUpperCase()}</span>
      ) : (
        <img className="splash-logo" src={logo} alt="" onError={() => setLogoFailed(true)} />
      )}
      <span className="splash-name">{name}</span>
    </div>
  );
};

export default SplashScreen;
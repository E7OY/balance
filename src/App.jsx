import React, { useEffect, useState, useRef } from 'react';
import { useFinance } from './context/FinanceContext';
import HomeOverview from './components/HomeOverview';
import MovementsView from './components/MovementsView';
import InvestmentsOverview from './components/InvestmentsOverview';
import TransactionForm from './components/TransactionForm';
import InvestmentForm from './components/InvestmentForm';
import ProfileSwitcher from './components/ProfileSwitcher';
import CategoryLimitsForm from './components/CategoryLimitsForm';
import SplashScreen from './components/SplashScreen';
import { triggerHaptic } from './utils/haptics';
import { getFromLocalStorage, saveToLocalStorage } from './utils/localStorage';

const homeTabs = ['expenses', 'investments', 'movements'];
const getPreferredHomeTab = (profileId) => {
  const savedTab = getFromLocalStorage(`finance:${profileId}:defaultHomeTab`);
  return homeTabs.includes(savedTab) ? savedTab : 'expenses';
};
const getInvestmentsEnabled = (profileId) => (
  getFromLocalStorage(`finance:${profileId}:showInvestments`) === true
);

const getStoredProfileName = (profileId) => {
  const saved = getFromLocalStorage(`finance:${profileId}:displayName`);
  return typeof saved === 'string' ? saved.trim() : '';
};

function Icon({ name, size = 17 }) {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.6" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const PIN_STORAGE_KEY = 'balance-pin';
const PIN_ATTEMPTS_KEY = 'balance-pin-attempts';
const PIN_LENGTH = 4;
const PIN_LOCK_AFTER_MS = 30000;
const MAX_PIN_ATTEMPTS = 5;

const bytesToHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const readStoredPin = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY));
    return stored && typeof stored.salt === 'string' && typeof stored.hash === 'string' ? stored : null;
  } catch {
    return null;
  }
};

const readPinAttempts = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PIN_ATTEMPTS_KEY));
    return { count: Number(stored?.count) || 0, lockedUntil: Number(stored?.lockedUntil) || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
};

const writePinAttempts = (attempts) => localStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify(attempts));

// El PIN nunca se guarda en claro: solo un hash con sal (PBKDF2 cuando el navegador lo permite).
const hashPin = async (pin, salt) => {
  if (window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const key = await window.crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 },
      key,
      256,
    );
    return bytesToHex(new Uint8Array(bits));
  }
  let hash = 5381;
  const text = `${salt}:${pin}`;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0;
  return hash.toString(16);
};

const createPinData = async (pin) => {
  const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await hashPin(pin, salt) };
};

const verifyPin = async (pin, pinData) => (await hashPin(pin, pinData.salt)) === pinData.hash;

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

const PIN_STYLES = `
.pin-screen{position:fixed;inset:0;z-index:5000;display:flex;flex-direction:column;box-sizing:border-box;padding:calc(30px + env(safe-area-inset-top,0px)) 26px calc(18px + env(safe-area-inset-bottom,0px));background:#fff;color:#090909;font-family:inherit}
.stage.dark .pin-screen{background:#000;color:#f5f5f2}
.pin-header h1{margin:0;font-size:23px;line-height:1.2;font-weight:800;letter-spacing:-.02em}
.pin-header p{margin:10px 0 0;color:#b4b7bf;font-size:13px;line-height:1.45;font-weight:500}
.stage.dark .pin-header p{color:#7d7d79}
.pin-dots-area{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0}
.pin-dots{display:flex;gap:30px}
.pin-dots span{width:15px;height:15px;border-radius:50%;background:#d9dce2;transition:background .12s ease,transform .12s ease}
.pin-dots span.filled{background:#090909;transform:scale(1.05)}
.stage.dark .pin-dots span{background:#33332f}
.stage.dark .pin-dots span.filled{background:#f5f5f2}
.pin-dots.shake{animation:pin-shake .42s ease}
.pin-error{min-height:34px;margin:22px 0 0;max-width:280px;color:#df242b;font-size:12px;font-weight:600;text-align:center;line-height:1.4}
.pin-keypad{width:100%;max-width:360px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);row-gap:6px}
.pin-keypad button{height:64px;border:0;border-radius:16px;background:transparent;color:inherit;font-size:25px;font-weight:700;font-family:inherit;display:grid;place-items:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.pin-keypad button:active:not(:disabled){background:rgba(0,0,0,.06)}
.stage.dark .pin-keypad button:active:not(:disabled){background:rgba(255,255,255,.1)}
.pin-keypad button:disabled{opacity:.35}
@keyframes pin-shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
.pin-sheet-layer{position:fixed;inset:0;z-index:5000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.35);animation:pin-fade .2s ease-out;transition:opacity .22s ease-out}
.stage.dark .pin-sheet-layer{background:rgba(0,0,0,.6)}
.pin-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:460px;height:min(680px,92dvh);border-radius:27px 27px 0 0;background:#fff;color:#090909;box-shadow:0 -8px 30px rgba(0,0,0,.12);touch-action:none;will-change:transform;animation:pin-sheet-up .28s ease-out}
.stage.dark .pin-sheet{background:#0d0d0d;color:#f5f5f2}
.pin-sheet-handle{flex:none;width:34px;height:4px;margin:10px auto 0;border-radius:4px;background:#d5d5d2;cursor:grab}
.stage.dark .pin-sheet-handle{background:#444441}
.pin-screen.in-sheet,.stage.dark .pin-screen.in-sheet{position:static;inset:auto;flex:1;min-height:0;z-index:auto;background:transparent;padding:18px 26px calc(18px + env(safe-area-inset-bottom,0px))}
@keyframes pin-sheet-up{from{transform:translateY(100%)}}
@keyframes pin-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.pin-dots.shake,.pin-sheet,.pin-sheet-layer{animation:none}}
`;

function PinScreen({ title, subtitle, pin, error, isShaking, disabled, onDigit, onBackspace, inSheet }) {
  const handlersRef = useRef({});
  handlersRef.current = { onDigit, onBackspace };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handlersRef.current.onDigit(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handlersRef.current.onBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'add-expense') {
      openForm('expense');
      // Limpia la URL para que no se vuelva a abrir al recargar
      window.history.replaceState(null, '', '/');
    } else if (action === 'add-income') {
      openForm('income');
      window.history.replaceState(null, '', '/');
    }
  }, []);

  return (
    <div
      className={`pin-screen ${inSheet ? 'in-sheet' : ''}`}
      role={inSheet ? undefined : 'dialog'}
      aria-modal={inSheet ? undefined : 'true'}
      aria-labelledby={inSheet ? undefined : 'pin-title'}
    >
      <style>{PIN_STYLES}</style>
      <div className="pin-header mt-6">
        <h1 id="pin-title">{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="pin-dots-area">
        <div
          className={`pin-dots ${isShaking ? 'shake' : ''}`}
          role="img"
          aria-label={`${pin.length} de ${PIN_LENGTH} dígitos introducidos`}
        >
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <span key={index} className={index < pin.length ? 'filled' : ''} />
          ))}
        </div>
        <p className="pin-error" role="alert">{error}</p>
      </div>
      <div className="pin-keypad">
        {PIN_KEYS.map((key, index) => (key === '' ? (
          <span key={`spacer-${index}`} />
        ) : (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-label={key === 'backspace' ? 'Borrar' : undefined}
            onClick={() => (key === 'backspace' ? onBackspace() : onDigit(key))}
          >
            {key === 'backspace' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M10 7l-5 5 5 5" />
              </svg>
            ) : key}
          </button>
        )))}
      </div>
    </div>
  );
}

// Ventana deslizable: se cierra arrastrando hacia abajo, tocando fuera o con Escape (sin cruz)
function PinSheet({ onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragRef = useRef({ startY: 0, lastY: 0, startTime: 0, active: false });
  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);

  const requestClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') requestCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const finishDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setIsDragging(false);
    const distance = drag.lastY - drag.startY;
    const velocity = distance / Math.max(1, performance.now() - drag.startTime);
    if (distance > 110 || (distance > 40 && velocity > 0.6)) requestClose();
    else setDragY(0);
  };

  const handlePointerDown = (event) => {
    if (event.target.closest?.('.pin-keypad')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { startY: event.clientY, lastY: event.clientY, startTime: performance.now(), active: true };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.lastY = event.clientY;
    setDragY(Math.max(0, event.clientY - drag.startY));
  };

  return (
    <div className="pin-sheet-layer" style={{ opacity: isClosing ? 0 : 1 }} onMouseDown={requestClose}>
      <section
        className="pin-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-title"
        style={{
          transform: isClosing ? 'translateY(100%)' : dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.22s ease-out',
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="pin-sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

// mode: 'unlock' (entrar), 'setup' (crear), 'change' (cambiar) o 'remove' (desactivar)
function PinFlow({ mode, pinData, onUnlocked, onSaved, onRemoved, onClose }) {
  const [step, setStep] = useState(mode === 'setup' ? 'create' : 'verify');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(() => readPinAttempts().lockedUntil);
  const [now, setNow] = useState(() => Date.now());
  const isLockedOut = lockedUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  useEffect(() => {
    if (lockedUntil <= Date.now()) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  const fail = (message, nextStep) => {
    setError(message);
    setIsShaking(true);
    navigator.vibrate?.(120);
    window.setTimeout(() => {
      setIsShaking(false);
      setPin('');
      if (nextStep) setStep(nextStep);
    }, 450);
  };

  const handleComplete = async (value) => {
    setIsBusy(true);
    try {
      if (step === 'verify') {
        if (await verifyPin(value, pinData)) {
          writePinAttempts({ count: 0, lockedUntil: 0 });
          if (mode === 'unlock') onUnlocked();
          else if (mode === 'remove') onRemoved();
          else { setStep('create'); setPin(''); }
          return;
        }
        const count = readPinAttempts().count + 1;
        if (count % MAX_PIN_ATTEMPTS === 0) {
          const lockMs = Math.min(300000, 30000 * 2 ** (count / MAX_PIN_ATTEMPTS - 1));
          const until = Date.now() + lockMs;
          writePinAttempts({ count, lockedUntil: until });
          setLockedUntil(until);
          setNow(Date.now());
          fail('PIN incorrecto.');
        } else {
          writePinAttempts({ count, lockedUntil: 0 });
          fail(`PIN incorrecto. Te quedan ${MAX_PIN_ATTEMPTS - (count % MAX_PIN_ATTEMPTS)} intentos.`);
        }
      } else if (step === 'create') {
        setFirstPin(value);
        setStep('confirm');
        setPin('');
      } else if (value === firstPin) {
        onSaved(await createPinData(value));
      } else {
        setFirstPin('');
        fail('Los PIN no coinciden. Inténtalo de nuevo.', 'create');
      }
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleComplete(pin);
  }, [pin]);

  const handleDigit = (digit) => {
    if (isBusy || isLockedOut || isShaking || pin.length >= PIN_LENGTH) return;
    setError('');
    setPin((current) => current + digit);
  };

  const handleBackspace = () => {
    if (isBusy || isShaking) return;
    setPin((current) => current.slice(0, -1));
  };

  const copy = step === 'verify'
    ? {
      title: 'Introduce tu PIN',
      subtitle: mode === 'unlock'
        ? 'Para entrar en Balance.'
        : mode === 'remove' ? 'Para desactivar el PIN de acceso.' : 'Para cambiar tu PIN.',
    }
    : step === 'create'
      ? {
        title: mode === 'change' ? 'Elige tu nuevo PIN' : 'Establece un PIN para tu cuenta',
        subtitle: 'Nunca compartas este PIN con nadie.',
      }
      : { title: 'Confirma tu PIN', subtitle: 'Introdúcelo otra vez para confirmarlo.' };

  const screen = (
    <PinScreen
      title={copy.title}
      subtitle={copy.subtitle}
      pin={pin}
      error={isLockedOut ? `Demasiados intentos. Inténtalo de nuevo en ${secondsLeft} s.` : error}
      isShaking={isShaking}
      disabled={isBusy || isLockedOut}
      onDigit={handleDigit}
      onBackspace={handleBackspace}
      inSheet={mode !== 'unlock'}
    />
  );

  return mode === 'unlock' ? screen : <PinSheet onClose={onClose}>{screen}</PinSheet>;
}

const App = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    editingTransaction,
    setEditingTransaction,
    activeProfile,
    activeProfileId,
    profiles,         // <--- AÑADIR
    switchProfile,     // <--- AÑADIR
    setFilters
  } = useFinance();

  const [activeTab, setActiveTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [defaultHomeTab, setDefaultHomeTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [investmentsEnabled, setInvestmentsEnabled] = useState(() => getInvestmentsEnabled(activeProfileId));
  const [transactionType, setTransactionType] = useState('expense');
  const [theme, setTheme] = useState(() => localStorage.getItem('balance-theme') || 'dark');
  const [profileName, setProfileName] = useState(() => getStoredProfileName(activeProfileId));
  const [pinData, setPinData] = useState(() => readStoredPin());
  const [isLocked, setIsLocked] = useState(() => Boolean(readStoredPin()));
  const [pinFlow, setPinFlow] = useState(null);
  
  // ESTADOS GLOBALES
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const monthSwipeStart = useRef(null);
  const avatarLongPressTimer = useRef(null);
    const hasLongPressed = useRef(false);

    const handleAvatarPointerDown = () => {
      hasLongPressed.current = false;
      avatarLongPressTimer.current = setTimeout(() => {
        hasLongPressed.current = true;
        if (profiles.length > 1) {
          triggerHaptic(); // Vibra para confirmar el cambio
          const currentIndex = profiles.findIndex(p => p.id === activeProfileId);
          const nextProfile = profiles[(currentIndex + 1) % profiles.length];
          switchProfile(nextProfile.id); // Cambia a la siguiente cuenta
        }
      }, 500); // Medio segundo para que cuente como pulsación larga
    };

    const clearAvatarLongPress = () => {
      if (avatarLongPressTimer.current) {
        clearTimeout(avatarLongPressTimer.current);
        avatarLongPressTimer.current = null;
      }
    };
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('balance-theme', theme);
  }, [theme]);

  useEffect(() => {
    const showInvestments = getInvestmentsEnabled(activeProfileId);
    const savedPreferredTab = getPreferredHomeTab(activeProfileId);
    const preferredTab = !showInvestments && savedPreferredTab === 'investments'
      ? 'expenses'
      : savedPreferredTab;
    if (preferredTab !== savedPreferredTab) {
      saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, preferredTab);
    }
    setInvestmentsEnabled(showInvestments);
    setProfileName(getStoredProfileName(activeProfileId));
    setActiveTab(preferredTab);
    setDefaultHomeTab(preferredTab);
    setQuery('');
    setSearchOpen(false);
  }, [activeProfileId]);

  const handleDefaultHomeTabChange = (tab) => {
    if (!homeTabs.includes(tab) || (tab === 'investments' && !investmentsEnabled)) return;
    saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, tab);
    setDefaultHomeTab(tab);
    setActiveTab(tab);
    setQuery('');
    setSearchOpen(false);
  };

  const handleInvestmentsVisibilityChange = (enabled) => {
    saveToLocalStorage(`finance:${activeProfileId}:showInvestments`, enabled);
    setInvestmentsEnabled(enabled);
    if (!enabled) {
      if (defaultHomeTab === 'investments') {
        saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, 'expenses');
        setDefaultHomeTab('expenses');
      }
      if (activeTab === 'investments') setActiveTab('expenses');
    }
  };

  useEffect(() => {
    if (!pinData) return undefined;
    let hiddenAt = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= PIN_LOCK_AFTER_MS) {
        setPinFlow(null);
        setIsLocked(true);
      }
      hiddenAt = null;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pinData]);

  const handlePinSaved = (newPinData) => {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newPinData));
    writePinAttempts({ count: 0, lockedUntil: 0 });
    setPinData(newPinData);
    setPinFlow(null);
  };

  const handlePinRemoved = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    localStorage.removeItem(PIN_ATTEMPTS_KEY);
    setPinData(null);
    setIsLocked(false);
    setPinFlow(null);
  };

  const handleProfileNameChange = (name) => {
    saveToLocalStorage(`finance:${activeProfileId}:displayName`, name);
    setProfileName(name);
  };

  const initials = (profileName || activeProfile?.name || 'US')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsProfileOpen(false);
    setQuery('');
    setSearchOpen(false);
  };

  const openForm = (type) => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  // --- LÓGICA DE DESLIZAR PARA CAMBIAR MES ---
  const handleTouchStart = (event) => {
    if ((activeTab !== 'expenses' && activeTab !== 'movements') || event.touches.length !== 1) {
      monthSwipeStart.current = null;
      return;
    }
    if (event.target.closest?.('button, input, select, textarea, a, [role="dialog"], [data-month-swipe-ignore]')) {
      monthSwipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    monthSwipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = monthSwipeStart.current;
    monthSwipeStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;

    const monthOffset = deltaX < 0 ? 1 : -1;
    setFilters((previous) => {
      const nextMonth = new Date(previous.year, previous.month + monthOffset, 1);
      return { ...previous, month: nextMonth.getMonth(), year: nextMonth.getFullYear() };
    });
    triggerHaptic(); 
  };

  return (
    <div className={`stage ${theme === 'dark' ? 'dark' : ''}`}>
      <SplashScreen />
      {isLocked && pinData ? (
        <PinFlow mode="unlock" pinData={pinData} onUnlocked={() => setIsLocked(false)} />
      ) : (
      <>
      <div className="phone">
        <main 
          className="screen-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => { monthSwipeStart.current = null; }}
        >
          <header
            className="app-header"
            style={investmentsEnabled ? { flexWrap: 'wrap', rowGap: 12 } : undefined}
          >
            <div className="tabs" style={investmentsEnabled ? { width: '100%' } : undefined}>
              <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => handleTabChange('expenses')}>
                Gastos
              </button>
              <button className={activeTab === 'movements' ? 'active' : ''} onClick={() => handleTabChange('movements')}>
                Movimientos
              </button>
              {investmentsEnabled && (
                <button className={activeTab === 'investments' ? 'active' : ''} onClick={() => handleTabChange('investments')}>
                  Inversiones
                </button>
              )}
            </div>
<button
              className={`avatar-button ${isProfileOpen ? 'active' : ''}`}
              onClick={(e) => {
                clearAvatarLongPress();
                // Si ha sido una pulsación larga, evitamos abrir el menú
                if (hasLongPressed.current) {
                  e.preventDefault();
                  hasLongPressed.current = false;
                  return;
                }
                setIsProfileOpen((isOpen) => !isOpen);
              }}
              onPointerDown={handleAvatarPointerDown}
              onPointerUp={clearAvatarLongPress}
              onPointerLeave={clearAvatarLongPress}
              onPointerCancel={clearAvatarLongPress}
              onContextMenu={(e) => {
                // Evita que salga el menú contextual nativo del móvil al mantener el dedo
                if (profiles.length > 1) e.preventDefault();
              }}
              aria-label={isProfileOpen ? 'Cerrar perfil' : 'Abrir perfil'}
              aria-pressed={isProfileOpen}
            >
              {initials}
            </button>
          </header>

          {isProfileOpen ? (
            <ProfileSwitcher
              theme={theme}
              setTheme={setTheme}
              defaultHomeTab={defaultHomeTab}
              onDefaultHomeTabChange={handleDefaultHomeTabChange}
              investmentsEnabled={investmentsEnabled}
              onInvestmentsVisibilityChange={handleInvestmentsVisibilityChange}
              profileName={profileName || activeProfile?.name || ''}
              onProfileNameChange={handleProfileNameChange}
              pinEnabled={Boolean(pinData)}
              onSetupPin={() => setPinFlow('setup')}
              onChangePin={() => setPinFlow('change')}
              onRemovePin={() => setPinFlow('remove')}
            />
          ) : (
            <>
              {/* BARRA DE BÚSQUEDA GLOBAL */}
              {searchOpen && (
                <div className="search-bar">
                  <Icon name="search" size={15} />
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar..."
                  />
                  <button onClick={() => setSearchOpen(false)}>
                    <Icon name="close" size={15} />
                  </button>
                </div>
              )}

              {activeTab === 'expenses' && <HomeOverview query={query} onOpenLimits={() => setIsLimitsOpen(true)} />}
              {activeTab === 'movements' && <MovementsView query={query} />}
              {activeTab === 'investments' && <InvestmentsOverview query={query} />}
            </>
          )}
        </main>

        {!isProfileOpen && <div className="bottom-actions">
          {activeTab === 'movements' ? (
            <>
              <button onClick={() => openForm('expense')}>
                Gasto <span className="action-symbol">−</span>
              </button>
              <button onClick={() => openForm('income')}>
                Ingreso <span className="action-symbol">+</span>
              </button>
            </>
          ) : activeTab === 'investments' ? (
            <>
              <button onClick={() => setSearchOpen(true)}>
                Buscar <Icon name="search" size={16} />
              </button>
              <button onClick={() => setIsInvestmentFormOpen(true)}>
                Invertir <Icon name="arrow" size={16} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)}>
                Buscar <Icon name="search" size={16} />
              </button>
              <button onClick={() => openForm('expense')}>
                Añadir <Icon name="arrow" size={16} />
              </button>
            </>
          )}
        </div>}
        
        {/* MODALES INDEPENDIENTES DE PANTALLA COMPLETA */}
        {isLimitsOpen && (
          <CategoryLimitsForm onClose={() => setIsLimitsOpen(false)} />
        )}
        {isInvestmentFormOpen && (
          <InvestmentForm onClose={() => setIsInvestmentFormOpen(false)} />
        )}
      </div>

      {/* FORMULARIO DE AÑADIR/EDITAR */}
      {(isModalOpen || editingTransaction) && (
        <TransactionForm
          key={editingTransaction?.id || 'new'}
          transaction={editingTransaction}
          defaultType={transactionType}
          onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        />
      )}

      {/* PIN DE ACCESO: crear, cambiar o desactivar */}
      {pinFlow && (
        <PinFlow
          key={pinFlow}
          mode={pinFlow}
          pinData={pinData}
          onSaved={handlePinSaved}
          onRemoved={handlePinRemoved}
          onClose={() => setPinFlow(null)}
        />
      )}
      </>
      )}
    </div>
  );
};

export default App;
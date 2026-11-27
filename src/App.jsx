import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeftRight, CreditCard, LayoutGrid, TrendingUp } from 'lucide-react';
import { useFinance } from './context/FinanceContext';
import HomeOverview from './components/HomeOverview';
import MovementsView from './components/MovementsView';
import InvestmentsOverview from './components/InvestmentsOverview';
import TransactionForm from './components/TransactionForm';
import InvestmentForm from './components/InvestmentForm';
import ProfileSwitcher from './components/ProfileSwitcher';
import CategoryLimitsForm from './components/CategoryLimitsForm';
import NexoLogo from './components/NexoLogo';
import { triggerHaptic } from './utils/haptics';
import { getFromLocalStorage, saveToLocalStorage } from './utils/localStorage';

const homeTabs = ['expenses', 'movements', 'investments'];
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
const getStoredProfileAvatar = (profileId) => {
  const saved = getFromLocalStorage(`finance:${profileId}:avatar`);
  return typeof saved === 'string' && (saved.startsWith('https://') || saved.startsWith('data:image/'))
    ? saved
    : '';
};

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
.pin-screen{position:fixed;inset:0;z-index:5000;display:flex;flex-direction:column;box-sizing:border-box;padding:calc(30px + env(safe-area-inset-top,0px)) 26px calc(18px + env(safe-area-inset-bottom,0px));background:var(--bg-page);color:var(--text-main);font-family:inherit}
.pin-header h1{margin:0;font-size:24px;line-height:1.1;font-weight:500;letter-spacing:-.03em}
.pin-header p{margin:10px 0 0;color:var(--text-mute);font-size:13px;line-height:1.45;font-weight:400}
.pin-dots-area{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0}
.pin-dots{display:flex;gap:28px}
.pin-dots span{width:14px;height:14px;border-radius:50%;background:var(--bg-card);transition:background .12s ease,transform .12s ease}
.pin-dots span.filled{background:var(--primary);transform:scale(1.1)}
.pin-dots.shake{animation:pin-shake .42s ease}
.pin-error{min-height:34px;margin:22px 0 0;max-width:280px;color:var(--danger-red);font-size:12px;font-weight:500;text-align:center;line-height:1.4}
.pin-keypad{width:100%;max-width:360px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);row-gap:6px}
.pin-keypad button{height:64px;border:0;border-radius:18px;background:transparent;color:inherit;font-size:25px;font-weight:500;font-family:inherit;display:grid;place-items:center}
.pin-keypad button:active:not(:disabled){background:var(--bg-card)}
@keyframes pin-shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
.pin-sheet-layer{position:fixed;inset:0;z-index:5000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.pin-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:460px;height:min(680px,92dvh);border-radius:20px 20px 0 0;background:var(--bg-page);color:var(--text-main)}
.pin-sheet-handle{flex:none;width:36px;height:4px;margin:10px auto 0;border-radius:99px;background:var(--text-mute);opacity:.35}
.pin-screen.in-sheet{position:static;inset:auto;flex:1;min-height:0;z-index:auto;background:transparent;padding:18px 26px calc(18px + env(safe-area-inset-bottom,0px))}
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

  return (
    <div className={`pin-screen ${inSheet ? 'in-sheet' : ''}`} role="dialog" aria-modal="true">
      <style>{PIN_STYLES}</style>
      <div className="pin-header mt-6">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="pin-dots-area">
        <div className={`pin-dots ${isShaking ? 'shake' : ''}`}>
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
            onClick={() => (key === 'backspace' ? onBackspace() : onDigit(key))}
          >
            {key === 'backspace' ? '⌫' : key}
          </button>
        )))}
      </div>
    </div>
  );
}

function PinSheet({ onClose, children }) {
  return (
    <div className="pin-sheet-layer" onMouseDown={onClose}>
      <section className="pin-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pin-sheet-handle" />
        {children}
      </section>
    </div>
  );
}

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
    ? { title: 'Introduce tu PIN', subtitle: 'Para desbloquear Wallet.' }
    : step === 'create'
      ? { title: 'Elige tu PIN', subtitle: 'Nunca compartas este PIN con nadie.' }
      : { title: 'Confirma tu PIN', subtitle: 'Introdúcelo otra vez para confirmarlo.' };

  const screen = (
    <PinScreen
      title={copy.title}
      subtitle={copy.subtitle}
      pin={pin}
      error={isLockedOut ? `Demasiados intentos. Espera ${secondsLeft} s.` : error}
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
    profiles,
    switchProfile,
    setFilters,
    isAmountsHidden,
  } = useFinance();

  const [activeTab, setActiveTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [defaultHomeTab, setDefaultHomeTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [investmentsEnabled, setInvestmentsEnabled] = useState(() => getInvestmentsEnabled(activeProfileId));
  const [transactionType, setTransactionType] = useState('expense');
  const [theme, setTheme] = useState(() => localStorage.getItem('balance-theme') || 'light');
  const [colorfulHero, setColorfulHero] = useState(() => localStorage.getItem('nexo-colorful-hero') !== 'false');
  const [profileName, setProfileName] = useState(() => getStoredProfileName(activeProfileId));
  const [pinData, setPinData] = useState(() => readStoredPin());
  const [isLocked, setIsLocked] = useState(() => Boolean(readStoredPin()));
  const [pinFlow, setPinFlow] = useState(null);
  const [switchToast, setSwitchToast] = useState('');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false);
  const [query, setQuery] = useState('');

  const monthSwipeStart = useRef(null);
  const isFirstProfileMount = useRef(true);

  const openForm = (type) => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  useEffect(() => {
    document.body.classList.toggle('privacy-mode', Boolean(isAmountsHidden));
    return () => document.body.classList.remove('privacy-mode');
  }, [isAmountsHidden]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'add-expense') {
      openForm('expense');
      window.history.replaceState(null, '', '/');
    } else if (action === 'add-income') {
      openForm('income');
      window.history.replaceState(null, '', '/');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('balance-theme', theme);
  }, [theme]);

  const handleColorfulHeroChange = (enabled) => {
    setColorfulHero(enabled);
    localStorage.setItem('nexo-colorful-hero', String(enabled));
  };

  useEffect(() => {
    const showInvestments = getInvestmentsEnabled(activeProfileId);
    const savedPreferredTab = getPreferredHomeTab(activeProfileId);
    const preferredTab = !showInvestments && savedPreferredTab === 'investments' ? 'expenses' : savedPreferredTab;

    setInvestmentsEnabled(showInvestments);
    setProfileName(getStoredProfileName(activeProfileId));
    setDefaultHomeTab(preferredTab);
    setQuery('');

    if (isFirstProfileMount.current) {
      isFirstProfileMount.current = false;
      setActiveTab(preferredTab);
    } else if (!showInvestments && activeTab === 'investments') {
      setActiveTab('expenses');
    }
  }, [activeProfileId]);

  const handleDefaultHomeTabChange = (tab) => {
    saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, tab);
    setDefaultHomeTab(tab);
    setActiveTab(tab);
  };

  const handleInvestmentsVisibilityChange = (enabled) => {
    saveToLocalStorage(`finance:${activeProfileId}:showInvestments`, enabled);
    setInvestmentsEnabled(enabled);
    if (!enabled && activeTab === 'investments') setActiveTab('expenses');
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

  const initials = (profileName || activeProfile?.name || 'US')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cycleAccount = () => {
    if (profiles.length <= 1) return;
    triggerHaptic();
    const currentIndex = profiles.findIndex((p) => p.id === activeProfileId);
    const nextProfile = profiles[(currentIndex + 1) % profiles.length];
    switchProfile(nextProfile.id);
    setSwitchToast(`Cuenta: ${nextProfile.name}`);
    window.setTimeout(() => setSwitchToast(''), 2000);
  };

  const selectTab = (tab) => {
    triggerHaptic();
    setIsProfileOpen(false);
    setActiveTab(tab);
  };

  const handleMonthTouchStart = (event) => {
    if (isProfileOpen || activeTab !== 'expenses' || event.touches.length !== 1) {
      monthSwipeStart.current = null;
      return;
    }
    if (event.target.closest?.('button, input, select, textarea, a, [role="dialog"], [data-chart-scrub], [data-month-swipe-ignore]')) {
      monthSwipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    monthSwipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleMonthTouchEnd = (event) => {
    const start = monthSwipeStart.current;
    monthSwipeStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;

    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;

    const monthOffset = deltaX < 0 ? 1 : -1;
    setFilters((previous) => {
      const nextMonth = new Date(previous.year, previous.month + monthOffset, 1);
      const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(nextMonth);
      setSwitchToast(label.charAt(0).toUpperCase() + label.slice(1));
      window.setTimeout(() => setSwitchToast(''), 1400);
      return { ...previous, month: nextMonth.getMonth(), year: nextMonth.getFullYear() };
    });
    triggerHaptic();
  };

  const showBottomNav = isProfileOpen || activeTab !== 'movements';

  return (
    <div className={`stage ${theme === 'dark' ? 'dark' : ''}`}>
      {switchToast && <div className="account-toast">{switchToast}</div>}

      {isLocked && pinData ? (
        <PinFlow mode="unlock" pinData={pinData} onUnlocked={() => setIsLocked(false)} />
      ) : (
        <>
          <div className="phone">
            <main
              className="screen-content"
              onTouchStart={handleMonthTouchStart}
              onTouchEnd={handleMonthTouchEnd}
              onTouchCancel={() => { monthSwipeStart.current = null; }}
            >
              {isProfileOpen ? (
                <ProfileSwitcher
                  theme={theme}
                  setTheme={setTheme}
                  colorfulHero={colorfulHero}
                  onColorfulHeroChange={handleColorfulHeroChange}
                  defaultHomeTab={defaultHomeTab}
                  onDefaultHomeTabChange={handleDefaultHomeTabChange}
                  investmentsEnabled={investmentsEnabled}
                  onInvestmentsVisibilityChange={handleInvestmentsVisibilityChange}
                  profileName={profileName || activeProfile?.name || ''}
                  onProfileNameChange={(name) => {
                    saveToLocalStorage(`finance:${activeProfileId}:displayName`, name);
                    setProfileName(name);
                  }}
                  pinEnabled={Boolean(pinData)}
                  onSetupPin={() => setPinFlow('setup')}
                  onChangePin={() => setPinFlow('change')}
                  onRemovePin={() => setPinFlow('remove')}
                  onClose={() => setIsProfileOpen(false)}
                />
              ) : (
                <>
                  {(activeTab === 'expenses' || activeTab === 'movements') && (
                    <HomeOverview
                      initials={initials}
                      colorfulHero={colorfulHero}
                      query={query}
                      onQueryChange={setQuery}
                      onOpenLimits={() => setIsLimitsOpen(true)}
                      onQuickAction={(type) => openForm(type)}
                      onOpenProfile={() => {
                        triggerHaptic();
                        setIsProfileOpen(true);
                      }}
                      onLongPressAvatar={cycleAccount}
                      onOpenMovements={() => selectTab('movements')}
                    />
                  )}
                  {activeTab === 'movements' && (
                    <MovementsView
                      colorfulHero={colorfulHero}
                      onClose={() => selectTab('expenses')}
                      onOpenLimits={() => setIsLimitsOpen(true)}
                    />
                  )}
                  {activeTab === 'investments' && (
                    <InvestmentsOverview query={query} />
                  )}
                </>
              )}
            </main>

            {/* MENÚ INFERIOR CON EFECTO LIQUID GLASS */}
            {showBottomNav && (
              <nav className="rev-liquid-nav" aria-label="Navegación principal">
                <button
                  type="button"
                  className={`rev-nav-item ${!isProfileOpen && activeTab === 'expenses' ? 'active' : ''}`}
                  onClick={() => selectTab('expenses')}
                >
                  <NexoLogo size={19} />
                  <span>Inicio</span>
                </button>
              {/*
                <button 
                  type="button"
                  className={`rev-nav-item ${!isProfileOpen && activeTab === 'movements' ? 'active' : ''}`}
                  onClick={() => selectTab('movements')}
                >
                  <CreditCard size={20} strokeWidth={2} />
                  <span>Cuentas</span>
                </button>
                */}
                <button
                  type="button"
                  className="rev-nav-item"
                  onClick={() => {
                    if (activeTab === 'investments') setIsInvestmentFormOpen(true);
                    else openForm('expense');
                  }}
                >
                  <ArrowLeftRight size={20} strokeWidth={2} />
                  <span>{activeTab === 'investments' ? 'Invertir' : 'Añadir'}</span>
                </button>


                <button
                  type="button"
                  className={`rev-nav-item ${isProfileOpen ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic();
                    setIsProfileOpen(true);
                  }}
                >
                  <LayoutGrid size={20} strokeWidth={2} />
                  <span>Perfil</span>
                </button>
              </nav>
            )}

            {isLimitsOpen && <CategoryLimitsForm onClose={() => setIsLimitsOpen(false)} />}
            {isInvestmentFormOpen && <InvestmentForm onClose={() => setIsInvestmentFormOpen(false)} />}
          </div>

          {(isModalOpen || editingTransaction) && (
            <TransactionForm
              key={editingTransaction?.id || `new-${transactionType}`}
              transaction={editingTransaction}
              defaultType={transactionType}
              onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
            />
          )}

          {pinFlow && (
            <PinFlow
              key={pinFlow}
              mode={pinFlow}
              pinData={pinData}
              onSaved={(newPin) => {
                localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newPin));
                writePinAttempts({ count: 0, lockedUntil: 0 });
                setPinData(newPin);
                setPinFlow(null);
              }}
              onRemoved={() => {
                localStorage.removeItem(PIN_STORAGE_KEY);
                localStorage.removeItem(PIN_ATTEMPTS_KEY);
                setPinData(null);
                setIsLocked(false);
                setPinFlow(null);
              }}
              onClose={() => setPinFlow(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
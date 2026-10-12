import React, { useEffect, useRef, useState } from 'react';
import { MoonStar, Plus, SunMedium } from 'lucide-react';
import { useFinance } from './context/FinanceContext';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CategoryBreakdown from './components/CategoryBreakdown';
import Filters from './components/Filters';
import ExportImportButtons from './components/ExportImportButtons';
import { Button } from './components/ui/button';
import ProfileSwitcher from './components/ProfileSwitcher';
import { triggerHaptic } from './utils/haptics';

const App = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    editingTransaction,
    setEditingTransaction,
    filters,
    setFilters,
    isAmountsHidden,
    setIsAmountsHidden,
  } = useFinance();
  const monthSwipeStart = useRef(null);
  const motionState = useRef({ direction: 0, reversals: 0, startedAt: 0, lastToggleAt: 0 });
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('balance-theme');
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('balance-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      const staleBiometricKeys = Object.keys(localStorage).filter((key) => (
        /^finance:.*:biometricCredential$/.test(key)
      ));
      staleBiometricKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('No se pudieron limpiar las preferencias de bloqueo antiguas.', error);
    }
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return undefined;

    const handleDeviceMotion = (event) => {
      const acceleration = event.acceleration?.x;
      const accelerationWithGravity = event.accelerationIncludingGravity?.x;
      const lateralAcceleration = Number.isFinite(acceleration) ? acceleration : accelerationWithGravity;
      if (!Number.isFinite(lateralAcceleration) || Math.abs(lateralAcceleration) < 4) return;

      const now = Date.now();
      const motion = motionState.current;
      const direction = Math.sign(lateralAcceleration);
      if (motion.direction && direction !== motion.direction) {
        if (now - motion.startedAt > 1000) {
          motion.reversals = 0;
          motion.startedAt = now;
        }
        motion.reversals += 1;
        if (motion.reversals >= 2 && now - motion.lastToggleAt > 1200) {
          setIsAmountsHidden((hidden) => !hidden);
          motion.lastToggleAt = now;
          motion.reversals = 0;
          motion.startedAt = now;
          triggerHaptic();
        }
      } else if (!motion.direction) {
        motion.startedAt = now;
      }
      motion.direction = direction;
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [setIsAmountsHidden]);

  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(
    new Date(filters.year, filters.month, 1),
  );

  const handleTouchStart = (event) => {
    if (!window.matchMedia('(max-width: 767px)').matches || event.touches.length !== 1) {
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

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;

    const monthOffset = deltaX < 0 ? 1 : -1;
    setFilters((previous) => {
      const nextMonth = new Date(previous.year, previous.month + monthOffset, 1);
      return {
        ...previous,
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear(),
      };
    });
    triggerHaptic();
  };

  return (
    <div
      className="app-shell min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-50"
      data-amounts-hidden={isAmountsHidden}
    >
      <main
        className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-9 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { monthSwipeStart.current = null; }}
      >
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium capitalize text-slate-500 dark:text-slate-400">
              Tu resumen financiero
            </p>
            <h1 className="text-3xl font-semibold tracking-tight capitalize sm:text-4xl">
              {monthLabel} {filters.year}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sueldo, gastos y todo lo que te queda a final de mes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="inline-flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <ProfileSwitcher />
            <div className="hidden lg:block">
              <Button
                size="default"
                onClick={() => setIsModalOpen(true)}
                className="h-10"
              >
                <span className="text-lg leading-none">+</span>
                Añadir movimiento
              </Button>
            </div>
          </div>
        </div>

        <Filters />
        <SummaryCards />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <TransactionList />
          <CategoryBreakdown />
        </div>

        <div className="mt-6 flex justify-end">
          <ExportImportButtons />
        </div>
      </main>

      {!isModalOpen && !editingTransaction && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Añadir movimiento"
          title="Añadir movimiento"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 transition-transform hover:scale-105 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-95 lg:hidden"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {(isModalOpen || editingTransaction) && (
        <TransactionForm
          key={editingTransaction?.id || 'new'}
          transaction={editingTransaction}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default App;

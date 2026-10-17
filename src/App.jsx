import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Filter, MoonStar, Plus, SunMedium, X } from 'lucide-react';
import { useFinance } from './context/FinanceContext';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CategoryBreakdown from './components/CategoryBreakdown';
import Filters from './components/Filters';
import ExportImportButtons from './components/ExportImportButtons';
import { Button } from './components/ui/button';
import ProfileSwitcher from './components/ProfileSwitcher';
import { getFromLocalStorage } from './utils/localStorage';
import {
  claimDailyCheck,
  getPushNotificationsEnabled,
  releaseDailyCheck,
  showAppNotification,
} from './utils/pushNotifications';
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
    transactions,
    profiles,
    activeProfileId,
  } = useFinance();
  const monthSwipeStart = useRef(null);
  const motionState = useRef({ direction: 0, reversals: 0, startedAt: 0, lastToggleAt: 0 });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [dismissedSpendingAlertKeys, setDismissedSpendingAlertKeys] = useState([]);
  const [openOverlays, setOpenOverlays] = useState({});
  const handleOverlayOpenChange = useCallback((overlay, isOpen) => {
    setOpenOverlays((previous) => (
      previous[overlay] === isOpen ? previous : { ...previous, [overlay]: isOpen }
    ));
  }, []);
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('balance-theme');
    if (storedTheme) return storedTheme;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('balance-theme', theme);
  }, [theme]);

  useEffect(() => {
    const openAddTransaction = () => {
      setIsModalOpen(true);
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    };
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'OPEN_ADD_TRANSACTION') openAddTransaction();
    };
    const url = new URL(window.location.href);
    if (url.searchParams.get('action') === 'add') openAddTransaction();
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
  }, [setIsModalOpen]);

  // EFECTO ORIGINAL: Aviso de día sin gastos
  useEffect(() => {
    let isChecking = false;
    let isDisposed = false;
    let timer;

    const getPreviousDate = () => {
      const previousDate = new Date();
      previousDate.setDate(previousDate.getDate() - 1);
      return `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;
    };

    const checkPreviousDay = async () => {
      if (isChecking || !('Notification' in window) || Notification.permission !== 'granted') return;
      if (!getPushNotificationsEnabled(activeProfileId)) return;
      const date = getPreviousDate();
      const hadExpenses = transactions.some((transaction) => (
        transaction.type === 'Gasto' && transaction.date === date
      ));
      if (hadExpenses || !claimDailyCheck(activeProfileId, date)) return;

      isChecking = true;
      try {
        await showAppNotification({
          title: 'Día sin gastos',
          body: `Ayer (${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(`\${date}T12:00:00`))}) no registraste ningún gasto. ¡Buen trabajo!`,
          tag: `balance-no-spend-${activeProfileId}-${date}`,
          action: 'dashboard',
        });
      } catch (error) {
        releaseDailyCheck(activeProfileId, date);
        console.error('No se pudo mostrar el recordatorio de día sin gastos.', error);
      } finally {
        isChecking = false;
      }
    };

    const scheduleNextDayCheck = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = window.setTimeout(async () => {
        await checkPreviousDay();
        if (!isDisposed) scheduleNextDayCheck();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleNextDayCheck();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkPreviousDay();
    };
    const handleNotificationPreferenceChange = () => checkPreviousDay();
    checkPreviousDay();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('balance:push-notifications-changed', handleNotificationPreferenceChange);
    return () => {
      isDisposed = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('balance:push-notifications-changed', handleNotificationPreferenceChange);
    };
  }, [activeProfileId, transactions]);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!getPushNotificationsEnabled(activeProfileId)) return;

    const fechaActual = new Date();
    const mesActual = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const añoActual = fechaActual.getFullYear();
    const prefijoMes = `${añoActual}-${mesActual}`;

    // 1. Calcular el total de gastos e ingresos del mes natural en curso (independiente de los filtros)
    let gastosDelMes = 0;
    let ingresosDelMes = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(prefijoMes)) {
        if (tx.type === 'Gasto') gastosDelMes += Number(tx.amount);
        if (tx.type === 'Ingreso') ingresosDelMes += Number(tx.amount);
      }
    });

    // Si no hay ingresos, no hay forma de calcular el 80% del "dinero libre"
    if (ingresosDelMes === 0) return;

    // 2. Calcular los umbrales (80% del ingreso total del mes actual)
    const limite80 = ingresosDelMes * 0.8;
    const claveNotificacion = `balance-80-aviso-${activeProfileId}-${prefijoMes}`;
    const yaAvisado = localStorage.getItem(claveNotificacion);

    // 3. Disparar notificación si supera el 80% pero no llega al 100%
    if (gastosDelMes >= limite80 && gastosDelMes < ingresosDelMes && !yaAvisado) {
      ////--ALTERNATIVA-- 3. Disparar notificación si está al 80% o más (y aún no se ha avisado este mes)
      ///if (gastosDelMes >= limite80 && !yaAvisado) {
      showAppNotification({
        title: 'Aviso de límite cercano',
        body: `Tus gastos han alcanzado el 80% de tus ingresos de este mes.`,
        tag: claveNotificacion,
        action: 'dashboard',
      }).then(() => {
        localStorage.setItem(claveNotificacion, 'true');
      }).catch(error => {
        console.error('No se pudo mostrar el aviso del 80%.', error);
      });
    }
  }, [transactions, activeProfileId]);

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
  const monthStorageKey = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const spendingAlerts = profiles
    .filter((profile) => profile.id !== activeProfileId)
    .flatMap((profile) => {
      const profileTransactions = getFromLocalStorage(`finance:${profile.id}:transactions`);
      const profileCapsByMonth = getFromLocalStorage(`finance:${profile.id}:monthlyCategoryCaps`);
      const profileTransactionsForMonth = (Array.isArray(profileTransactions) ? profileTransactions : [])
        .filter((transaction) => transaction.date?.startsWith(monthStorageKey));
      const profileIncome = profileTransactionsForMonth.reduce(
        (sum, transaction) => sum + (transaction.type === 'Ingreso' ? Number(transaction.amount) || 0 : 0),
        0,
      );
      const profileExpenses = profileTransactionsForMonth.reduce(
        (sum, transaction) => sum + (transaction.type === 'Gasto' ? Number(transaction.amount) || 0 : 0),
        0,
      );
      const expensesByCategory = profileTransactionsForMonth.reduce((totals, transaction) => {
        if (transaction.type === 'Gasto') {
          totals[transaction.category] = (totals[transaction.category] || 0) + (Number(transaction.amount) || 0);
        }
        return totals;
      }, {});
      const caps = profileCapsByMonth && typeof profileCapsByMonth === 'object'
        ? profileCapsByMonth[monthStorageKey] || {}
        : {};
      const alerts = [];

      if (profileIncome > 0 && profileExpenses >= profileIncome) {
        alerts.push({
          type: 'overspent',
          message: profileExpenses > profileIncome
            ? `🔥 ${profile.name} está gastando más de lo que ingresa. ¡Cartera en llamas!`
            : `🔥 ${profile.name} ya ha gastado todo lo que ingresó este mes.`,
          className: 'border-rose-300 bg-gradient-to-r from-rose-500 to-orange-500 text-white dark:border-rose-300/40 dark:from-rose-700 dark:to-orange-700',
        });
      }

      Object.entries(caps).forEach(([category, cap]) => {
        if ((expensesByCategory[category] || 0) <= Number(cap)) return;
        alerts.push({
          type: `cap-${category}`,
          message: `🚨 ${profile.name} se ha pasado del tope de ${category}.`,
          className: 'border-orange-300 bg-gradient-to-r from-orange-400 to-amber-400 text-orange-950 dark:border-orange-300/40 dark:from-orange-700 dark:to-amber-700 dark:text-white',
        });
      });

      if (
        profileIncome > 0
        && profileExpenses < profileIncome
        && profileExpenses >= profileIncome * 0.8
      ) {
        alerts.push({
          type: 'warning',
          message: `🔥 ${profile.name} está quemando la cartera: ya gastó el 80 % de sus ingresos.`,
          className: 'border-amber-300 bg-gradient-to-r from-amber-300 to-yellow-300 text-amber-950 dark:border-amber-300/40 dark:from-amber-700 dark:to-yellow-700 dark:text-white',
        });
      }

      if (profileIncome >= 1000 || (profileExpenses > 0 && profileIncome >= profileExpenses * 2)) {
        alerts.push({
          type: 'large-income',
          message: `🎉 ¡${profile.name} va genial! Lleva ${new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(profileIncome)} de ingresos este mes.`,
          className: 'border-emerald-300 bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 dark:border-emerald-300/40 dark:from-emerald-700 dark:to-teal-700 dark:text-white',
        });
      }

      return alerts.map((alert) => ({
        ...alert,
        key: `${profile.id}-${filters.year}-${filters.month}-${alert.type}`,
      }));
    });
  const activeFilterCount = [
    filters.searchTerm.trim().length > 0,
    filters.type !== 'Todos',
    filters.category !== 'Todas',
  ].filter(Boolean).length;
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
      className="app-shell min-h-screen bg-white text-zinc-950 transition-colors dark:bg-black dark:text-white pb-10"
      data-amounts-hidden={isAmountsHidden}
    >
      <main
        className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-9 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { monthSwipeStart.current = null; }}
      >
        <div className="mb-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Balance
            </h1>
            <p className="mt-1 font-semibold text-2xl  capitalize text-neutral-400">
              {monthLabel} {filters.year}
            </p>
            {spendingAlerts
              .filter((alert) => !dismissedSpendingAlertKeys.includes(alert.key))
              .map((alert) => (
                <div
                  key={alert.key}
                  role="status"
                  className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${alert.className}`}
                >
                  <span>{alert.message}</span>
                  <button
                    type="button"
                    onClick={() => setDismissedSpendingAlertKeys((previousKeys) => (
                      previousKeys.includes(alert.key) ? previousKeys : [...previousKeys, alert.key]
                    ))}
                    aria-label={`Cerrar aviso de gastos de ${alert.message.split(' ')[1]}`}
                    title="Cerrar aviso"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full items-center justify-between gap-0.5 rounded-full bg-white p-1 shadow-[0_4px_20px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] dark:bg-slate-900 md:contents">
              <button
                type="button"
                onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800 md:rounded-md md:bg-white md:text-slate-600 md:shadow-sm md:hover:bg-slate-50 md:dark:bg-slate-900 md:dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? <MoonStar size={18} /> : <SunMedium size={18} />}
              </button>
              <button
                type="button"
                aria-label={activeFilterCount > 0 ? `Mes y filtros, ${activeFilterCount} filtros activos` : 'Mes y filtros'}
                title="Mes y filtros"
                aria-expanded={isMobileFiltersOpen}
                aria-controls="transaction-filters"
                onClick={() => setIsMobileFiltersOpen((isOpen) => !isOpen)}
                className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800 md:rounded-md md:bg-white md:text-slate-600 md:shadow-sm md:hover:bg-slate-50 md:dark:bg-slate-900 md:dark:hover:bg-slate-800 md:hidden"
              >
                <Filter size={18} aria-hidden="true" />
                {activeFilterCount > 0 && (
                  <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <ProfileSwitcher onOverlayOpenChange={handleOverlayOpenChange} />
            </div>
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

        <Filters
          isMobileFiltersOpen={isMobileFiltersOpen}
          onCloseMobileFilters={setIsMobileFiltersOpen}
        />
        <SummaryCards />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <TransactionList />
          <CategoryBreakdown onOverlayOpenChange={handleOverlayOpenChange} />
        </div>

        <div className="mt-4 flex justify-end">
          <ExportImportButtons />
        </div>
      </main>

      {!isModalOpen
        && !editingTransaction
        && !isMobileFiltersOpen
        && !Object.values(openOverlays).some(Boolean) && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Añadir movimiento"
          title="Añadir movimiento"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-10 inline-flex h-14 items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-base font-semibold text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-95 dark:bg-slate-900 dark:text-white lg:hidden"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white dark:bg-emerald-600">
            <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
          </span>
          Añadir movimiento
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
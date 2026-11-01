import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Eye,
  EyeOff,
  LogOut,
  MoonStar,
  Plus,
  Settings,
  SunMedium,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import useSwipeToClose from '../hooks/useSwipeToClose';
import {
  getPushNotificationsEnabled,
  requestPushNotificationPermission,
  setPushNotificationsEnabled,
} from '../utils/pushNotifications';
import { triggerHaptic } from '../utils/haptics';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Button } from './ui/button';

const ProfileSwitcher = ({ onOverlayOpenChange, theme, setTheme, placement = 'top' }) => {
  const {
    profiles,
    activeProfile,
    switchProfile,
    addProfile,
    deleteActiveProfile,
    monthlyGoals,
    setMonthlyGoals,
    previousMonthGoals,
    totalIncome,
    filters,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
    syncStatus,
    syncError,
    pendingSyncOperations,
    isFirebaseConfigured,
    createSyncAccount,
    loginToSyncAccount,
    logoutFromSyncAccount,
    retrySync,
  } = useFinance();
  const motionPermissionRequested = useRef(false);
  const settingsRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isCreatingSyncAccount, setIsCreatingSyncAccount] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncFormError, setSyncFormError] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [goalValues, setGoalValues] = useState({ savings: 0, investment: 0 });
  const [copyPreviousGoals, setCopyPreviousGoals] = useState(false);
  const goalValuesSnapshot = useRef(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => getPushNotificationsEnabled(activeProfile.id),
  );
  const [notificationPermission, setNotificationPermission] = useState(
    () => ('Notification' in window ? Notification.permission : 'default'),
  );
  const [notificationError, setNotificationError] = useState('');
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const addingDialogSwipeHandlers = useSwipeToClose(() => setIsAdding(false));
  const goalsDialogSwipeHandlers = useSwipeToClose(() => setIsEditingGoals(false));
  const syncDialogSwipeHandlers = useSwipeToClose(() => setIsSyncPanelOpen(false));

  useEffect(() => {
    if (!isSettingsOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSettingsOpen(false);
    };
    const handlePointerDown = (event) => {
      if (!settingsRef.current?.contains(event.target)) setIsSettingsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    onOverlayOpenChange('profile', isAdding || isEditingGoals || isSyncPanelOpen);
    return () => onOverlayOpenChange('profile', false);
  }, [isAdding, isEditingGoals, isSyncPanelOpen, onOverlayOpenChange]);

  const handleSyncFormSubmit = async (event) => {
    event.preventDefault();
    setSyncFormError('');
    try {
      if (isCreatingSyncAccount) await createSyncAccount(syncEmail.trim(), syncPassword);
      else await loginToSyncAccount(syncEmail.trim(), syncPassword);
      setSyncPassword('');
    } catch (error) {
      setSyncFormError(getFirebaseErrorMessage(error, 'No se pudo iniciar la sincronización.'));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      addProfile(name);
      setName('');
      setErrorMessage('');
      setIsAdding(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const openGoalSettings = () => {
    setGoalValues({
      savings: monthlyGoals.savings > 0 ? String(monthlyGoals.savings) : '',
      investment: monthlyGoals.investment > 0 ? String(monthlyGoals.investment) : '',
    });
    setErrorMessage('');
    setCopyPreviousGoals(false);
    setIsEditingGoals(true);
  };

  const handleGoalsSubmit = (event) => {
    event.preventDefault();
    try {
      setMonthlyGoals({
        savings: Number(goalValues.savings),
        investment: Number(goalValues.investment),
      });
      setErrorMessage('');
      setIsEditingGoals(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      `¿Eliminar el perfil "${activeProfile.name}"? Se borrarán permanentemente sus movimientos, metas y datos sincronizados. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setIsDeletingProfile(true);
    setErrorMessage('');
    try {
      await deleteActiveProfile();
      setIsEditingGoals(false);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el perfil.');
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const formatGoalProgress = (value) => {
    if (value === '') return null;
    const amount = Number(value);
    const formattedAmount = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      useGrouping: 'always',
    }).format(amount);
    if (totalIncome <= 0) return `${formattedAmount} (sin ingresos registrados este mes)`;
    const percentage = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
      .format((amount / totalIncome) * 100);
    return `${formattedAmount} (${percentage}% de tus ingresos)`;
  };

  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
    .format(new Date(filters.year, filters.month, 1));

  const previousMonthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long' })
    .format(new Date(filters.year, filters.month - 1, 1));
  const hasPreviousGoals = previousMonthGoals.savings > 0 || previousMonthGoals.investment > 0;
  const formatEuro = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' }).format(value);

  const handleCopyGoalsToggle = (event) => {
    const checked = event.target.checked;
    if (checked) {
      goalValuesSnapshot.current = goalValues;
      setGoalValues({
        savings: previousMonthGoals.savings > 0 ? String(previousMonthGoals.savings) : '',
        investment: previousMonthGoals.investment > 0 ? String(previousMonthGoals.investment) : '',
      });
    } else if (goalValuesSnapshot.current) {
      setGoalValues(goalValuesSnapshot.current);
    }
    setCopyPreviousGoals(checked);
  };

  const handleGoalInputChange = (field, value) => {
    setGoalValues((values) => ({ ...values, [field]: value }));
    setCopyPreviousGoals(false);
  };

  useEffect(() => {
    const refreshNotificationState = () => {
      setNotificationsEnabled(getPushNotificationsEnabled(activeProfile.id));
      setNotificationPermission('Notification' in window ? Notification.permission : 'default');
    };
    refreshNotificationState();
    window.addEventListener('focus', refreshNotificationState);
    return () => window.removeEventListener('focus', refreshNotificationState);
  }, [activeProfile.id]);

  const handleNotificationsToggle = async (event) => {
    const enabled = event.target.checked;
    setNotificationError('');
    if (!enabled) {
      try {
        setPushNotificationsEnabled(activeProfile.id, false);
        setNotificationsEnabled(false);
      } catch (error) {
        setNotificationError(error.message);
      }
      return;
    }

    setIsUpdatingNotifications(true);
    try {
      const permission = await requestPushNotificationPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setPushNotificationsEnabled(activeProfile.id, true);
        setNotificationsEnabled(true);
      } else {
        setPushNotificationsEnabled(activeProfile.id, false);
        setNotificationsEnabled(false);
      }
    } catch (error) {
      setNotificationPermission('Notification' in window ? Notification.permission : 'default');
      setNotificationError(error.message || 'No se pudieron activar las notificaciones.');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const permissionLabel = notificationPermission === 'granted'
    ? 'Concedido'
    : notificationPermission === 'denied'
      ? 'Denegado'
      : 'Pendiente';
  const permissionClass = notificationPermission === 'granted'
    ? 'bg-emerald-100 text-emerald-800 dark:!bg-emerald-500/15 dark:text-emerald-300'
    : notificationPermission === 'denied'
      ? 'bg-rose-100 text-rose-800 dark:!bg-rose-500/15 dark:text-rose-300'
      : 'bg-amber-100 text-amber-800 dark:!bg-amber-500/15 dark:text-amber-300';
  const indicatorStatus = syncStatus === 'error'
    ? 'error'
    : syncStatus === 'syncing' || pendingSyncOperations > 0
      ? 'syncing'
      : syncStatus;
  const syncStatusLabel = indicatorStatus === 'synced'
    ? 'Sincronizado'
    : indicatorStatus === 'syncing'
      ? 'Sincronizando'
      : indicatorStatus === 'error'
        ? 'Error de sincronización'
        : 'Sin conexión';

  const toggleAmountVisibility = () => {
    setIsAmountsHidden((hidden) => !hidden);
    triggerHaptic();
    if (motionPermissionRequested.current) return;

    const requestPermission = window.DeviceMotionEvent?.requestPermission;
    if (typeof requestPermission !== 'function') return;
    motionPermissionRequested.current = true;
    requestPermission.call(window.DeviceMotionEvent).then((permission) => {
      if (permission !== 'granted') {
        console.warn('No se concedió permiso para detectar el movimiento del dispositivo.');
      }
    }).catch((error) => {
      console.warn('No se pudo habilitar la detección de movimiento del dispositivo.', error);
    });
  };

  return (
    <>
      <div
        ref={settingsRef}
        className={placement === 'navigation' ? 'relative min-w-0 flex-1' : 'relative'}
      >
        <button
          type="button"
          onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
          aria-label="Cuenta y ajustes"
          title="Cuenta y ajustes"
          aria-expanded={isSettingsOpen}
          aria-haspopup="dialog"
          className={placement === 'navigation'
            ? 'flex min-h-12 w-full min-w-0 items-center justify-center rounded-2xl px-1 py-2.5 text-slate-500 transition-colors hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-white/10'
            : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15'}
        >
          <UserRound size={22} aria-hidden="true" />
          {placement === 'navigation' && <span className="sr-only">Cuenta</span>}
        </button>
        {isSettingsOpen && (
          <section
            role="dialog"
            aria-label="Perfil y ajustes"
            className={`absolute right-0 z-[70] max-h-[calc(100dvh-7rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-slate-900 shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95 dark:text-white ${
              placement === 'navigation' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <h2 className="mb-3 text-base font-semibold">Ajustes</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-white/10"
              >
                {theme === 'dark' ? <MoonStar size={18} aria-hidden="true" /> : <SunMedium size={18} aria-hidden="true" />}
                <span className="flex-1">Apariencia</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </button>
              <button
                type="button"
                onClick={toggleAmountVisibility}
                aria-pressed={isAmountsHidden}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-white/10"
              >
                {isAmountsHidden ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
                <span className="flex-1">{isAmountsHidden ? 'Mostrar importes' : 'Ocultar importes'}</span>
              </button>
            </div>
            <div className="my-3 border-t border-slate-200 dark:border-white/10" />
            <label htmlFor="active-profile" className="mb-1.5 block px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Perfil activo
            </label>
            <div className="flex items-center gap-2">
              <select
                id="active-profile"
                value={activeProfile.id}
                onChange={(event) => {
                  switchProfile(event.target.value);
                  setIsSettingsOpen(false);
                }}
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-300 dark:border-white/10 dark:bg-zinc-800 dark:text-slate-100"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsAdding(true);
                }}
                aria-label="Añadir perfil"
                title="Añadir perfil"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                openGoalSettings();
              }}
              className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-white/10"
            >
              <Settings size={18} aria-hidden="true" />
              Perfil y metas
            </button>
            <button
              type="button"
              onClick={() => {
                setSyncFormError('');
                setIsSettingsOpen(false);
                setIsSyncPanelOpen(true);
              }}
              aria-label={syncUser
                ? `Cuenta ${syncUser.email || ''}. ${syncStatusLabel}`
                : 'Iniciar sesión para sincronizar'}
              className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-white/10"
            >
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">
                {(syncUser?.email?.trim().charAt(0) || <UserRound size={15} aria-hidden="true" />)}
                {syncUser && (
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      indicatorStatus === 'synced'
                        ? 'bg-emerald-500'
                        : indicatorStatus === 'error'
                          ? 'bg-rose-500'
                          : indicatorStatus === 'syncing'
                            ? 'animate-pulse bg-amber-400'
                            : 'bg-slate-400'
                    }`}
                  />
                )}
              </span>
              <span className="flex-1 truncate">
                {syncUser ? syncUser.email || 'Cuenta sincronizada' : 'Iniciar sesión para sincronizar'}
              </span>
              {syncUser && <span className="text-xs text-slate-500 dark:text-slate-400">{syncStatusLabel}</span>}
            </button>
          </section>
        )}
      </div>

      {isAdding && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAdding(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-profile-title"
            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            {...addingDialogSwipeHandlers}
          >
            <h2 id="new-profile-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">Crear perfil</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cada perfil tendrá sus propios movimientos, categorías y facturas.
              {syncUser
                ? ' Los perfiles se sincronizan en los dispositivos que usen esta cuenta, pero las facturas adjuntas solo se guardan en este dispositivo.'
                : ' Inicia sesión con Firebase para sincronizar los perfiles y movimientos entre dispositivos. Las facturas adjuntas solo se guardan en este dispositivo.'}
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nombre
                </label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  autoFocus
                  required
                  placeholder="Ej. Nombre"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              {errorMessage && (
                <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {errorMessage}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear perfil</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isEditingGoals && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsEditingGoals(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-goals-title"
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            {...goalsDialogSwipeHandlers}
          >
            <h2 id="profile-goals-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Ajustes de Perfil y Metas
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Define cuánto quieres reservar para {activeProfile.name} en {monthLabel}.
            </p>
            <form onSubmit={handleGoalsSubmit} className="mt-5 space-y-4">
              <label
                className={`flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 ${
                  hasPreviousGoals ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <span>
                  Copiar las metas de {previousMonthLabel}
                  <span className="privacy-sensitive mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                    {hasPreviousGoals
                      ? `Ahorro ${formatEuro(previousMonthGoals.savings)} · Inversión ${formatEuro(previousMonthGoals.investment)}`
                      : `No hay metas guardadas en ${previousMonthLabel}`}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={copyPreviousGoals}
                  disabled={!hasPreviousGoals}
                  onChange={handleCopyGoalsToggle}
                  className="size-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
                />
              </label>
              <div>
                <label htmlFor="monthly-savings-goal" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Meta de Ahorro Mensual (€)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recomendado: {` ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' }).format(totalIncome * 0.1)} (10% de tus ingresos)`}
                </p>
                <input
                  id="monthly-savings-goal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalValues.savings}
                  onChange={(event) => handleGoalInputChange('savings', event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {formatGoalProgress(goalValues.savings) && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatGoalProgress(goalValues.savings)}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="monthly-investment-goal" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Meta de Inversión Mensual (€)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recomendado: {` ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' }).format(totalIncome * 0.2)} (20% de tus ingresos)`}
                </p>
                <input
                  id="monthly-investment-goal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalValues.investment}
                  onChange={(event) => handleGoalInputChange('investment', event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {formatGoalProgress(goalValues.investment) && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatGoalProgress(goalValues.investment)}
                  </p>
                )}
              </div>
              {errorMessage && (
                <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {errorMessage}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeletingProfile}
                  onClick={() => setIsEditingGoals(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isDeletingProfile}>Guardar metas</Button>
              </div>
            </form>
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Bell size={17} />
                    Activar Notificaciones Push
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Recibe avisos de gastos que superan tu dinero libre y recordatorios de días sin gastos.
                  </p>
                </div>
                <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Activar Notificaciones Push"
                    checked={notificationsEnabled}
                    disabled={isUpdatingNotifications || notificationPermission === 'denied'}
                    onChange={handleNotificationsToggle}
                    className="peer sr-only"
                  />
                  <span
                    data-preserve-colors
                    className="h-6 w-11 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
                    style={{ backgroundColor: notificationsEnabled ? '#16a34a42' : '#dc262642' }}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Permiso del navegador:{' '}
                <span className={`rounded-full px-2 py-1 font-medium ${permissionClass}`}>{permissionLabel}</span>
              </p>
              {notificationPermission === 'denied' && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  El permiso está bloqueado en el navegador. Cámbialo desde los ajustes del sitio para activarlo.
                </p>
              )}
              {notificationError && (
                <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                  {notificationError}
                </p>
              )}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                disabled={profiles.length <= 1 || isDeletingProfile || (syncUser && syncStatus !== 'synced')}
                onClick={handleDeleteProfile}
                className="text-rose-700 hover:text-rose-800 dark:text-rose-300"
              >
                <Trash2 size={16} />
                Eliminar perfil
              </Button>
              {profiles.length <= 1 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  No se puede eliminar el único perfil que queda.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {isSyncPanelOpen && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          data-sync-account-backdrop
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSyncPanelOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-account-title"
            data-sync-account-dialog
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            {...syncDialogSwipeHandlers}
          >
            <h2 id="sync-account-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Sincronización entre dispositivos
            </h2>
            {!isFirebaseConfigured ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Firebase todavía no está configurado. Copia <code>.env.example</code> a <code>.env.local</code>,
                completa las claves de tu app web de Firebase y vuelve a iniciar la aplicación.
              </p>
            ) : syncUser ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sesión iniciada como <strong className="font-semibold text-slate-900 dark:text-slate-100">{syncUser.email}</strong>.
                </p>
                <p role={syncError ? 'alert' : 'status'} className="text-sm text-slate-500 dark:text-slate-400">
                  {syncError || (syncStatus === 'syncing'
                    ? 'Sincronizando tus perfiles y movimientos…'
                    : 'Los perfiles, movimientos, objetivos y topes se sincronizan con esta cuenta. Las facturas adjuntas permanecen en este dispositivo.')}
                </p>
                {syncStatus === 'error' && (
                  <Button type="button" variant="outline" onClick={retrySync}>
                    Reintentar sincronización
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={syncStatus === 'syncing'}
                  onClick={async () => {
                    try {
                      await logoutFromSyncAccount();
                      setIsSyncPanelOpen(false);
                    } catch (error) {
                      setSyncFormError(getFirebaseErrorMessage(error, 'No se pudo cerrar la sesión.'));
                    }
                  }}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </Button>
                {syncFormError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{syncFormError}</p>}
              </div>
            ) : (
              <form onSubmit={handleSyncFormSubmit} className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Usa la misma cuenta en tus dispositivos para sincronizar los datos.
                </p>
                <div>
                  <label htmlFor="sync-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Correo electrónico
                  </label>
                  <input
                    id="sync-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={syncEmail}
                    onChange={(event) => setSyncEmail(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="sync-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Contraseña
                  </label>
                  <input
                    id="sync-password"
                    type="password"
                    autoComplete={isCreatingSyncAccount ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                    value={syncPassword}
                    onChange={(event) => setSyncPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mínimo 6 caracteres.</p>
                </div>
                {syncFormError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{syncFormError}</p>}
                {syncError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{syncError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSyncAccount((creating) => !creating);
                      setSyncFormError('');
                    }}
                    className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
                  >
                    {isCreatingSyncAccount ? 'Ya tengo una cuenta' : 'Crear cuenta'}
                  </button>
                  <Button type="submit" disabled={syncStatus === 'syncing'}>
                    {syncStatus === 'syncing' ? 'Sincronizando…' : isCreatingSyncAccount ? 'Crear cuenta' : 'Iniciar sesión'}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>,
        document.body,
      )}
    </>
  );
};

export default ProfileSwitcher;
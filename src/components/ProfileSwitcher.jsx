import React, { useEffect, useRef, useState } from 'react';
import { Bell, Eye, EyeOff, Plus, Users, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  getPushNotificationsEnabled,
  requestPushNotificationPermission,
  setPushNotificationsEnabled,
} from '../utils/pushNotifications';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './ui/button';

const ProfileSwitcher = () => {
  const {
    profiles,
    activeProfile,
    switchProfile,
    addProfile,
    monthlyGoals,
    setMonthlyGoals,
    previousMonthGoals,
    totalIncome,
    filters,
    isAmountsHidden,
    setIsAmountsHidden,
  } = useFinance();
  const motionPermissionRequested = useRef(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
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

  const formatGoalProgress = (value) => {
    if (value === '') return null;
    const amount = Number(value);
    const formattedAmount = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
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
  const formatEuro = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

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
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
    : notificationPermission === 'denied'
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAmountVisibility}
          aria-label={isAmountsHidden ? 'Mostrar importes' : 'Ocultar importes'}
          aria-pressed={isAmountsHidden}
          title={isAmountsHidden ? 'Mostrar importes' : 'Ocultar importes'}
          className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          {isAmountsHidden ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
        <button
          type="button"
          onClick={openGoalSettings}
          aria-label="Ajustes de Perfil y Metas"
          title="Ajustes de Perfil y Metas"
          className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          <Users size={17} />
        </button>
        <label htmlFor="active-profile" className="sr-only">Perfil activo</label>
        <select
          id="active-profile"
          value={activeProfile.id}
          onChange={(event) => switchProfile(event.target.value)}
          className="h-10 max-w-44 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>{profile.name}</option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsAdding(true)}
          aria-label="Añadir perfil"
          title="Añadir perfil"
        >
          <Plus size={17} />
        </Button>
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
          >
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={17} />
            </button>
            <h2 id="new-profile-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">Crear perfil</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cada perfil tendrá sus propios movimientos, categorías y facturas en este dispositivo.
              Los perfiles no se sincronizan ni tienen contraseña.
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
          >
            <button
              type="button"
              onClick={() => setIsEditingGoals(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={17} />
            </button>
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
                  Recomendado: {` ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalIncome * 0.1)} (10% de tus ingresos)`}
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
                  Recomendado: {` ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalIncome * 0.2)} (20% de tus ingresos)`}
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
                <Button type="button" variant="outline" onClick={() => setIsEditingGoals(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar metas</Button>
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
                  <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 dark:bg-slate-600" />
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
          </section>
        </div>
      )}
    </>
  );
};

export default ProfileSwitcher;

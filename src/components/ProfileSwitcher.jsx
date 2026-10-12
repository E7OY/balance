import React, { useRef, useState } from 'react';
import { Eye, EyeOff, Plus, Users, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
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
            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
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
                  onChange={(event) => setGoalValues((values) => ({ ...values, savings: event.target.value }))}
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
                  onChange={(event) => setGoalValues((values) => ({ ...values, investment: event.target.value }))}
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
          </section>
        </div>
      )}
    </>
  );
};

export default ProfileSwitcher;

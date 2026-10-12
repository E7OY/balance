import React, { useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Button } from './ui/button';

const ProfileSwitcher = () => {
  const { profiles, activeProfile, switchProfile, addProfile } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          <Users size={17} />
        </span>
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
    </>
  );
};

export default ProfileSwitcher;

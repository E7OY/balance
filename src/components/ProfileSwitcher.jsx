import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from '../utils/pushNotifications';

function Icon({ name, size = 17 }) {
  const paths = {
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    chevron: <path d="m9 7 5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const ProfileSwitcher = ({ theme, setTheme, defaultHomeTab, onDefaultHomeTabChange, onClose }) => {
  const {
    activeProfile,
    transactions,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
    createSyncAccount,
    loginToSyncAccount,
    logoutFromSyncAccount,
    exportData,
  } = useFinance();

  // Estados generales y de edición
  const [notifications, setNotifications] = useState(() => getPushNotificationsEnabled(activeProfile.id));
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [customName, setCustomName] = useState(activeProfile?.name || 'Usuario');
  
  // Estados para la sincronización (Firebase)
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isCreatingSyncAccount, setIsCreatingSyncAccount] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncFormError, setSyncFormError] = useState('');

  const initials = customName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Calcula el total ahorrado históricamente (Ingresos totales - Gastos totales de todos los meses)
  const totalWealth = transactions.reduce((acc, tx) => {
    if (tx.type === 'Ingreso') return acc + Number(tx.amount);
    if (tx.type === 'Gasto') return acc - Number(tx.amount);
    return acc;
  }, 0);

  const displayMoney = (val) => isAmountsHidden ? '•••• €' : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const handleNotificationsToggle = () => {
    const newState = !notifications;
    setNotifications(newState);
    setPushNotificationsEnabled(activeProfile.id, newState);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const newName = e.target.name.value;
    if (!newName.trim()) return;
    
    setCustomName(newName);
    setProfileEditOpen(false);
  };

  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    setSyncFormError('');
    try {
      if (isCreatingSyncAccount) {
        await createSyncAccount(syncEmail.trim(), syncPassword);
      } else {
        await loginToSyncAccount(syncEmail.trim(), syncPassword);
      }
      setSyncPassword('');
      setIsSyncPanelOpen(false);
    } catch (error) {
      setSyncFormError('Error al iniciar sesión. Revisa tus datos.');
    }
  };

  return (
    <section className="profile-page" aria-label="Perfil">
      <header className="profile-header">
        <button className="profile-back" onClick={onClose} aria-label="Volver">
          <Icon name="arrow" size={18} />
        </button>
        <strong>Perfil</strong>
        <button className="profile-edit" onClick={() => setProfileEditOpen(true)}>
          Editar
        </button>
      </header>

      <div className="profile-identity">
        <span className="profile-avatar">{initials}</span>
        <h1>{customName}</h1>
        <p>{syncUser ? syncUser.email : 'Cuenta local'}</p>
        {syncUser && <span className="verified">Nube activada</span>}
      </div>

      <div className="profile-balance">
        <span>Patrimonio total rastreado</span>
        <strong className="privacy-sensitive">{displayMoney(totalWealth)}</strong>
        <small>Total ahorrado de todos los meses</small>
      </div>

      <div className="settings-group">
        <p>PREFERENCIAS</p>
        <div className="setting-toggle">
          <span>
            <strong>Ocultar importes</strong>
            <small>Protege tus cifras de miradas ajenas</small>
          </span>
          <button
            className={`switch ${isAmountsHidden ? "on" : ""}`}
            onClick={() => setIsAmountsHidden(!isAmountsHidden)}
            role="switch"
            aria-checked={isAmountsHidden}
            aria-label="Ocultar importes"
          >
            <i />
          </button>
        </div>
        <div className="setting-toggle">
          <span>
            <strong>Modo oscuro</strong>
            <small>Reduce el brillo de la interfaz</small>
          </span>
          <button
            className={`switch ${theme === 'dark' ? "on" : ""}`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Activar modo oscuro"
          >
            <i />
          </button>
        </div>
        <label className="setting-select-row">
          <span>
            <strong>Pantalla principal</strong>
            <small>Elige qué sección se abre al iniciar</small>
          </span>
          <select
            aria-label="Pantalla principal"
            value={defaultHomeTab}
            onChange={(event) => onDefaultHomeTabChange(event.target.value)}
          >
            <option value="expenses">Gastos</option>
            <option value="investments">Inversiones</option>
            <option value="movements">Movimientos</option>
          </select>
        </label>
        <div className="setting-toggle">
          <span>
            <strong>Notificaciones</strong>
            <small>Alertas de gastos y presupuesto</small>
          </span>
          <button
            className={`switch ${notifications ? "on" : ""}`}
            onClick={handleNotificationsToggle}
            role="switch"
            aria-checked={notifications}
            aria-label="Activar notificaciones"
          >
            <i />
          </button>
        </div>
      </div>

      <div className="settings-group">
        <p>DATOS Y SINCRONIZACIÓN</p>
        {syncUser ? (
          <button onClick={logoutFromSyncAccount}>
            <span>
              <strong>Cerrar sesión</strong>
              <small>Detener sincronización en la nube</small>
            </span>
            <Icon name="chevron" size={15} />
          </button>
        ) : (
          <button onClick={() => setIsSyncPanelOpen(true)}>
            <span>
              <strong>Sincronización local</strong>
              <small>Toca para iniciar sesión en la nube</small>
            </span>
            <Icon name="chevron" size={15} />
          </button>
        )}
        <button onClick={exportData}>
          <span>
            <strong>Exportar mis datos</strong>
            <small>Descarga un archivo JSON completo</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>
      </div>

      <button className="export-button" onClick={exportData}>
        Exportar mis datos
        <Icon name="arrow" size={16} />
      </button>
      <p className="app-version">Versión 2.0.0</p>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      {profileEditOpen && (
        <div 
          className="sheet-layer profile-edit-layer" 
          style={{ zIndex: 70 }} 
          onMouseDown={() => setProfileEditOpen(false)}
        >
          <section
            className="bottom-sheet profile-edit-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="profile-edit-avatar">{initials}</div>
            <button
              className="sheet-close"
              onClick={() => setProfileEditOpen(false)}
              aria-label="Cerrar"
            >
              <Icon name="close" size={18} />
            </button>
            
            <h2 id="profile-edit-title">Datos personales</h2>
            <p>Actualiza la información visible en tu perfil.</p>
            
            <form onSubmit={handleUpdateProfile}>
              <label>
                Nombre completo
                <input
                  name="name"
                  defaultValue={customName}
                  required
                  autoFocus
                />
              </label>
              
              <button className="sheet-submit" type="submit">
                Guardar
                <Icon name="arrow" size={16} />
              </button>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DE SINCRONIZACIÓN (FIREBASE) */}
      {isSyncPanelOpen && (
        <div 
          className="sheet-layer" 
          style={{ zIndex: 70 }} 
          onMouseDown={() => setIsSyncPanelOpen(false)}
        >
          <section
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <button
              className="sheet-close"
              onClick={() => setIsSyncPanelOpen(false)}
              aria-label="Cerrar"
            >
              <Icon name="close" size={18} />
            </button>
            
            <div className="record-tabs">
              <button
                className={!isCreatingSyncAccount ? "active" : ""}
                onClick={() => { setIsCreatingSyncAccount(false); setSyncFormError(''); }}
                type="button"
              >
                Iniciar sesión
              </button>
              <button
                className={isCreatingSyncAccount ? "active" : ""}
                onClick={() => { setIsCreatingSyncAccount(true); setSyncFormError(''); }}
                type="button"
              >
                Crear cuenta
              </button>
            </div>

            <h2 id="sync-title">Sincronización</h2>
            <p>Guarda tus movimientos en la nube de Firebase para no perderlos nunca.</p>
            
            <form onSubmit={handleSyncSubmit}>
              <label>
                Correo electrónico
                <input
                  type="email"
                  value={syncEmail}
                  onChange={(e) => setSyncEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  autoFocus
                />
              </label>
              
              <label style={{ marginTop: '10px' }}>
                Contraseña
                <input
                  type="password"
                  value={syncPassword}
                  onChange={(e) => setSyncPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </label>

              {syncFormError && (
                <p style={{ color: '#df242b', marginTop: '10px', fontSize: '12px', fontWeight: '600' }}>{syncFormError}</p>
              )}
              
              <button className="sheet-submit limits-submit" style={{ marginTop: '20px' }} type="submit">
                {isCreatingSyncAccount ? 'Registrarse' : 'Entrar'}
                <Icon name="arrow" size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default ProfileSwitcher;
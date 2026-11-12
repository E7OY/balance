import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from '../utils/pushNotifications';

function Icon({ name, size = 17, style }) {
  const paths = {
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    chevron: <path d="m9 7 5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    cloud: <path d="M7 18h10a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7 9a4.5 4.5 0 0 0 0 9Z" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v3h14v-3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
      {paths[name]}
    </svg>
  );
}

// Color del icono con buen contraste sobre el fondo real del botón (claro u oscuro)
const getReadableIconColor = (element) => {
  let node = element;
  while (node && node !== document.documentElement) {
    const background = window.getComputedStyle(node).backgroundColor;
    const match = background.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/);
    if (match && (match[4] === undefined || Number(match[4]) > 0.5)) {
      const [red, green, blue] = [match[1], match[2], match[3]].map(Number);
      const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      return luminance > 0.55 ? '#090909' : '#f5f5f2';
    }
    node = node.parentElement;
  }
  return null;
};

function ShortcutIcon({ name, theme }) {
  const ref = useRef(null);
  const [color, setColor] = useState(null);

  useEffect(() => {
    const update = () => setColor(getReadableIconColor(ref.current?.closest('button')));
    update();
    const timer = window.setTimeout(update, 150);
    return () => window.clearTimeout(timer);
  }, [theme]);

  return (
    <span ref={ref} style={{ display: 'inline-flex' }}>
      <Icon name={name} size={20} style={color ? { color, stroke: 'currentColor' } : undefined} />
    </span>
  );
}

const ProfileSwitcher = ({
  theme,
  setTheme,
  defaultHomeTab,
  onDefaultHomeTabChange,
  investmentsEnabled,
  onInvestmentsVisibilityChange,
  profileName,
  onProfileNameChange,
  pinEnabled,
  onSetupPin,
  onChangePin,
  onRemovePin,
}) => {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    transactions,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
    createSyncAccount,
    loginToSyncAccount,
    logoutFromSyncAccount,
    exportData,
    switchProfile,
    addProfile,
    joinProfile,
  } = useFinance();

  // Estados generales y de edición
  const [notifications, setNotifications] = useState(() => getPushNotificationsEnabled(activeProfile.id));
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const customName = profileName || activeProfile?.name || 'Mi perfil';
  
  // Estados para cuentas compartidas
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isJoinPanelOpen, setIsJoinPanelOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  // Estados para la sincronización (Firebase)
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isCreatingSyncAccount, setIsCreatingSyncAccount] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncFormError, setSyncFormError] = useState('');
  
  const settingsRef = useRef(null);
  const syncRef = useRef(null);

  const initials = customName.split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  // Genera el código único. Si la cuenta ya es compartida, usa ese código. Si no, añade el UID.
  const shareCode = activeProfileId.includes('___') 
    ? activeProfileId 
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

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

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSyncShortcut = () => {
    if (syncUser) {
      scrollTo(syncRef);
      return;
    }
    setIsSyncPanelOpen(true);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const newName = String(new FormData(e.currentTarget).get('name') || '').trim();
    if (!newName) return;

    onProfileNameChange(newName);
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
      <div className="profile-identity">
        <p className="profile-type">Personal</p>
        <h1>Axion de {customName}</h1>
        <p>{syncUser ? syncUser.email : 'Cuenta local'}</p>
        {syncUser && <span className="verified">Nube activada</span>}
      </div>

      <div className="profile-shortcuts" aria-label="Accesos rápidos">
        <button className="profile-shortcut" onClick={() => setProfileEditOpen(true)}>
          <ShortcutIcon name="user" theme={theme} />
          <strong className='dark:text-white'>Cuenta</strong>
          <small>Datos personales</small>
        </button>
        <button className="profile-shortcut" onClick={handleSyncShortcut}>
          <ShortcutIcon name="cloud" theme={theme} />
          <strong className='dark:text-white'>Nube</strong>
          <small>{syncUser ? 'Sincronizada' : 'Copia de seguridad'}</small>
        </button>
        <button className="profile-shortcut" onClick={exportData}>
          <ShortcutIcon name="download" theme={theme} />
          <strong className='dark:text-white'>Exportar</strong>
          <small>Descargar datos</small>
        </button>
      </div>

      <div className="profile-balance">
        <span>Patrimonio total rastreado</span>
        <strong className="privacy-sensitive">{displayMoney(totalWealth)}</strong>
        <small>Total ahorrado de todos los meses</small>
      </div>

      <div className="settings-group">
        <p>CUENTAS Y ESPACIOS COMPARTIDOS</p>
        {profiles.map((profile) => (
          <button key={profile.id} onClick={() => switchProfile(profile.id)}>
            <span className="profile-service-icon">
              <Icon name="user" size={18} />
            </span>
            <span className="profile-service-copy">
              <strong>{profile.name}</strong>
              <small>{profile.id === activeProfileId ? 'Cuenta actual (activa)' : 'Toca para cambiar de cuenta'}</small>
            </span>
            {profile.id === activeProfileId && <Icon name="chevron" size={16} />}
          </button>
        ))}
        
        <button onClick={() => setIsSharePanelOpen(true)}>
          <span className="profile-service-icon">
             <Icon name="arrow" size={18} style={{ transform: 'rotate(-45deg)' }}/>
          </span>
          <span className="profile-service-copy">
            <strong>Invitar a esta cuenta</strong>
            <small>Comparte gastos con tu pareja o amigos</small>
          </span>
        </button>
        
        <button onClick={() => setIsJoinPanelOpen(true)}>
          <span className="profile-service-icon">
             <Icon name="arrow" size={18} style={{ transform: 'rotate(135deg)' }}/>
          </span>
          <span className="profile-service-copy">
            <strong>Vincular cuenta compartida</strong>
            <small>Únete usando un código de invitación</small>
          </span>
        </button>
        
        <button onClick={() => {
          const name = window.prompt('Nombre del nuevo espacio (ej. Gastos Personales):');
          if (name) addProfile(name);
        }}>
          <span className="profile-service-icon"><strong style={{fontSize: '18px'}}>+</strong></span>
          <span className="profile-service-copy">
            <strong>Crear nuevo espacio</strong>
            <small>Crea una cuenta separada desde cero</small>
          </span>
        </button>
      </div>

      <div className="settings-group" ref={settingsRef}>
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
            <strong>PIN de acceso</strong>
            <small>{pinEnabled ? 'Se pide al abrir la app' : 'Protege la app con un PIN de 4 dígitos'}</small>
          </span>
          <button
            className={`switch ${pinEnabled ? "on" : ""}`}
            onClick={pinEnabled ? onRemovePin : onSetupPin}
            role="switch"
            aria-checked={pinEnabled}
            aria-label="PIN de acceso"
          >
            <i />
          </button>
        </div>
        {pinEnabled && (
          <button onClick={onChangePin}>
            <span>
              <strong>Cambiar PIN</strong>
              <small>Elige un nuevo PIN de 4 dígitos</small>
            </span>
            <Icon name="chevron" size={15} />
          </button>
        )}
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
        <div className="setting-toggle">
          <span>
            <strong>Mostrar Inversiones</strong>
            <small>Añade la pantalla de inversiones al menú</small>
          </span>
          <button
            className={`switch ${investmentsEnabled ? "on" : ""}`}
            onClick={() => onInvestmentsVisibilityChange(!investmentsEnabled)}
            role="switch"
            aria-checked={investmentsEnabled}
            aria-label="Mostrar página de inversiones"
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
            {investmentsEnabled && <option value="investments">Inversiones</option>}
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

      <div className="settings-group" ref={syncRef}>
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

      {/* MODAL COMPARTIR CUENTA */}
      {isSharePanelOpen && (
        <div className="sheet-layer" style={{ zIndex: 70 }} onMouseDown={() => setIsSharePanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => setIsSharePanelOpen(false)}>
              <Icon name="close" size={18} />
            </button>
            <h2>Invitar a esta cuenta</h2>
            {shareCode ? (
              <>
                <p>Pasa este código a tu pareja o compañero. Una vez lo introduzcan en "Vincular cuenta", ambos veréis los mismos gastos sincronizados en la nube.</p>
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', textAlign: 'center', margin: '20px 0', wordBreak: 'break-all', fontWeight: 'bold', fontSize: '18px' }} className="dark:bg-white/10">
                  {shareCode}
                </div>
                <button className="sheet-submit" onClick={() => {
                  navigator.clipboard.writeText(shareCode);
                  window.alert('Código copiado al portapapeles');
                }}>
                  Copiar código
                  <Icon name="arrow" size={16} />
                </button>
              </>
            ) : (
              <p style={{ color: '#df242b', marginTop: '10px', fontWeight: 'bold' }}>Debes iniciar sesión en la nube (Firebase) para poder compartir tus cuentas.</p>
            )}
          </section>
        </div>
      )}

      {/* MODAL VINCULAR CUENTA */}
      {isJoinPanelOpen && (
        <div className="sheet-layer" style={{ zIndex: 70 }} onMouseDown={() => setIsJoinPanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => setIsJoinPanelOpen(false)}>
              <Icon name="close" size={18} />
            </button>
            <h2>Vincular cuenta</h2>
            <p>Pega el código de invitación que te ha compartido tu pareja o compañero para unirte a su cuenta de gastos.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              try {
                joinProfile(joinCode, joinName);
                setIsJoinPanelOpen(false);
                setJoinCode('');
                setJoinName('');
              } catch(err) {
                window.alert(err.message);
              }
            }}>
              <label>
                Código de invitación
                <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Ej: 12345678-abcd..." />
              </label>
              <label style={{ marginTop: '10px' }}>
                Nombre para esta cuenta
                <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej: Gastos Casa" />
              </label>
              
              <button type="submit" className="sheet-submit" style={{ marginTop: '20px' }}>
                Unirme a la cuenta
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
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  FileText,
  Home,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from '../utils/pushNotifications';
import { triggerHaptic } from '../utils/haptics';

const PROFILE_REVOLUT_CSS = `
  .rev-profile-page {
    min-height: 100dvh;
    background-color: var(--surface-soft);
    padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 28px;
    color: var(--ink);
  }
  .dark .rev-profile-page {
    background-color: var(--canvas-dark);
    color: var(--on-dark);
  }
  .rev-profile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .rev-invite-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 0;
    background-color: var(--canvas-light);
    color: var(--primary);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.24px;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .dark .rev-invite-pill {
    background-color: var(--surface-elevated);
    box-shadow: none;
  }
  .rev-invite-pill:active {
    transform: scale(0.96);
  }
  .rev-profile-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 6px 0 22px;
  }
  .rev-profile-avatar-wrap {
    position: relative;
    width: 78px;
    height: 78px;
    margin-bottom: 14px;
    cursor: pointer;
  }
  .rev-profile-avatar {
    width: 78px;
    height: 78px;
    border-radius: 50%;
    background: linear-gradient(145deg, #3D17EE 0%, #494fdf 100%);
    color: #FFFFFF;
    font-size: 26px;
    font-weight: 500;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rev-profile-edit-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: var(--canvas-light);
    color: var(--ink);
    border: 2px solid var(--surface-soft);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dark .rev-profile-edit-badge {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    border-color: var(--canvas-dark);
    box-shadow: none;
  }
  .rev-plan-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 5px 13px;
    border-radius: 999px;
    background-color: var(--canvas-light);
    color: var(--ink);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.24px;
  }
  .dark .rev-plan-pill {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .rev-quick-trio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .rev-quick-tile {
    background-color: var(--canvas-light);
    color: var(--ink);
    border: 0;
    border-radius: 20px;
    padding: 16px 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .dark .rev-quick-tile {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .rev-quick-tile:active {
    transform: scale(0.96);
  }
  .rev-section-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.24px;
    color: var(--text-mute);
    margin: 0 0 8px 6px;
  }
  .rev-settings-card {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: 20px;
    padding: 2px 18px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .dark .rev-settings-card {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .bottom-sheet .rev-settings-card {
    background-color: var(--surface-soft);
    box-shadow: none;
  }
  .dark .bottom-sheet .rev-settings-card {
    background-color: var(--surface-elevated);
  }
  .rev-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 14px 0;
    background: transparent;
    border: 0;
    color: var(--text-main);
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }
  .rev-settings-row + .rev-settings-row {
    border-top: 1px solid var(--border-hairline);
  }
  .rev-settings-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .rev-neutral-chip {
    background-color: var(--surface-soft);
    color: var(--text-mute);
  }
  .dark .rev-neutral-chip {
    background-color: #242428;
    color: var(--on-dark-mute);
  }
  .rev-home-select {
    width: auto !important;
    margin: 0 !important;
    height: 36px !important;
    padding: 0 12px !important;
    border-radius: var(--rounded-full) !important;
    background-color: var(--surface-soft) !important;
    border: 0 !important;
    color: var(--ink) !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    cursor: pointer;
  }
  .dark .rev-home-select {
    background-color: #242428 !important;
    color: var(--on-dark) !important;
  }
  .rev-switch {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    border: 0;
    padding: 3px;
    background: var(--faint);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .dark .rev-switch {
    background: #2C2C32;
  }
  .rev-switch.on {
    background: var(--primary);
  }
  .rev-switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFFFFF;
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    transform: translateX(0);
  }
  .rev-switch.on .rev-switch-thumb {
    transform: translateX(20px);
  }
`;

const ProfileSwitcher = ({
  theme,
  setTheme,
  colorfulHero,
  onColorfulHeroChange,
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
    investmentRecords = [],
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
    createSyncAccount,
    loginToSyncAccount,
    logoutFromSyncAccount,
    exportData,
    exportCsv,
    exportPdf,
    importData,
    switchProfile,
    addProfile,
    joinProfile,
    deleteActiveProfile,
  } = useFinance();

  const [notifications, setNotifications] = useState(() => getPushNotificationsEnabled(activeProfile.id));
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const customName = profileName || activeProfile?.name || 'Mi perfil';

  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isJoinPanelOpen, setIsJoinPanelOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');

  const [isNewSpaceOpen, setIsNewSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceError, setNewSpaceError] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const importInputRef = useRef(null);

  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isCreatingSyncAccount, setIsCreatingSyncAccount] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncFormError, setSyncFormError] = useState('');

  const initials = customName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isSharedSpace = activeProfileId.includes('___');
  const shareCode = isSharedSpace
    ? activeProfileId
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

  const totalWealth = transactions.reduce((acc, tx) => (
    tx.type === 'Ingreso' ? acc + Number(tx.amount) : tx.type === 'Gasto' ? acc - Number(tx.amount) : acc
  ), 0) + investmentRecords.reduce((acc, rec) => (
    rec.soldAt ? acc : acc + (Number(rec.currentValue) || 0)
  ), 0);

  const displayMoney = (val) => (isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val));

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBackupMessage('');
    try {
      await importData(file);
      triggerHaptic();
      setBackupMessage('Copia restaurada correctamente.');
    } catch (err) {
      setBackupMessage(err.message);
    }
  };

  return (
    <section className="rev-profile-page" aria-label="Perfil y ajustes">
      <style>{PROFILE_REVOLUT_CSS}</style>

      <div className="rev-profile-top">
        <span className="nx-label" style={{ color: 'var(--text-mute)' }}>
          Ajustes
        </span>
        <button
          type="button"
          className="rev-invite-pill"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
        >
          <Share2 size={13} /> Invitar
        </button>
      </div>

      <div className="rev-profile-hero">
        <div
          className="rev-profile-avatar-wrap"
          onClick={() => setProfileEditOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Editar nombre del perfil"
        >
          <div className="rev-profile-avatar">{initials}</div>
          <span className="rev-profile-edit-badge">
            <Pencil size={12} />
          </span>
        </div>

        <h1 className="nx-display" style={{ fontSize: '26px', margin: 0 }}>
          {customName}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: '4px 0 0' }}>
          {syncUser ? syncUser.email : `@${customName.toLowerCase().replace(/\s+/g, '')}`}
        </p>

        <div className="rev-plan-pill">
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: syncUser ? 'var(--accent-teal)' : 'var(--primary)',
          }} />
          <span>{syncUser ? 'Personal · Nube activa' : 'Estándar · Local'}</span>
        </div>
      </div>

      <div className="rev-quick-trio">
        <button type="button" className="rev-quick-tile" onClick={() => setProfileEditOpen(true)}>
          <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
            <User size={18} />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Perfil</span>
        </button>

        <button type="button" className="rev-quick-tile" onClick={() => setIsSyncPanelOpen(true)}>
          <span className="rev-settings-icon" style={{
            background: syncUser ? 'rgba(0, 168, 126, 0.14)' : 'rgba(73, 79, 223, 0.14)',
            color: syncUser ? 'var(--accent-teal)' : 'var(--primary)',
          }}>
            <Cloud size={18} />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            {syncUser ? 'Sincronizado' : 'Nube'}
          </span>
        </button>

        <button
          type="button"
          className="rev-quick-tile"
          onClick={() => {
            setBackupMessage('');
            setIsExportOpen(true);
          }}
        >
          <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
            <Download size={18} />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Backup</span>
        </button>
      </div>

      <div className="rev-settings-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
              Patrimonio en {activeProfile?.name}
            </span>
            <span
              className="nx-display privacy-sensitive"
              style={{ display: 'block', fontSize: '28px', marginTop: '6px' }}
            >
              {displayMoney(totalWealth)}
            </span>
          </div>
          <span className="nx-badge-tag">
            {profiles.length} {profiles.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>
      </div>

      {/* GRUPO 1: CUENTAS Y ESPACIOS COMPARTIDOS */}
      <p className="rev-section-label">Cuentas y espacios compartidos</p>
      <div className="rev-settings-card">
        {profiles.map((p) => {
          const active = p.id === activeProfileId;
          const shared = p.id.includes('___');
          return (
            <button
              key={p.id}
              type="button"
              className="rev-settings-row"
              onClick={() => {
                triggerHaptic();
                switchProfile(p.id);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <span
                  className={`rev-settings-icon ${active ? '' : 'rev-neutral-chip'}`}
                  style={active ? { background: 'var(--primary)', color: '#FFFFFF' } : undefined}
                >
                  {shared ? <Users size={16} /> : <User size={16} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>{p.name}</span>
                  <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                    {active ? 'Cuenta seleccionada' : shared ? 'Espacio compartido' : 'Espacio personal'}
                  </span>
                </div>
              </div>
              {active && <Check size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            </button>
          );
        })}

        <button
          type="button"
          className="rev-settings-row"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 123, 194, 0.14)', color: 'var(--accent-light-blue)' }}>
              <Share2 size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Invitar a este espacio</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Genera un código para compartir gastos
              </span>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
        </button>

        <button
          type="button"
          className="rev-settings-row"
          onClick={() => {
            setJoinError('');
            setIsJoinPanelOpen(true);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(230, 30, 73, 0.14)', color: 'var(--accent-deep-pink)' }}>
              <UserPlus size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Vincular cuenta compartida</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Únete con un código de invitación
              </span>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
        </button>

        <button
          type="button"
          className="rev-settings-row"
          onClick={() => {
            setNewSpaceError('');
            setIsNewSpaceOpen(true);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 126, 0.14)', color: 'var(--accent-teal)' }}>
              <Plus size={17} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Crear nueva cuenta</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Separa ahorro, viajes o gastos de trabajo
              </span>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
        </button>

        {profiles.length > 1 && (
          <button
            type="button"
            className="rev-settings-row"
            onClick={() => {
              deleteActiveProfile().catch((err) => setBackupMessage(err.message));
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="rev-settings-icon" style={{ background: 'rgba(226, 59, 74, 0.14)', color: 'var(--danger-red)' }}>
                <Trash2 size={16} />
              </span>
              <div>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--danger-red)' }}>
                  {isSharedSpace ? 'Desvincular este espacio' : 'Eliminar esta cuenta'}
                </span>
                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                  {isSharedSpace ? 'Dejarás de ver sus movimientos' : 'Borra este espacio de tu perfil'}
                </span>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* GRUPO 2: SEGURIDAD Y PRIVACIDAD */}
      <p className="rev-section-label">Seguridad y privacidad</p>
      <div className="rev-settings-card">
        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
              <EyeOff size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Ocultar importes</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Difumina los saldos en pantalla
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAmountsHidden}
            className={`rev-switch ${isAmountsHidden ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              setIsAmountsHidden(!isAmountsHidden);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(147, 109, 98, 0.16)', color: 'var(--accent-brown)' }}>
              <Lock size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Bloqueo con PIN</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                {pinEnabled ? 'Activo con código de 4 dígitos' : 'Pide PIN al abrir la app'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pinEnabled}
            className={`rev-switch ${pinEnabled ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              if (pinEnabled) onRemovePin();
              else onSetupPin();
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        {pinEnabled && (
          <button type="button" className="rev-settings-row" onClick={onChangePin}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="rev-settings-icon rev-neutral-chip">
                <KeyRound size={16} />
              </span>
              <div>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Cambiar código PIN</span>
                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                  Elige una nueva clave de acceso
                </span>
              </div>
            </div>
            <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
          </button>
        )}
      </div>

      {/* GRUPO 3: APARIENCIA Y PREFERENCIAS */}
      <p className="rev-section-label">Apariencia y preferencias</p>
      <div className="rev-settings-card">
        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
              <Palette size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Fondo con color</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Imagen en inicio y degradado en Cuentas
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={colorfulHero}
            className={`rev-switch ${colorfulHero ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              onColorfulHeroChange?.(!colorfulHero);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
              <Moon size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Modo oscuro</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Canvas oscuro #000000
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            className={`rev-switch ${theme === 'dark' ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 126, 0.14)', color: 'var(--accent-teal)' }}>
              <TrendingUp size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Cartera de inversiones</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Activa la pestaña de cartera
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={investmentsEnabled}
            className={`rev-switch ${investmentsEnabled ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              onInvestmentsVisibilityChange(!investmentsEnabled);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 123, 194, 0.14)', color: 'var(--accent-light-blue)' }}>
              <Home size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Pantalla inicial</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Vista por defecto al abrir
              </span>
            </div>
          </div>
          <select
            value={defaultHomeTab}
            onChange={(e) => onDefaultHomeTabChange(e.target.value)}
            className="rev-home-select"
          >
            <option value="expenses">Inicio</option>
            <option value="movements">Cuentas</option>
            {investmentsEnabled && <option value="investments">Cartera</option>}
          </select>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(236, 126, 0, 0.14)', color: 'var(--accent-orange)' }}>
              <Bell size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Notificaciones</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                Alertas de topes y presupuesto
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            className={`rev-switch ${notifications ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              const next = !notifications;
              setNotifications(next);
              setPushNotificationsEnabled(activeProfile.id, next);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>
      </div>

      {/* GRUPO 4: DATOS Y SINCRONIZACIÓN */}
      <p className="rev-section-label">Datos y sincronización</p>
      <div className="rev-settings-card">
        <button type="button" className="rev-settings-row" onClick={() => setIsSyncPanelOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
              <ShieldCheck size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Sincronización en la nube</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                {syncUser ? `Conectado (${syncUser.email})` : 'Inicia sesión para respaldar tus datos'}
              </span>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
        </button>

        <button
          type="button"
          className="rev-settings-row"
          onClick={() => {
            setBackupMessage('');
            setIsExportOpen(true);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(66, 134, 25, 0.14)', color: 'var(--accent-light-green)' }}>
              <Download size={16} />
            </span>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Exportar e importar datos</span>
              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
                CSV, informe PDF y copia completa JSON
              </span>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
        </button>
      </div>

      {syncUser && (
        <div className="rev-settings-card" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="rev-settings-row"
            onClick={logoutFromSyncAccount}
            style={{ justifyContent: 'center', color: 'var(--danger-red)', fontWeight: 500, fontSize: '14px' }}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}

      <p className="nx-label" style={{ textAlign: 'center', color: 'var(--text-mute)', marginTop: '8px' }}>
        Nexo · Finanzas personales y compartidas
      </p>

      {/* MODAL EXPORTAR / IMPORTAR DATOS */}
      {isExportOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsExportOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Exportar e importar</h2>
              <button type="button" className="sheet-close" onClick={() => setIsExportOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: '0 0 16px' }}>
              Descarga tus movimientos o restaura una copia de seguridad.
            </p>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />

            <div className="rev-settings-card" style={{ marginBottom: '16px' }}>
              <button type="button" className="rev-settings-row" onClick={exportCsv}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 126, 0.14)', color: 'var(--accent-teal)' }}>
                    <FileSpreadsheet size={17} />
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Exportar CSV</span>
                    <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>Excel o Google Sheets</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={exportPdf}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'rgba(226, 59, 74, 0.14)', color: 'var(--danger-red)' }}>
                    <FileText size={17} />
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Informe PDF</span>
                    <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>Extracto listo para compartir</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={exportData}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
                    <FileJson size={17} />
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Copia completa JSON</span>
                    <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>Movimientos, categorías, topes y facturas</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={() => importInputRef.current?.click()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)' }}>
                    <Upload size={17} />
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 500 }}>Restaurar copia JSON</span>
                    <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>Importar respaldo previo</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>
            </div>

            {backupMessage && (
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--primary)', marginBottom: '12px' }}>
                {backupMessage}
              </p>
            )}

            <button type="button" className="nx-btn-dark" style={{ width: '100%' }} onClick={() => setIsExportOpen(false)}>
              Listo
            </button>
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL EDITAR PERFIL */}
      {profileEditOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setProfileEditOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Datos personales</h2>
              <button type="button" className="sheet-close" onClick={() => setProfileEditOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const val = String(new FormData(e.currentTarget).get('name') || '').trim();
              if (val) {
                onProfileNameChange(val);
                triggerHaptic();
                setProfileEditOpen(false);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre visible
                <input name="name" defaultValue={customName} required autoFocus />
              </label>
              <button className="nx-btn-dark" style={{ width: '100%' }} type="submit">
                Guardar cambios <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL INVITAR A CUENTA */}
      {isSharePanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSharePanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Invitar a este espacio</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSharePanelOpen(false)}>
                <X size={17} />
              </button>
            </div>
            {shareCode ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: '0 0 16px' }}>
                  Envía este código para que otra persona vincule <strong>{activeProfile?.name}</strong> en su móvil.
                </p>
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--surface-soft)',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  {shareCode}
                </div>
                <button
                  type="button"
                  className="nx-btn-dark"
                  style={{ width: '100%' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(shareCode);
                    triggerHaptic();
                    setCopiedCode(true);
                  }}
                >
                  {copiedCode ? <><Check size={16} /> Código copiado</> : <><Copy size={16} /> Copiar código</>}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--danger-red)', fontWeight: 500, marginBottom: '16px' }}>
                  Activa la sincronización en la nube para generar un código de invitación.
                </p>
                <button
                  type="button"
                  className="nx-btn-dark"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsSharePanelOpen(false);
                    setIsSyncPanelOpen(true);
                  }}
                >
                  Conectar nube ahora <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL VINCULAR CUENTA */}
      {isJoinPanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsJoinPanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Vincular cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsJoinPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: '0 0 16px' }}>
              Pega el código de invitación y elige un nombre para este espacio.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              setJoinError('');
              try {
                joinProfile(joinCode, joinName);
                triggerHaptic();
                setJoinCode('');
                setJoinName('');
                setIsJoinPanelOpen(false);
              } catch (err) {
                setJoinError(err.message);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '12px' }}>
                Código de invitación
                <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
              </label>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre del espacio
                <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Piso" />
              </label>
              {joinError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{joinError}</p>}
              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Unirme al espacio <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL NUEVO ESPACIO */}
      {isNewSpaceOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsNewSpaceOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Crear nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsNewSpaceOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setNewSpaceError('');
              try {
                addProfile(newSpaceName);
                triggerHaptic();
                setNewSpaceName('');
                setIsNewSpaceOpen(false);
              } catch (err) {
                setNewSpaceError(err.message);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre de la cuenta
                <input
                  required
                  autoFocus
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ej. Vacaciones, Ahorro, Trabajo..."
                />
              </label>
              {newSpaceError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{newSpaceError}</p>}
              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Crear cuenta <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL NUBE FIREBASE */}
      {isSyncPanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSyncPanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Sincronización en la nube</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSyncPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>

            {syncUser ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', marginBottom: '18px' }}>
                  Conectado como <strong>{syncUser.email}</strong>. Tus cuentas y movimientos se sincronizan en tiempo real.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logoutFromSyncAccount();
                    setIsSyncPanelOpen(false);
                  }}
                  className="nx-btn-soft"
                  style={{ width: '100%', color: 'var(--danger-red)' }}
                >
                  Cerrar sesión en la nube
                </button>
              </>
            ) : (
              <>
                <div className="record-tabs" style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    className={!isCreatingSyncAccount ? 'active' : ''}
                    onClick={() => { setIsCreatingSyncAccount(false); setSyncFormError(''); }}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className={isCreatingSyncAccount ? 'active' : ''}
                    onClick={() => { setIsCreatingSyncAccount(true); setSyncFormError(''); }}
                  >
                    Crear cuenta
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSyncFormError('');
                  try {
                    if (isCreatingSyncAccount) await createSyncAccount(syncEmail.trim(), syncPassword);
                    else await loginToSyncAccount(syncEmail.trim(), syncPassword);
                    triggerHaptic();
                    setSyncPassword('');
                    setIsSyncPanelOpen(false);
                  } catch (err) {
                    setSyncFormError(err.message || 'No se pudo autenticar.');
                  }
                }}>
                  <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '12px' }}>
                    Correo electrónico
                    <input type="email" value={syncEmail} onChange={(e) => setSyncEmail(e.target.value)} required />
                  </label>
                  <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                    Contraseña
                    <input type="password" value={syncPassword} onChange={(e) => setSyncPassword(e.target.value)} minLength={6} required />
                  </label>
                  {syncFormError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{syncFormError}</p>}
                  <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                    {isCreatingSyncAccount ? 'Registrarme' : 'Entrar'} <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>,
        document.body,
      )}
    </section>
  );
};

export default ProfileSwitcher;
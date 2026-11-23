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
    padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 28px;
    color: var(--rev-text);
  }
  .rev-profile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
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
    background: linear-gradient(145deg, #3D17EE 0%, #0075EB 100%);
    color: #FFFFFF;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 28px rgba(0, 117, 235, 0.28);
  }
  .rev-profile-edit-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--rev-card);
    color: var(--rev-text);
    border: 2px solid var(--rev-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rev-plan-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 5px 13px;
    border-radius: 999px;
    background: var(--rev-card);
    border: 1px solid var(--rev-border);
    box-shadow: var(--rev-shadow);
    font-size: 12px;
    font-weight: 700;
    color: var(--rev-text);
  }
  .rev-quick-trio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .rev-quick-tile {
    background: var(--rev-card);
    border: 1px solid var(--rev-border);
    border-radius: 18px;
    padding: 14px 10px;
    box-shadow: var(--rev-shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .rev-quick-tile:active {
    transform: scale(0.96);
  }
  .rev-section-label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--rev-muted);
    margin: 0 0 8px 6px;
    letter-spacing: -0.01em;
  }
  .rev-settings-card {
    background: var(--rev-card);
    border: 1px solid var(--rev-border);
    border-radius: 18px;
    padding: 2px 16px;
    box-shadow: var(--rev-shadow);
    margin-bottom: 20px;
  }
  .rev-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 13px 0;
    background: transparent;
    border: 0;
    color: var(--rev-text);
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }
  .rev-settings-row + .rev-settings-row {
    border-top: 1px solid var(--rev-border);
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
  .rev-switch {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    border: 0;
    padding: 3px;
    background: var(--rev-subtle);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .rev-switch.on {
    background: var(--rev-blue);
  }
  .rev-switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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

      {/* BARRA SUPERIOR LIMPIA */}
      <div className="rev-profile-top">
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rev-muted)' }}>
          Ajustes
        </span>
        <button
          type="button"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
          style={{
            height: '32px',
            padding: '0 12px',
            borderRadius: '999px',
            border: '1px solid var(--rev-border)',
            background: 'var(--rev-card)',
            color: 'var(--rev-blue)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <Share2 size={13} /> Invitar
        </button>
      </div>

      {/* CABECERA DE PERFIL ESTILO REVOLUT */}
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

        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          {customName}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--rev-muted)', margin: '3px 0 0', fontWeight: 500 }}>
          {syncUser ? syncUser.email : `@${customName.toLowerCase().replace(/\s+/g, '')}`}
        </p>

        <div className="rev-plan-pill">
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: syncUser ? 'var(--rev-green)' : 'var(--rev-blue)',
          }} />
          <span>{syncUser ? 'Personal · Nube activa' : 'Estándar · Local'}</span>
        </div>
      </div>

      {/* 3 ACCESOS RÁPIDOS */}
      <div className="rev-quick-trio">
        <button type="button" className="rev-quick-tile" onClick={() => setProfileEditOpen(true)}>
          <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
            <User size={18} />
          </span>
          <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>Perfil</strong>
        </button>

        <button type="button" className="rev-quick-tile" onClick={() => setIsSyncPanelOpen(true)}>
          <span className="rev-settings-icon" style={{
            background: syncUser ? 'rgba(0, 168, 89, 0.14)' : 'var(--rev-blue-soft)',
            color: syncUser ? 'var(--rev-green)' : 'var(--rev-blue)',
          }}>
            <Cloud size={18} />
          </span>
          <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>
            {syncUser ? 'Sincronizado' : 'Nube'}
          </strong>
        </button>

        <button
          type="button"
          className="rev-quick-tile"
          onClick={() => {
            setBackupMessage('');
            setIsExportOpen(true);
          }}
        >
          <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
            <Download size={18} />
          </span>
          <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>Backup</strong>
        </button>
      </div>

      {/* TARJETA DE PATRIMONIO DEL ESPACIO */}
      <div className="rev-settings-card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--rev-muted)' }}>
              Patrimonio en {activeProfile?.name}
            </span>
            <strong
              className="privacy-sensitive"
              style={{ display: 'block', fontSize: '26px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
            >
              {displayMoney(totalWealth)}
            </strong>
          </div>
          <span style={{
            padding: '5px 11px',
            borderRadius: '999px',
            background: 'var(--rev-subtle)',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--rev-muted)',
          }}>
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
                  className="rev-settings-icon"
                  style={{
                    background: active ? 'var(--rev-blue)' : 'var(--rev-subtle)',
                    color: active ? '#FFFFFF' : 'var(--rev-muted)',
                  }}
                >
                  {shared ? <Users size={16} /> : <User size={16} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{p.name}</strong>
                  <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                    {active ? 'Cuenta seleccionada' : shared ? 'Espacio compartido' : 'Espacio personal'}
                  </small>
                </div>
              </div>
              {active && <Check size={18} style={{ color: 'var(--rev-blue)', flexShrink: 0 }} />}
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
            <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
              <Share2 size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Invitar a este espacio</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Genera un código para compartir gastos
              </small>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
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
            <span className="rev-settings-icon" style={{ background: 'rgba(139, 92, 246, 0.14)', color: '#8B5CF6' }}>
              <UserPlus size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Vincular cuenta compartida</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Únete con un código de invitación
              </small>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
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
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 89, 0.14)', color: 'var(--rev-green)' }}>
              <Plus size={17} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Crear nueva cuenta</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Separa ahorro, viajes o gastos de trabajo
              </small>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
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
              <span className="rev-settings-icon" style={{ background: 'rgba(244, 63, 94, 0.14)', color: 'var(--rev-red)' }}>
                <Trash2 size={16} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--rev-red)' }}>
                  {isSharedSpace ? 'Desvincular este espacio' : 'Eliminar esta cuenta'}
                </strong>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                  {isSharedSpace ? 'Dejarás de ver sus movimientos' : 'Borra este espacio de tu perfil'}
                </small>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* GRUPO 2: SEGURIDAD Y PRIVACIDAD (REVOLUT SETTINGS) */}
      <p className="rev-section-label">Seguridad y privacidad</p>
      <div className="rev-settings-card">
        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
              <EyeOff size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Ocultar importes</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Difumina los saldos en pantalla
              </small>
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
            <span className="rev-settings-icon" style={{ background: 'rgba(79, 70, 229, 0.14)', color: '#4F46E5' }}>
              <Lock size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Bloqueo con PIN</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                {pinEnabled ? 'Activo con código de 4 dígitos' : 'Pide PIN al abrir la app'}
              </small>
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
              <span className="rev-settings-icon" style={{ background: 'var(--rev-subtle)', color: 'var(--rev-text)' }}>
                <KeyRound size={16} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Cambiar código PIN</strong>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                  Elige una nueva clave de acceso
                </small>
              </div>
            </div>
            <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
          </button>
        )}
      </div>

      {/* GRUPO 3: APARIENCIA Y PREFERENCIAS */}
      <p className="rev-section-label">Apariencia y preferencias</p>
      <div className="rev-settings-card">
        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(99, 102, 241, 0.14)', color: '#6366F1' }}>
              <Moon size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Modo oscuro</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Tema oscuro OLED #0B0E14
              </small>
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
            <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 89, 0.14)', color: 'var(--rev-green)' }}>
              <TrendingUp size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Cartera de inversiones</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Activa la pestaña de acciones y cripto
              </small>
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
            <span className="rev-settings-icon" style={{ background: 'rgba(14, 165, 233, 0.14)', color: '#0EA5E9' }}>
              <Home size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Pantalla inicial</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Vista por defecto al abrir
              </small>
            </div>
          </div>
          <select
            value={defaultHomeTab}
            onChange={(e) => onDefaultHomeTabChange(e.target.value)}
            style={{
              width: 'auto',
              margin: 0,
              height: '34px',
              padding: '0 10px',
              borderRadius: '10px',
              background: 'var(--rev-subtle)',
              border: 0,
              color: 'var(--rev-text)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <option value="expenses">Inicio</option>
            <option value="movements">Cuentas</option>
            {investmentsEnabled && <option value="investments">Cartera</option>}
          </select>
        </div>

        <div className="rev-settings-row" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' }}>
              <Bell size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Notificaciones</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                Alertas de topes y presupuesto
              </small>
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

      {/* GRUPO 4: NUBE Y COPIAS DE SEGURIDAD */}
      <p className="rev-section-label">Datos y sincronización</p>
      <div className="rev-settings-card">
        <button type="button" className="rev-settings-row" onClick={() => setIsSyncPanelOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
              <ShieldCheck size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Sincronización en la nube</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                {syncUser ? `Conectado (${syncUser.email})` : 'Inicia sesión para respaldar tus datos'}
              </small>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
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
            <span className="rev-settings-icon" style={{ background: 'rgba(13, 148, 136, 0.14)', color: '#0D9488' }}>
              <Download size={16} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Exportar e importar datos</strong>
              <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)' }}>
                CSV, informe PDF y copia completa JSON
              </small>
            </div>
          </div>
          <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
        </button>
      </div>

      {/* BOTÓN CERRAR SESIÓN ESTILO REVOLUT */}
      {syncUser && (
        <div className="rev-settings-card" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="rev-settings-row"
            onClick={logoutFromSyncAccount}
            style={{ justifyContent: 'center', color: 'var(--rev-red)', fontWeight: 700, fontSize: '14px' }}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--rev-muted)', marginTop: '8px' }}>
        Axiom · Finanzas personales y compartidas
      </p>

      {/* MODAL EXPORTAR / IMPORTAR DATOS */}
      {isExportOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsExportOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Exportar e importar</h2>
              <button type="button" className="sheet-close" onClick={() => setIsExportOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--rev-muted)', margin: '0 0 16px' }}>
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
                  <span className="rev-settings-icon" style={{ background: 'rgba(0, 168, 89, 0.14)', color: 'var(--rev-green)' }}>
                    <FileSpreadsheet size={17} />
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Exportar CSV</strong>
                    <small style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Excel o Google Sheets</small>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--rev-muted)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={exportPdf}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'rgba(244, 63, 94, 0.14)', color: 'var(--rev-red)' }}>
                    <FileText size={17} />
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Informe PDF</strong>
                    <small style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Extracto listo para compartir</small>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--rev-muted)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={exportData}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)' }}>
                    <FileJson size={17} />
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Copia completa JSON</strong>
                    <small style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Movimientos, categorías, topes y facturas</small>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--rev-muted)' }} />
              </button>

              <button type="button" className="rev-settings-row" onClick={() => importInputRef.current?.click()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="rev-settings-icon" style={{ background: 'var(--rev-subtle)', color: 'var(--rev-text)' }}>
                    <Upload size={17} />
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Restaurar copia JSON</strong>
                    <small style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Importar respaldo previo</small>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--rev-muted)' }} />
              </button>
            </div>

            {backupMessage && (
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-blue)', marginBottom: '12px' }}>
                {backupMessage}
              </p>
            )}

            <button type="button" className="sheet-submit" onClick={() => setIsExportOpen(false)}>
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Datos personales</h2>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '16px' }}>
                Nombre visible
                <input name="name" defaultValue={customName} required autoFocus />
              </label>
              <button className="sheet-submit" type="submit">
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Invitar a este espacio</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSharePanelOpen(false)}>
                <X size={17} />
              </button>
            </div>
            {shareCode ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--rev-muted)', margin: '0 0 16px' }}>
                  Envía este código para que otra persona vincule <strong>{activeProfile?.name}</strong> en su móvil.
                </p>
                <div style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--rev-card)',
                  border: '1px solid var(--rev-border)',
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
                  className="sheet-submit"
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
                <p style={{ fontSize: '13px', color: 'var(--rev-red)', fontWeight: 600, marginBottom: '16px' }}>
                  Activa la sincronización en la nube para generar un código de invitación.
                </p>
                <button
                  type="button"
                  className="sheet-submit"
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Vincular cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsJoinPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--rev-muted)', margin: '0 0 16px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '12px' }}>
                Código de invitación
                <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
              </label>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '16px' }}>
                Nombre del espacio
                <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Piso" />
              </label>
              {joinError && <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>{joinError}</p>}
              <button type="submit" className="sheet-submit">
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Crear nueva cuenta</h2>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '16px' }}>
                Nombre de la cuenta
                <input
                  required
                  autoFocus
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ej. Vacaciones, Ahorro, Trabajo..."
                />
              </label>
              {newSpaceError && <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>{newSpaceError}</p>}
              <button type="submit" className="sheet-submit">
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Sincronización en la nube</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSyncPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>

            {syncUser ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--rev-muted)', marginBottom: '18px' }}>
                  Conectado como <strong>{syncUser.email}</strong>. Tus cuentas y movimientos se sincronizan en tiempo real.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logoutFromSyncAccount();
                    setIsSyncPanelOpen(false);
                  }}
                  style={{
                    width: '100%',
                    height: '50px',
                    borderRadius: '999px',
                    border: 0,
                    background: 'rgba(244, 63, 94, 0.14)',
                    color: 'var(--rev-red)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '12px' }}>
                    Correo electrónico
                    <input type="email" value={syncEmail} onChange={(e) => setSyncEmail(e.target.value)} required />
                  </label>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '16px' }}>
                    Contraseña
                    <input type="password" value={syncPassword} onChange={(e) => setSyncPassword(e.target.value)} minLength={6} required />
                  </label>
                  {syncFormError && <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>{syncFormError}</p>}
                  <button type="submit" className="sheet-submit">
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
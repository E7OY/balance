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
  Layers,
  LogOut,
  Moon,
  Palette,
  Plus,
  QrCode,
  Share2,
  Shield,
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
import HomeThemeModal from './HomeThemeModal';
import { getSavedHomeBackground, HOME_BACKGROUNDS } from '../utils/homeBackgrounds';
import { Camera, Shuffle } from 'lucide-react';
import {
  DICEBEAR_SEEDS,
  getDiceBearAvatar,
  getRandomSeeds,
  processAvatarFile,
} from '../utils/avatar';
const SETTINGS_REVOLUT_CSS = `
  .rev-settings-page {
    min-height: 100dvh;
    background-color: var(--surface-soft);
    background-image: radial-gradient(90% 36% at 50% 0%, rgba(73, 79, 223, 0.12) 0%, transparent 100%);
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 36px;
    color: var(--ink);
  }
  .dark .rev-settings-page {
    background-color: var(--canvas-dark);
    background-image: radial-gradient(95% 38% at 50% 0%, rgba(28, 49, 128, 0.58) 0%, rgba(12, 18, 44, 0.24) 58%, transparent 100%);
    color: var(--on-dark);
  }
  .rev-settings-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .rev-close-circle {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .dark .rev-close-circle {
    color: var(--on-dark);
  }
  .rev-close-circle:active {
    opacity: 0.65;
  }
  .rev-settings-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2px 0 22px;
  }
  .rev-settings-avatar {
    width: 74px;
    height: 74px;
    border-radius: 50%;
    background: linear-gradient(145deg, #3D17EE 0%, #494fdf 100%);
    color: #FFFFFF;
    font-size: 25px;
    font-weight: 600;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    cursor: pointer;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  }
  .rev-settings-name {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin: 0;
  }
  .rev-settings-handle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    background: transparent;
    border: 0;
    padding: 2px 6px;
    color: var(--text-mute);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  /* DOS TARJETAS SUPERIORES (PLAN/PATRIMONIO + INVITAR) */
  .rev-bento-duo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .rev-bento-box {
    background-color: var(--canvas-light);
    color: var(--ink);
    border: 0;
    border-radius: 18px;
    padding: 15px 16px;
    min-height: 112px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    transition: transform 0.12s ease;
  }
  .dark .rev-bento-box {
    background-color: #161618;
    color: var(--on-dark);
    box-shadow: none;
  }
  .rev-bento-box:active {
    transform: scale(0.97);
  }
  .rev-bento-title {
    display: block;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .rev-bento-sub {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-mute);
    margin-top: 2px;
  }

  /* TARJETAS DE LISTA AGRUPADAS ESTILO REVOLUT */
  .rev-list-group {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: 18px;
    padding: 6px 16px;
    margin-bottom: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .dark .rev-list-group {
    background-color: #161618;
    color: var(--on-dark);
    box-shadow: none;
  }
  .bottom-sheet .rev-list-group {
    background-color: var(--surface-soft);
    box-shadow: none;
  }
  .dark .bottom-sheet .rev-list-group {
    background-color: #1C1C1F;
  }
  .rev-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    padding: 13px 2px;
    background: transparent;
    border: 0;
    color: inherit;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }
  .rev-list-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
  }
  .rev-list-icon {
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    flex-shrink: 0;
  }
  .dark .rev-list-icon {
    color: var(--on-dark);
  }
  .rev-list-label {
    font-size: 14.5px;
    font-weight: 500;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rev-list-meta {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-mute);
    flex-shrink: 0;
  }
  .rev-home-select {
    width: auto !important;
    margin: 0 !important;
    height: 32px !important;
    padding: 0 10px !important;
    border-radius: 999px !important;
    background-color: var(--surface-soft) !important;
    border: 0 !important;
    color: var(--ink) !important;
    font-size: 12.5px !important;
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
  avatar = '',
  onAvatarChange,
  onSetupPin,
  onChangePin,
  onRemovePin,
  onClose,
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
const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarSeeds, setAvatarSeeds] = useState(DICEBEAR_SEEDS);
  const [notifications, setNotifications] = useState(() => getPushNotificationsEnabled(activeProfile.id));
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const customName = profileName || activeProfile?.name || 'Mi perfil';

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [bgConfig, setBgConfig] = useState(() => getSavedHomeBackground());

  const [isSpacesSheetOpen, setIsSpacesSheetOpen] = useState(false);
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

  const handleTag = `@${customName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '') || 'nexo'}`;

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

  const currentBgName = bgConfig.customImage
    ? 'Foto propia'
    : (HOME_BACKGROUNDS.find((b) => b.id === bgConfig.id)?.shortName || 'Índigo');

  const handleClosePage = () => {
    triggerHaptic();
    if (onClose) {
      onClose();
    } else {
      onDefaultHomeTabChange?.(defaultHomeTab || 'expenses');
    }
  };

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
    <section className="rev-settings-page" aria-label="Perfil y ajustes">
      <style>{SETTINGS_REVOLUT_CSS}</style>

      {/* BARRA SUPERIOR CON BOTÓN X */}
      <div className="rev-settings-topbar">
        <button
          type="button"
          className="rev-close-circle"
          onClick={handleClosePage}
          aria-label="Cerrar ajustes"
        >
          <X size={21} strokeWidth={2.2} />
        </button>
      </div>

      {/* CABECERA CENTRADA: AVATAR + NOMBRE + @USUARIO */}
      <div className="rev-settings-hero">
{/* AVATAR EN PERFIL */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsAvatarModalOpen(true);
          }}
          style={{
            position: 'relative',
            width: '78px',
            height: '78px',
            borderRadius: '999px',
            border: 0,
            padding: 0,
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(73, 79, 223, 0.28)',
          }}
          aria-label="Cambiar avatar"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar de perfil"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '999px',
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#FFFFFF',
              }}
            />
          ) : (
            (profileName || 'E').slice(0, 1).toUpperCase()
          )}

          <span
            style={{
              position: 'absolute',
              right: '-2px',
              bottom: '-2px',
              width: '26px',
              height: '26px',
              borderRadius: '999px',
              backgroundColor: 'var(--canvas-light)',
              color: 'var(--ink)',
              border: '2px solid var(--surface-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.16)',
            }}
          >
            <Camera size={13} strokeWidth={2.2} />
          </span>
        </button>
      </div>

      {/* MODAL SELECTOR DE AVATAR DICEBEAR */}
      {isAvatarModalOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 120 }} onMouseDown={() => setIsAvatarModalOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Elige tu avatar</h2>
              <button type="button" className="sheet-close" onClick={() => setIsAvatarModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              {avatarSeeds.map((seed) => {
                const url = getDiceBearAvatar(seed);
                const isSelected = avatar === url;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      onAvatarChange?.(url);
                      setIsAvatarModalOpen(false);
                    }}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '999px',
                      padding: '2px',
                      background: 'transparent',
                      border: isSelected ? '3px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    aria-label={`Avatar ${seed}`}
                  >
                    <img
                      src={url}
                      alt={seed}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '999px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: avatar ? '10px' : 0 }}>
              <button
                type="button"
                className="nx-btn-soft"
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic();
                  setAvatarSeeds(getRandomSeeds(12));
                }}
              >
                <Shuffle size={15} /> Generar otros
              </button>

              <label
                className="nx-btn-dark"
                style={{ flex: 1, margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Upload size={15} /> Subir foto
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await processAvatarFile(file, 256);
                      onAvatarChange?.(dataUrl);
                      triggerHaptic();
                      setIsAvatarModalOpen(false);
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {avatar && (
              <button
                type="button"
                className="nx-btn-soft"
                style={{ width: '100%', color: 'var(--danger-red)' }}
                onClick={() => {
                  triggerHaptic();
                  onAvatarChange?.('');
                  setIsAvatarModalOpen(false);
                }}
              >
                <Trash2 size={15} /> Usar iniciales
              </button>
            )}
          </section>
        </div>,
        document.body,
      )}

        <h1 className="rev-settings-name">{customName}</h1>

        <button
          type="button"
          className="rev-settings-handle"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
        >
          <span>{handleTag}</span>
          <QrCode size={14} />
        </button>
      </div>

      {/* DOS TARJETAS SUPERIORES (ESTILO ULTRA / INVITE FRIENDS) */}
      <div className="rev-bento-duo">
        <button
          type="button"
          className="rev-bento-box"
          onClick={() => setIsSpacesSheetOpen(true)}
        >
          <Layers size={21} strokeWidth={2} />
          <div>
            <strong className="rev-bento-title privacy-sensitive">
              {displayMoney(totalWealth)}
            </strong>
            <span className="rev-bento-sub">
              {activeProfile?.name} · {profiles.length} {profiles.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="rev-bento-box"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
        >
          <UserPlus size={21} strokeWidth={2} />
          <div>
            <strong className="rev-bento-title">Invitar</strong>
            <span className="rev-bento-sub">Comparte gastos en grupo</span>
          </div>
        </button>
      </div>

      {/* BLOQUE 1: CUENTA, ESPACIOS, NUBE, BACKUP Y TEMA */}
      <div className="rev-list-group">
        <button type="button" className="rev-list-row" onClick={() => setProfileEditOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><User size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Cuenta</span>
          </div>
          <span className="rev-list-meta">{customName}</span>
        </button>

        <button type="button" className="rev-list-row" onClick={() => setIsSpacesSheetOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Users size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Espacios compartidos</span>
          </div>
          <span className="rev-list-meta">{activeProfile?.name}</span>
        </button>

        <button type="button" className="rev-list-row" onClick={() => setIsSyncPanelOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Cloud size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Sincronización en la nube</span>
          </div>
          <span className="rev-list-meta">{syncUser ? 'Activa' : 'Local'}</span>
        </button>

        <button
          type="button"
          className="rev-list-row"
          onClick={() => {
            setBackupMessage('');
            setIsExportOpen(true);
          }}
        >
          <div className="rev-list-left">
            <span className="rev-list-icon"><Download size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Exportar y respaldo</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
        </button>

        <button type="button" className="rev-list-row" onClick={() => setIsThemeModalOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Palette size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Fondo de inicio</span>
          </div>
          <span className="rev-list-meta">{currentBgName}</span>
        </button>
      </div>

      {/* BLOQUE 2: SEGURIDAD Y PRIVACIDAD */}
      <div className="rev-list-group">
        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Shield size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Bloqueo con PIN</span>
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
          <button type="button" className="rev-list-row" onClick={onChangePin}>
            <div className="rev-list-left">
              <span className="rev-list-icon"><KeyRound size={19} strokeWidth={2} /></span>
              <span className="rev-list-label">Cambiar código PIN</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
          </button>
        )}

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><EyeOff size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Ocultar importes</span>
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
      </div>

      {/* BLOQUE 3: NOTIFICACIONES Y APARIENCIA */}
      <div className="rev-list-group">
        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Bell size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Notificaciones</span>
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

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Moon size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Modo oscuro</span>
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

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><TrendingUp size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Cartera de inversiones</span>
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

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Home size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Pantalla inicial</span>
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
      </div>

      {/* BLOQUE 4: CERRAR SESIÓN */}
      {syncUser && (
        <div className="rev-list-group">
          <button
            type="button"
            className="rev-list-row"
            onClick={logoutFromSyncAccount}
            style={{ color: 'var(--danger-red)' }}
          >
            <div className="rev-list-left">
              <span className="rev-list-icon" style={{ color: 'var(--danger-red)' }}>
                <LogOut size={19} strokeWidth={2} />
              </span>
              <span className="rev-list-label">Cerrar sesión</span>
            </div>
          </button>
        </div>
      )}

      {/* HOJA DE CUENTAS Y ESPACIOS COMPARTIDOS */}
      {isSpacesSheetOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSpacesSheetOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Cuentas y espacios</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSpacesSheetOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="rev-list-group">
              {profiles.map((p) => {
                const active = p.id === activeProfileId;
                const shared = p.id.includes('___');
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="rev-list-row"
                    onClick={() => {
                      triggerHaptic();
                      switchProfile(p.id);
                      setIsSpacesSheetOpen(false);
                    }}
                  >
                    <div className="rev-list-left">
                      <span className="rev-list-icon" style={{ color: active ? 'var(--primary)' : undefined }}>
                        {shared ? <Users size={18} /> : <User size={18} />}
                      </span>
                      <div>
                        <span className="rev-list-label" style={{ display: 'block' }}>{p.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-mute)' }}>
                          {shared ? 'Espacio compartido' : 'Espacio personal'}
                        </span>
                      </div>
                    </div>
                    {active && <Check size={18} style={{ color: 'var(--primary)' }} />}
                  </button>
                );
              })}
            </div>

            <div className="rev-list-group">
              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setNewSpaceError('');
                  setIsNewSpaceOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><Plus size={19} /></span>
                  <span className="rev-list-label">Crear nueva cuenta</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setJoinError('');
                  setIsJoinPanelOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><UserPlus size={19} /></span>
                  <span className="rev-list-label">Vincular cuenta compartida</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setCopiedCode(false);
                  setIsSharePanelOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><Share2 size={19} /></span>
                  <span className="rev-list-label">Invitar a {activeProfile?.name}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              {profiles.length > 1 && (
                <button
                  type="button"
                  className="rev-list-row"
                  onClick={() => {
                    deleteActiveProfile()
                      .then(() => setIsSpacesSheetOpen(false))
                      .catch((err) => setBackupMessage(err.message));
                  }}
                  style={{ color: 'var(--danger-red)' }}
                >
                  <div className="rev-list-left">
                    <span className="rev-list-icon" style={{ color: 'var(--danger-red)' }}><Trash2 size={19} /></span>
                    <span className="rev-list-label">
                      {isSharedSpace ? 'Desvincular este espacio' : 'Eliminar esta cuenta'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL EXPORTAR / IMPORTAR DATOS */}
      {isExportOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsExportOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Exportar y respaldo</h2>
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

            <div className="rev-list-group" style={{ marginBottom: '16px' }}>
              <button type="button" className="rev-list-row" onClick={exportCsv}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileSpreadsheet size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Exportar CSV</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-mute)' }}>Excel o Google Sheets</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportPdf}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileText size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Informe PDF</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-mute)' }}>Extracto listo para compartir</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportData}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileJson size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Copia completa JSON</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-mute)' }}>Movimientos, categorías, topes y facturas</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={() => importInputRef.current?.click()}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><Upload size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Restaurar copia JSON</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-mute)' }}>Importar respaldo previo</span>
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Datos personales</h2>
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Invitar a este espacio</h2>
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Vincular cuenta</h2>
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Crear nueva cuenta</h2>
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Sincronización en la nube</h2>
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

      <HomeThemeModal
        open={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        accountLabel={`${activeProfile?.name || 'Personal'} · EUR`}
        balanceDisplay={displayMoney(totalWealth)}
        onApplied={(nextConfig) => {
          setBgConfig(nextConfig);
          onColorfulHeroChange?.(nextConfig.id !== 'obsidian-pure');
        }}
      />
    </section>
  );
};

export default ProfileSwitcher;
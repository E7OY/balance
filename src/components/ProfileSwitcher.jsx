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
import {
  DICEBEAR_SEEDS,
} from '../utils/avatar';

const SETTINGS_REVOLUT_CSS = `
  .rev-settings-page {
    min-height: 100dvh;
    background-color: #FAFAFB;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 36px;
    color: #111827;
  }
  .dark .rev-settings-page {
    background-color: var(--canvas-dark);
    color: #FFFFFF;
  }
  .rev-settings-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .rev-close-circle {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .dark .rev-close-circle {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .rev-close-circle:active {
    transform: scale(0.93);
  }

  /* DOS TARJETAS SUPERIORES (PATRIMONIO + INVITAR) — BORDE #EAECEF IGUAL QUE HOME */
  .rev-bento-duo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .rev-bento-box {
    background-color: #FFFFFF;
    color: #111827;
    border: 1px solid #EAECEF;
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
    box-shadow: none;
    transition: transform 0.12s ease, background-color 0.14s ease;
  }
  .dark .rev-bento-box {
    background-color: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
    color: #FFFFFF;
    box-shadow: none;
  }
  .rev-bento-box:active {
    transform: scale(0.985);
    background-color: #F9FAFB;
  }
  .dark .rev-bento-box:active {
    background-color: rgba(255, 255, 255, 0.04);
  }
  .rev-bento-title {
    display: block;
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .rev-bento-sub {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: #9CA3AF;
    margin-top: 2px;
  }

  /* CAJAS DE LISTA AGRUPADAS CON BORDE FINO #EAECEF Y DIVISORES #F1F3F5 */
  .rev-list-group {
    background-color: #FFFFFF;
    color: #111827;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 0;
    margin-bottom: 14px;
    box-shadow: none;
    overflow: hidden;
  }
  .dark .rev-list-group {
    background-color: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
    color: #FFFFFF;
    box-shadow: none;
  }
  .bottom-sheet .rev-list-group {
    background-color: #FFFFFF;
    border: 1px solid #EAECEF;
    box-shadow: none;
  }
  .dark .bottom-sheet .rev-list-group {
    background-color: #1B1E27;
    border-color: rgba(255, 255, 255, 0.09);
  }
  .rev-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    padding: 13px 16px;
    background: transparent;
    border: 0;
    color: inherit;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.14s ease;
  }
  .rev-list-row + .rev-list-row {
    border-top: 1px solid #F1F3F5;
  }
  .dark .rev-list-row + .rev-list-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
  button.rev-list-row:active {
    background-color: #F9FAFB;
  }
  .dark button.rev-list-row:active {
    background-color: rgba(255, 255, 255, 0.04);
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
    color: #111827;
    flex-shrink: 0;
  }
  .dark .rev-list-icon {
    color: #FFFFFF;
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
    color: #9CA3AF;
    flex-shrink: 0;
  }
  .rev-home-select {
    width: auto !important;
    margin: 0 !important;
    height: 32px !important;
    padding: 0 10px !important;
    border-radius: 999px !important;
    background-color: #FAFAFB !important;
    border: 1px solid #EAECEF !important;
    color: #111827 !important;
    font-size: 12.5px !important;
    font-weight: 500 !important;
    cursor: pointer;
  }
  .dark .rev-home-select {
    background-color: #242428 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #FFFFFF !important;
  }
  .rev-switch {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    border: 0;
    padding: 3px;
    background: #E5E7EB;
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

  /* =========================================================
     WALLET CARD EN PERFIL + CAÍDA ESCALONADA DE TARJETAS
     ========================================================= */
  @keyframes revProfileCardDrop {
    0% {
      opacity: 0;
      transform: translate3d(0, calc(var(--ty) - 145px), 0) rotate(0deg) scale(0.94);
    }
    25% {
      opacity: 1;
    }
    76% {
      opacity: 1;
      transform: translate3d(0, calc(var(--ty) + 5px), 0) rotate(var(--rot)) scale(1);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, var(--ty), 0) rotate(var(--rot)) scale(1);
    }
  }

  .rev-wallet-outer {
    width: 100%;
    padding: 7px;
    border-radius: 26px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  .dark .rev-wallet-outer {
    background: #16171C;
    border: 1px solid rgba(255, 255, 255, 0.09);
  }
  .rev-wallet-card {
    position: relative;
    width: 100%;
    height: 224px;
    border-radius: 20px;
    background: linear-gradient(180deg, #1E1F24 0%, #141519 100%);
    overflow: hidden;
    border: 0;
    padding: 0;
    cursor: pointer;
    display: block;
    text-align: center;
    font-family: inherit;
    box-shadow: none;
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dark .rev-wallet-card {
    background: linear-gradient(180deg, #1A1B20 0%, #101115 100%);
    box-shadow: none;
  }
  .rev-wallet-card:active {
    transform: scale(0.985);
  }
  .rev-wallet-card:hover .rev-wallet-mini-card {
    transform: translate3d(0, calc(var(--ty) - 6px), 0) rotate(var(--rot));
  }
  .rev-wallet-title {
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(255, 255, 255, 0.56);
    z-index: 1;
    pointer-events: none;
  }
  .rev-wallet-stack {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .rev-wallet-mini-card {
    position: absolute;
    left: 50%;
    width: 78%;
    height: 124px;
    margin-left: -39%;
    border-radius: 18px;
    border: 2px solid rgba(255, 255, 255, 0.92);
    padding: 12px 15px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    color: #FFFFFF;
    box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.28);
    transform: translate3d(0, var(--ty), 0) rotate(var(--rot));
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    animation: revProfileCardDrop 0.95s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms) backwards;
    will-change: transform, opacity;
  }
  .rev-wallet-pocket {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    height: 126px;
    border-radius: 16px;
    z-index: 4;
    background: linear-gradient(
      180deg,
      rgba(120, 125, 138, 0.46) 0%,
      rgba(56, 59, 68, 0.68) 55%,
      rgba(28, 30, 36, 0.88) 100%
    );
    backdrop-filter: blur(22px) saturate(185%);
    -webkit-backdrop-filter: blur(22px) saturate(185%);
    border-top: 1px solid rgba(255, 255, 255, 0.38);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.34),
      inset 0 -10px 22px rgba(0, 0, 0, 0.42),
      0 -8px 24px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
  }
  .rev-wallet-balance-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.72);
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .rev-wallet-balance-val {
    font-size: 31px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #FFFFFF;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .rev-wallet-balance-dec {
    color: rgba(255, 255, 255, 0.48);
    font-weight: 600;
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
  getTransactionsForProfile,
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

  const isSharedSpace = activeProfileId.includes('___');
  const shareCode = isSharedSpace
    ? activeProfileId
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

  const WALLET_CARD_BGS = {
    'revolut-standard': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 52%, #EC4899 100%)',
    'metal-black': 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    'metal-space-grey': 'linear-gradient(145deg, #6B7280 0%, #3F434C 55%, #23252A 100%)',
    'metal-gold': 'linear-gradient(135deg, #DFBD69 0%, #A8823A 52%, #735723 100%)',
    'metal-rose-gold': 'linear-gradient(135deg, #F4A29E 0%, #C97A74 52%, #884A45 100%)',
    'metal-lavender': 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 52%, #4C1D95 100%)',
    'ultra-platinum': 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 52%, #475569 100%)',
    chromatic: 'linear-gradient(125deg, #60A5FA 0%, #A78BFA 32%, #F472B6 65%, #FBBF24 100%)',
    disposable: 'linear-gradient(135deg, #FB7185 0%, #E11D48 55%, #9F1239 100%)',
    cobalt: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #1D4ED8 100%)',
    emerald: 'linear-gradient(135deg, #34D399 0%, #059669 55%, #064E3B 100%)',
    'midnight-aurora': 'linear-gradient(135deg, #38BDF8 0%, #2563EB 52%, #1E1B4B 100%)',
    'sunset-amber': 'linear-gradient(135deg, #FDBA74 0%, #F97316 52%, #9A3412 100%)',
    bronze: 'linear-gradient(135deg, #D6A89A 0%, #936D62 55%, #4A352F 100%)',
  };

  const totalWealth = profiles.reduce((sum, p) => {
    const pTxs = p.id === activeProfileId
      ? transactions
      : (getTransactionsForProfile ? getTransactionsForProfile(p.id) : []);
    const txBal = (Array.isArray(pTxs) ? pTxs : []).reduce((acc, tx) => (
      tx.type === 'Ingreso' ? acc + (Number(tx.amount) || 0) : tx.type === 'Gasto' ? acc - (Number(tx.amount) || 0) : acc
    ), 0);
    return sum + txBal;
  }, 0) + investmentRecords.reduce((acc, rec) => (
    rec.soldAt ? acc : acc + (Number(rec.currentValue) || 0)
  ), 0);

  const walletCards = (() => {
    let savedThemes = {};
    let savedNets = {};
    try {
      savedThemes = JSON.parse(localStorage.getItem('balance-account-themes') || '{}') || {};
      savedNets = JSON.parse(localStorage.getItem('balance-account-networks') || '{}') || {};
    } catch {}

    // Ordenamos para que la cuenta activa quede siempre la última (al frente del bolsillo)
    const orderedProfiles = [
      ...profiles.filter((p) => p.id !== activeProfileId),
      ...profiles.filter((p) => p.id === activeProfileId),
    ].slice(-4);

    const themeKeys = Object.keys(WALLET_CARD_BGS);

    const posesByCount = {
      1: [{ ty: '60px', rot: '0deg' }],
      2: [
        { ty: '42px', rot: '-6deg' },
        { ty: '66px', rot: '0deg' },
      ],
      3: [
        { ty: '32px', rot: '10deg' },
        { ty: '48px', rot: '-5deg' },
        { ty: '68px', rot: '0deg' },
      ],
      4: [
        { ty: '26px', rot: '-9deg' },
        { ty: '38px', rot: '9deg' },
        { ty: '52px', rot: '-4deg' },
        { ty: '68px', rot: '0deg' },
      ],
    };

    const poses = posesByCount[orderedProfiles.length] || posesByCount[1];

    return orderedProfiles.map((p, idx) => {
      const origIdx = Math.max(0, profiles.findIndex((item) => item.id === p.id));
      const themeKey = savedThemes[p.id] || themeKeys[origIdx % themeKeys.length];
      return {
        id: p.id,
        name: p.name,
        bg: WALLET_CARD_BGS[themeKey] || WALLET_CARD_BGS['revolut-standard'],
        net: savedNets[p.id] || 'mastercard',
        ...poses[idx],
      };
    });
  })();

const rawWealthNum = new Intl.NumberFormat('es-ES', {
    useGrouping: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(totalWealth));

  const formattedWealth = `${totalWealth < 0 ? '-' : ''}€${rawWealthNum}`;
  const wealthCommaIdx = formattedWealth.indexOf(',');
  const wealthInt = isAmountsHidden
    ? '€••••'
    : (wealthCommaIdx === -1 ? formattedWealth : formattedWealth.slice(0, wealthCommaIdx));
  const wealthDec = isAmountsHidden || wealthCommaIdx === -1
    ? ''
    : formattedWealth.slice(wealthCommaIdx);

  const displayMoney = (val) => {
    if (isAmountsHidden) return '€••••';
    const num = Number(val) || 0;
    return `${num < 0 ? '-' : ''}€${new Intl.NumberFormat('es-ES', {
      useGrouping: 'always',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num))}`;
  };
  
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
          <X size={19} strokeWidth={2.2} />
        </button>
      </div>

      {/* WALLET CARD ARRIBA CON ABANICO DE TARJETAS EN CAÍDA ESCALONADA */}
      <div className="rev-wallet-outer">
        <button
          type="button"
          className="rev-wallet-card"
          onClick={() => {
            triggerHaptic();
            setIsSpacesSheetOpen(true);
          }}
          aria-label="Ver cuentas y patrimonio total"
        >
          <span className="rev-wallet-title">Wallet</span>

          <div className="rev-wallet-stack" aria-hidden="true">
            {walletCards.map((card, idx) => {
              const isLightCard = card.bg.includes('#E2E8F0');
              return (
                <div
                  key={card.id}
                  className="rev-wallet-mini-card"
                  style={{
                    background: card.bg,
                    '--ty': card.ty,
                    '--rot': card.rot,
                    '--delay': `${60 + idx * 140}ms`,
                  }}
                >
                  {card.net === 'none' ? (
                    <span />
                  ) : card.net === 'visa' ? (
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        fontStyle: 'italic',
                        letterSpacing: '-0.04em',
                        color: isLightCard ? '#1E3A8A' : '#FFFFFF',
                      }}
                    >
                      VISA
                    </span>
                  ) : card.net === 'amex' ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        color: isLightCard ? '#0F172A' : '#FFFFFF',
                      }}
                    >
                      AMEX
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <i
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: card.net === 'mastercard-color' ? '#EB001B' : '#3A3B40',
                          border: '1px solid rgba(255,255,255,0.35)',
                          display: 'inline-block',
                        }}
                      />
                      <i
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: card.net === 'mastercard-color' ? '#F79E1B' : '#B4B6BE',
                          border: '1px solid rgba(255,255,255,0.35)',
                          marginLeft: '-7px',
                          opacity: 0.9,
                          display: 'inline-block',
                        }}
                      />
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: isLightCard ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    {card.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rev-wallet-pocket">
            <span className="rev-wallet-balance-label">Patrimonio total</span>
            <strong className="rev-wallet-balance-val privacy-sensitive">
              {wealthInt}
              {wealthDec && <span className="rev-wallet-balance-dec">{wealthDec}</span>}
            </strong>
          </div>
        </button>
      </div>

      {/* DOS CAJAS SUPERIORES (PATRIMONIO + INVITAR) */}
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
          <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
            <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
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
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px' }}>
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
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Excel o Google Sheets</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportPdf}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileText size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Informe PDF</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Extracto listo para compartir</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportData}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileJson size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Copia completa JSON</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Movimientos, categorías, topes y facturas</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={() => importInputRef.current?.click()}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><Upload size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Restaurar copia JSON</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Importar respaldo previo</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
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
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px' }}>
                  Envía este código para que otra persona vincule <strong>{activeProfile?.name}</strong> en su móvil.
                </p>
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#FAFAFB',
                  border: '1px solid #EAECEF',
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
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px' }}>
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
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '18px' }}>
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Settings,
  Share2,
  Snowflake,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const CARD_THEMES = [
  // OFICIALES DE REVOLUT
  {
    id: 'revolut-standard',
    label: 'Revolut Standard',
    bg: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 52%, #EC4899 100%)',
  },
  {
    id: 'metal-black',
    label: 'Metal Black',
    bg: 'linear-gradient(145deg, #2C2D32 0%, #16171A 52%, #09090B 100%)',
  },
  {
    id: 'metal-space-grey',
    label: 'Space Grey',
    bg: 'linear-gradient(145deg, #5C606B 0%, #3A3D45 50%, #23252A 100%)',
  },
  {
    id: 'metal-gold',
    label: 'Metal Gold',
    bg: 'linear-gradient(135deg, #C8A45D 0%, #9E7B38 48%, #735723 100%)',
  },
  {
    id: 'metal-rose-gold',
    label: 'Rose Gold',
    bg: 'linear-gradient(135deg, #C98B83 0%, #A46760 50%, #7A4843 100%)',
  },
  {
    id: 'metal-lavender',
    label: 'Metal Lavender',
    bg: 'linear-gradient(135deg, #8B7AD9 0%, #6353B5 52%, #44368A 100%)',
  },
  {
    id: 'ultra-platinum',
    label: 'Ultra Platinum',
    bg: 'linear-gradient(135deg, #9EA4B0 0%, #6C727F 48%, #464B56 100%)',
  },
  {
    id: 'chromatic',
    label: 'Chromatic',
    bg: 'linear-gradient(125deg, #3B82F6 0%, #8B5CF6 28%, #EC4899 56%, #F59E0B 82%, #10B981 100%)',
  },
  {
    id: 'disposable',
    label: 'Desechable',
    bg: 'linear-gradient(135deg, #FF2E93 0%, #E11D48 55%, #9F1239 100%)',
  },

  // EXTRAS
  {
    id: 'cobalt',
    label: 'Azul Cobalto',
    bg: 'linear-gradient(145deg, #494FDF 0%, #2D32B8 55%, #1A1E7A 100%)',
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    bg: 'linear-gradient(145deg, #00A87E 0%, #007558 55%, #024B39 100%)',
  },
  {
    id: 'midnight-aurora',
    label: 'Aurora',
    bg: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0EA5E9 100%)',
  },
  {
    id: 'sunset-amber',
    label: 'Ámbar',
    bg: 'linear-gradient(135deg, #F97316 0%, #C2410C 52%, #7C2D12 100%)',
  },
  {
    id: 'bronze',
    label: 'Bronce',
    bg: 'linear-gradient(145deg, #936D62 0%, #63473F 55%, #3E2C27 100%)',
  },
];

const CARD_NETWORKS = [
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'mastercard-color', label: 'MC Color' },
  { id: 'visa', label: 'Visa' },
  { id: 'amex', label: 'Amex' },
  { id: 'none', label: 'Sin logo' },

];

const getTodayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

  const ACCOUNT_THEME_BGS = {
    // Oficiales Revolut
    "revolut-standard":
      "linear-gradient(135deg, #2563EB 0%, #7C3AED 52%, #EC4899 100%)",
    "metal-black":
      "linear-gradient(145deg, #2C2D32 0%, #16171A 52%, #09090B 100%)",
    "metal-space-grey":
      "linear-gradient(145deg, #5C606B 0%, #3A3D45 50%, #23252A 100%)",
    "metal-gold":
      "linear-gradient(135deg, #C8A45D 0%, #9E7B38 48%, #735723 100%)",
    "metal-rose-gold":
      "linear-gradient(135deg, #C98B83 0%, #A46760 50%, #7A4843 100%)",
    "metal-lavender":
      "linear-gradient(135deg, #8B7AD9 0%, #6353B5 52%, #44368A 100%)",
    "ultra-platinum":
      "linear-gradient(135deg, #9EA4B0 0%, #6C727F 48%, #464B56 100%)",
    chromatic:
      "linear-gradient(125deg, #3B82F6 0%, #8B5CF6 28%, #EC4899 56%, #F59E0B 82%, #10B981 100%)",
    disposable:
      "linear-gradient(135deg, #FF2E93 0%, #E11D48 55%, #9F1239 100%)",
    // Extras y anteriores
    standard: "linear-gradient(145deg, #2D2E32 0%, #1C1D20 100%)",
    cobalt: "linear-gradient(145deg, #494FDF 0%, #2D32B8 55%, #1A1E7A 100%)",
    teal: "linear-gradient(145deg, #00A87E 0%, #007558 100%)",
    emerald: "linear-gradient(145deg, #00A87E 0%, #007558 55%, #024B39 100%)",
    pink: "linear-gradient(145deg, #E61E49 0%, #A81032 100%)",
    brown: "linear-gradient(145deg, #936D62 0%, #63473F 100%)",
    bronze: "linear-gradient(145deg, #936D62 0%, #63473F 55%, #3E2C27 100%)",
    "midnight-aurora":
      "linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0EA5E9 100%)",
    "sunset-amber":
      "linear-gradient(135deg, #F97316 0%, #C2410C 52%, #7C2D12 100%)",
  };

  const FALLBACK_THEME_IDS = [
    "revolut-standard",
    "metal-black",
    "cobalt",
    "emerald",
    "disposable",
    "metal-gold",
  ];

const toDateInputValue = (isoOrTs) => {
  if (!isoOrTs) return getTodayIso();
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrTs)) return isoOrTs;
  const d = new Date(isoOrTs);
  if (Number.isNaN(d.getTime())) return getTodayIso();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatCreationDate = (isoOrTs) => {
  const raw = isoOrTs || getTodayIso();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const CardNetworkLogo = ({ network = 'mastercard', mini = false }) => {
  if (network === 'none') return null;

  if (network === 'visa') {
    return (
      <span
        style={{
          fontSize: mini ? '7px' : '18px',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.04em',
          color: 'rgba(255, 255, 255, 0.92)',
          lineHeight: 1,
        }}
      >
        VISA
      </span>
    );
  }

  if (network === 'amex') {
    return (
      <span
        style={{
          fontSize: mini ? '6px' : '12px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          padding: mini ? '1px 2px' : '3px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          color: 'rgba(255, 255, 255, 0.92)',
          lineHeight: 1,
        }}
      >
        AMEX
      </span>
    );
  }

  const isColor = network === 'mastercard-color';

  if (mini) {
    return (
      <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: isColor ? '#EB001B' : 'rgba(255,255,255,0.45)' }} />
        <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: isColor ? '#F79E1B' : 'rgba(255,255,255,0.75)', marginLeft: '-2px' }} />
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }} aria-label="Mastercard">
      <svg width="56" height="34" viewBox="0 0 56 34" fill="none">
        <defs>
          <linearGradient id="mcHoloRing" x1="0" y1="0" x2="56" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A8D8FF" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#F5C2FF" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#FFE599" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9DF2D5" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mcLeftDark" x1="4" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4A4B50" />
            <stop offset="100%" stopColor="#26272B" />
          </linearGradient>
          <linearGradient id="mcRightSilver" x1="26" y1="4" x2="52" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4C6CC" />
            <stop offset="100%" stopColor="#8E9096" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="17"
          r="15"
          fill={isColor ? '#EB001B' : 'url(#mcLeftDark)'}
          stroke={isColor ? 'none' : 'url(#mcHoloRing)'}
          strokeWidth={isColor ? 0 : 1}
        />
        <circle
          cx="36"
          cy="17"
          r="15"
          fill={isColor ? '#F79E1B' : 'url(#mcRightSilver)'}
          fillOpacity={isColor ? 0.88 : 0.82}
          stroke={isColor ? 'none' : 'url(#mcHoloRing)'}
          strokeWidth={isColor ? 0 : 1}
        />
      </svg>
      <span
        style={{
          fontSize: '9.5px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: 'rgba(255, 255, 255, 0.82)',
          lineHeight: 1,
        }}
      >
        mastercard
      </span>
    </div>
  );
};

const readMapStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
};

const writeMapStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const NX_ACCOUNTS_CSS = `
  .nx-accounts-dark-screen {
    min-height: 100dvh;
    margin-bottom: calc(-98px - env(safe-area-inset-bottom, 0px));
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) calc(164px + env(safe-area-inset-bottom, 0px));
    background-color: var(--canvas-dark);
    color: var(--on-dark);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .nx-accounts-dark-screen.colorful {
    background-color: #16171F;
    background-image:
      radial-gradient(125% 62% at 82% 4%, rgba(92, 62, 242, 0.56) 0%, rgba(56, 32, 168, 0.24) 46%, transparent 96%),
      radial-gradient(110% 58% at 14% 16%, rgba(64, 41, 186, 0.42) 0%, transparent 68%),
      radial-gradient(85% 44% at 24% 88%, rgba(132, 102, 92, 0.16) 0%, transparent 66%),
      radial-gradient(85% 44% at 78% 86%, rgba(88, 96, 134, 0.18) 0%, transparent 66%),
      linear-gradient(180deg, #21115E 0%, #1A153B 34%, #171822 68%, #1D1E26 100%);
  }

  .nx-accounts-dark-screen.colorful  {
    background: rgba(255, 255, 255, 0.59);
    backdrop-filter: blur(28px) saturate(165%);
    -webkit-backdrop-filter: blur(28px) saturate(165%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
  .nx-account-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--sp-md) 0;
    background: transparent;
    border: 0;
    color: var(--on-dark);
    text-align: left;
    cursor: pointer;
    gap: var(--sp-md);
  }
  .nx-mini-thumb {
    width: 44px;
    height: 28px;
    border-radius: 6px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.16);
    position: relative;
    overflow: hidden;
  }
  .nx-add-account-float {
    position: fixed;
    left: 50%;
    bottom: calc(92px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 35;
  }

  /* DETALLE DE TARJETA: ESCENARIO GRIS OSCURO ARRIBA + HOJA CLARA REDONDEADA CON TARJETAS BLANCAS */
  .nx-card-hero-band {
    background-color: #34353D;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-xl) 38px;
    color: var(--on-dark);
    overflow: hidden;
  }
  .nx-card-hero-band.colorful {
    background:
      radial-gradient(120% 80% at 80% 0%, rgba(92, 62, 242, 0.48) 0%, transparent 65%),
      linear-gradient(180deg, #21115E 0%, #262340 52%, #34353D 100%);
  }
  .dark .nx-card-hero-band {
    background-color: #16171A;
  }
  .dark .nx-card-hero-band.colorful {
    background:
      radial-gradient(120% 80% at 80% 0%, rgba(82, 54, 224, 0.4) 0%, transparent 65%),
      linear-gradient(180deg, #1B0E4D 0%, #171820 100%);
  }
  .nx-pills-strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    max-width: 82%;
    scrollbar-width: none;
  }
  .nx-pills-strip::-webkit-scrollbar {
    display: none;
  }
  .nx-card-stage-3d {
    perspective: 1000px;
  }
  .nx-physical-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1.586 / 1;
    border-radius: 18px;
    padding: var(--sp-xl);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
    will-change: transform;
    transform-style: preserve-3d;
    user-select: none;
    cursor: pointer;
  }
  .nx-card-glare {
    position: absolute;
    inset: 0;
    border-radius: 18px;
    pointer-events: none;
    z-index: 1;
    transition: opacity 0.25s ease;
  }
  .nx-card-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 14px;
  }
  .nx-card-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background-color: rgba(255, 255, 255, 0.28);
    cursor: pointer;
    transition: width 0.2s ease, background-color 0.2s ease;
  }
  .nx-card-dot.active {
    width: 16px;
    background-color: #FFFFFF;
  }
  .nx-frost-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.42) 0%, transparent 45%),
      radial-gradient(circle at 80% 30%, rgba(210, 235, 255, 0.36) 0%, transparent 50%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(190, 225, 255, 0.16) 100%);
    backdrop-filter: blur(6px) saturate(130%);
    -webkit-backdrop-filter: blur(6px) saturate(130%);
    border-radius: 18px;
    pointer-events: none;
    z-index: 2;
  }

  /* HOJA INFERIOR REDONDEADA: FONDO GRIS SUAVE (#F3F4F6) Y TARJETAS/BOTONES EN BLANCO PURO (#FFFFFF) */
  .nx-card-detail-sheet {
    position: relative;
    z-index: 3;
    margin-top: -20px;
    border-radius: 26px 26px 0 0;
    background-color: var(--surface-soft);
    padding: 10px var(--sp-lg) var(--sp-xxl);
    min-height: calc(100dvh - 300px);
  }
  .dark .nx-card-detail-sheet {
    background-color: var(--canvas-dark);
  }
  .nx-detail-circle-btn {
    width: 48px;
    height: 48px;
    border-radius: var(--rounded-full);
    background-color: var(--canvas-light);
    color: var(--ink);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .dark .nx-detail-circle-btn {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .nx-detail-circle-btn.frozen {
    background-color: var(--primary);
    color: #FFFFFF;
  }
  .nx-detail-white-card {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xl);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .dark .nx-detail-white-card {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
    .nx-accounts-dark-screen {
    position: fixed;
    inset: 0;
    z-index: 60;
    overflow-y: auto;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) calc(110px + env(safe-area-inset-bottom, 0px));
    background: rgba(16, 16, 22, 0.52);
    backdrop-filter: blur(44px) saturate(170%);
    -webkit-backdrop-filter: blur(44px) saturate(170%);
    color: var(--on-dark);
    display: flex;
    flex-direction: column;
    animation: nx-fade 0.2s ease-out;
  }
  .nx-accounts-dark-screen.colorful {
    background:
      linear-gradient(
        180deg,
        rgba(38, 18, 128, 0.48) 0%,
        rgba(28, 22, 72, 0.36) 42%,
        rgba(32, 34, 42, 0.42) 100%
      );
    backdrop-filter: blur(46px) saturate(180%);
    -webkit-backdrop-filter: blur(46px) saturate(180%);
  }

  .nx-elevated-group {
    background: rgba(224, 224, 224, 0.42);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border-radius: 20px;
    padding: 4px var(--sp-xl);
    margin-bottom: var(--sp-md);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .nx-add-account-float {
    position: fixed;
    left: 50%;
    bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
    transform: translateX(-50%);
    z-index: 65;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  }
    .nx-accounts-dark-screen {
    position: fixed;
    inset: 0;
    z-index: 60;
    margin: 0;
    overflow-y: auto;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) calc(110px + env(safe-area-inset-bottom, 0px));
    background: rgba(16, 16, 22, 0.52);
    backdrop-filter: blur(44px) saturate(170%);
    -webkit-backdrop-filter: blur(44px) saturate(170%);
    color: var(--on-dark);
    display: flex;
    flex-direction: column;
    animation: nx-fade 0.2s ease-out;
  }
  .nx-accounts-dark-screen.colorful {
    background: linear-gradient(
      180deg,
      rgba(38, 18, 128, 0.48) 0%,
      rgba(28, 22, 72, 0.36) 42%,
      rgba(32, 34, 42, 0.42) 100%
    );
    backdrop-filter: blur(46px) saturate(180%);
    -webkit-backdrop-filter: blur(46px) saturate(180%);
  }

  .nx-add-account-float {
    position: fixed;
    left: 50%;
    bottom: calc(28px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 65;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  }
`;

const MovementsView = ({ colorfulHero = true, onClose, onOpenLimits }) => {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    switchProfile,
    addProfile,
    joinProfile,
    renameProfile,
    deleteActiveProfile,
    getTransactionsForProfile,
    transactions,
    filters,
    monthlyCategoryCaps,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
  } = useFinance();

  const [viewMode, setViewMode] = useState('list');
  const [frozenMap, setFrozenMap] = useState(() => readMapStorage('balance-frozen-accounts'));
  const [themeMap, setThemeMap] = useState(() => readMapStorage('balance-account-themes'));
  const [networkMap, setNetworkMap] = useState(() => readMapStorage('balance-account-networks'));
  const [createdMap, setCreatedMap] = useState(() => readMapStorage('balance-account-created-dates'));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState('create');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountDate, setNewAccountDate] = useState(() => getTodayIso());
  const [selectedCardTheme, setSelectedCardTheme] = useState('standard');
  const [selectedCardNetwork, setSelectedCardNetwork] = useState('mastercard');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [modalError, setModalError] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [showAllCardTx, setShowAllCardTx] = useState(false);

  const [cardDragX, setCardDragX] = useState(0);
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [cardTilt, setCardTilt] = useState({
    rx: 0,
    ry: 0,
    glareX: 50,
    glareY: 50,
    active: false,
  });

  const handleCardMouseMove = (e) => {
    if (isSwipingCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rx = (0.5 - py) * 16;
    const ry = (px - 0.5) * 20;

    setCardTilt({
      rx,
      ry,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
      active: true,
    });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
  };

  const swipeStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    isHorizontal: false,
  });
  const pillRefs = useRef({});

  const displayMoney = (val) => (isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val));

  const accountsData = useMemo(() => profiles.map((p, idx) => {
    const pTxs = getTransactionsForProfile(p.id);
    const balance = pTxs.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      return tx.type === 'Ingreso' ? acc + amt : tx.type === 'Gasto' ? acc - amt : acc;
    }, 0);
    const themeId = themeMap[p.id] || CARD_THEMES[idx % CARD_THEMES.length].id;
    const themeObj = CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];
    const rawDate = createdMap[p.id] || p.createdAt || getTodayIso();
    return {
      ...p,
      balance,
      createdDateRaw: toDateInputValue(rawDate),
      createdDateLabel: formatCreationDate(rawDate),
      network: networkMap[p.id] || 'mastercard',
      isFrozen: Boolean(frozenMap[p.id]),
      isShared: p.id.includes('___'),
      theme: themeObj,
    };
  }), [profiles, getTransactionsForProfile, themeMap, frozenMap, networkMap, createdMap]);

  const accountCircles = useMemo(() => {
    let savedThemes = {};
    try {
      savedThemes = JSON.parse(localStorage.getItem('balance-account-themes') || '{}') || {};
    } catch {}

    const list = profiles.length > 0 ? profiles : (activeProfile ? [activeProfile] : []);
    return list.map((p, idx) => {
      const themeId = savedThemes[p.id] || FALLBACK_THEME_IDS[idx % FALLBACK_THEME_IDS.length];
      return {
        id: p.id,
        name: p.name,
        bg: ACCOUNT_THEME_BGS[themeId] || ACCOUNT_THEME_BGS.standard,
      };
    });
  }, [profiles, activeProfile]);

  const activeAccountIndex = Math.max(0, accountsData.findIndex((a) => a.id === activeProfileId));
  const activeAccount = accountsData[activeAccountIndex] || accountsData[0];

  useEffect(() => {
    if (viewMode !== 'detail') return;
    const activePill = pillRefs.current[activeProfileId];
    activePill?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeProfileId, viewMode]);

  useEffect(() => {
    let changed = false;
    const next = { ...createdMap };
    profiles.forEach((p) => {
      if (!next[p.id]) {
        next[p.id] = toDateInputValue(p.createdAt || getTodayIso());
        changed = true;
      }
    });
    if (changed) {
      setCreatedMap(next);
      writeMapStorage('balance-account-created-dates', next);
    }
  }, [profiles]);

  const handleAccountTouchStart = (e) => {
    if (accountsData.length <= 1 || e.touches.length !== 1) return;
    if (e.target.closest?.('input, select, textarea, [data-swipe-ignore]')) return;
    const touch = e.touches[0];
    swipeStateRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: performance.now(),
      isHorizontal: false,
    };
    setIsSwipingCard(true);
  };

  const handleAccountTouchMove = (e) => {
    const st = swipeStateRef.current;
    if (!st.active || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - st.startX;
    const dy = touch.clientY - st.startY;

    if (!st.isHorizontal) {
      if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) {
        st.active = false;
        setIsSwipingCard(false);
        setCardDragX(0);
        return;
      }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        st.isHorizontal = true;
      }
    }

    if (st.isHorizontal && viewMode === 'detail') {
      const atStart = activeAccountIndex === 0 && dx > 0;
      const atEnd = activeAccountIndex === accountsData.length - 1 && dx < 0;
      const dampened = (atStart || atEnd) ? dx * 0.24 : Math.max(-140, Math.min(140, dx * 0.75));
      setCardDragX(dampened);
    }
  };

  const handleAccountTouchEnd = (e) => {
    const st = swipeStateRef.current;
    if (!st.active) return;
    st.active = false;
    setIsSwipingCard(false);
    setCardDragX(0);

    if (e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - st.startX;
    const dy = touch.clientY - st.startY;
    const elapsed = Math.max(1, performance.now() - st.startTime);
    const velocity = Math.abs(dx) / elapsed;

    const isSwipe = (Math.abs(dx) > 48 || (Math.abs(dx) > 28 && velocity > 0.45))
      && Math.abs(dx) > Math.abs(dy) * 1.2;

    if (!isSwipe) return;

    if (dx < 0 && activeAccountIndex < accountsData.length - 1) {
      triggerHaptic();
      setShowAllCardTx(false);
      switchProfile(accountsData[activeAccountIndex + 1].id);
    } else if (dx > 0 && activeAccountIndex > 0) {
      triggerHaptic();
      setShowAllCardTx(false);
      switchProfile(accountsData[activeAccountIndex - 1].id);
    }
  };

  const resetSwipeState = () => {
    swipeStateRef.current.active = false;
    setIsSwipingCard(false);
    setCardDragX(0);
  };

  const toggleFreeze = (profileId) => {
    triggerHaptic();
    const next = { ...frozenMap, [profileId]: !frozenMap[profileId] };
    setFrozenMap(next);
    writeMapStorage('balance-frozen-accounts', next);
  };

  const changeAccountTheme = (profileId, themeId) => {
    triggerHaptic();
    const next = { ...themeMap, [profileId]: themeId };
    setThemeMap(next);
    writeMapStorage('balance-account-themes', next);
  };

  const changeAccountNetwork = (profileId, networkId) => {
    triggerHaptic();
    const next = { ...networkMap, [profileId]: networkId };
    setNetworkMap(next);
    writeMapStorage('balance-account-networks', next);
  };

  const changeAccountCreatedDate = (profileId, dateIso) => {
    if (!dateIso) return;
    const next = { ...createdMap, [profileId]: dateIso };
    setCreatedMap(next);
    writeMapStorage('balance-account-created-dates', next);
  };

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const monthlyTxs = useMemo(
    () => transactions.filter((tx) => typeof tx.date === 'string' && tx.date.startsWith(monthPrefix)),
    [transactions, monthPrefix],
  );
  const monthTotals = useMemo(() => monthlyTxs.reduce((acc, tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'Ingreso') acc.income += amt;
    if (tx.type === 'Gasto') acc.expenses += amt;
    return acc;
  }, { income: 0, expenses: 0 }), [monthlyTxs]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthlyTxs.filter((tx) => tx.type === 'Gasto').forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTxs]);

  const recentAccountTxs = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
    return showAllCardTx ? sorted : sorted.slice(0, 4);
  }, [transactions, showAllCardTx]);

  const shareCode = activeProfileId.includes('___')
    ? activeProfileId
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

  return (
    <>
      <style>{NX_ACCOUNTS_CSS}</style>

      {/* PANTALLA 1: LISTA DE CUENTAS */}
      {viewMode === 'list' && (
<div
            className={`nx-accounts-dark-screen ${colorfulHero ? 'colorful' : ''}`}
            onTouchStart={handleAccountTouchStart}
            onTouchMove={handleAccountTouchMove}
            onTouchEnd={handleAccountTouchEnd}
            onTouchCancel={resetSwipeState}
          >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-lg)' }}>
<button
              type="button"
              onClick={onClose}
              aria-label="Volver al inicio"
              style={{
                width: '34px',
                height: '34px',
                border: 0,
                padding: 0,
                background: 'transparent',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
              }}
            >
              <X size={22} strokeWidth={2.2} />
            </button>
          </div>

          <h1 className="nx-display" style={{ fontSize: '32px', margin: '0 0 var(--sp-xl)' }}>
            Cuentas
          </h1>

          {/* TARJETA CON TODAS LAS CUENTAS */}
          <div className="nx-elevated-group">
            {accountsData.map((acc, index) => {
              const isSelected = acc.id === activeProfileId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  className="nx-account-row"
                  style={{ borderBottom: index === accountsData.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    triggerHaptic();
                    switchProfile(acc.id);
                    setShowAllCardTx(false);
                    setViewMode('detail');
                  }}
                >
                  <span className="nx-mini-thumb" style={{ background: acc.theme.bg }}>
                    <span style={{ fontSize: '6px', fontWeight: 500, letterSpacing: '0.24px' }}>NEXO</span>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <CardNetworkLogo mini network={acc.network} />
                    </span>
                    {acc.isFrozen && (
                      <span style={{ position: 'absolute', inset: 0, background: 'rgba(210, 235, 255, 0.45)', backdropFilter: 'blur(2px)' }} />
                    )}
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 500 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
                      {acc.isFrozen && <span className="nx-badge-feature">Congelada</span>}
                    </span>
                    <span className="nx-label privacy-sensitive" style={{ display: 'block', color: 'rgba(255,255,255,0.75)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                      {acc.createdDateLabel} · {displayMoney(acc.balance)}
                    </span>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isSelected && (
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--rounded-full)',
                        backgroundColor: 'var(--canvas-light)',
                        color: 'var(--canvas-dark)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    )}
                    <ChevronRight size={17} style={{ opacity: 0.7 }} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* TARJETA DE ANÁLISIS MENSUAL */}
          <div className="nx-elevated-group">
            <button
              type="button"
              className="nx-account-row"
              onClick={() => setIsAnalyticsOpen(true)}
            >
              <span style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--rounded-full)',
                backgroundColor: colorfulHero ? 'rgba(255,255,255,0.18)' : 'var(--primary)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BarChart3 size={17} />
              </span>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
                Análisis mensual de {activeAccount?.name}
              </span>
              <ChevronRight size={17} style={{ opacity: 0.7 }} />
            </button>
          </div>


<button
            type="button"
            className="nx-btn-primary nx-add-account-float"
            onClick={() => {
              setModalError('');
              setNewAccountName('');
              setNewAccountDate(getTodayIso());
              setSelectedCardTheme('revolut-standard');
              setSelectedCardNetwork('mastercard');
              setJoinCode('');
              setJoinName('');
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={17} strokeWidth={2.2} /> Añadir cuenta
          </button>
        </div>
      )}

      {/* PANTALLA 2: DETALLE DE TARJETA CON DESLIZAMIENTO ENTRE CUENTAS */}
      {viewMode === 'detail' && activeAccount && (
        <div
          onTouchStart={handleAccountTouchStart}
          onTouchMove={handleAccountTouchMove}
          onTouchEnd={handleAccountTouchEnd}
          onTouchCancel={resetSwipeState}
          style={{ position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto', backgroundColor: 'var(--surface-soft)' }}
        >
          <div className={`nx-card-hero-band ${colorfulHero ? 'colorful' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-lg)' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Volver a cuentas"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--rounded-full)',
                  border: 0,
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={20} strokeWidth={2.2} />
              </button>

              <div className="nx-pills-strip" data-swipe-ignore>
                {accountsData.map((acc) => (
                  <button
                    key={acc.id}
                    ref={(el) => { pillRefs.current[acc.id] = el; }}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setShowAllCardTx(false);
                      switchProfile(acc.id);
                    }}
                    style={{
                      height: '34px',
                      padding: '6px 14px',
                      borderRadius: 'var(--rounded-full)',
                      border: 0,
                      fontSize: '12.5px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      backgroundColor: acc.id === activeProfileId
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.14)',
                      color: acc.id === activeProfileId ? '#0B0B0D' : '#FFFFFF',
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="nx-card-stage-3d">
              <div
                className="nx-physical-card"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{
                  background: activeAccount.theme.bg,
                  transform: `translate3d(${cardDragX}px, 0, 0) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg) scale3d(${cardTilt.active ? 1.025 : 1}, ${cardTilt.active ? 1.025 : 1}, 1)`,
                  boxShadow: cardTilt.active
                    ? `${-cardTilt.ry * 1.4}px ${cardTilt.rx * 1.4 + 20}px 42px rgba(0, 0, 0, 0.42)`
                    : '0 14px 32px rgba(0, 0, 0, 0.28)',
                  transition: isSwipingCard
                    ? 'none'
                    : cardTilt.active
                      ? 'transform 0.08s ease-out, box-shadow 0.08s ease-out'
                      : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease',
                }}
              >
                <div
                  className="nx-card-glare"
                  style={{
                    opacity: cardTilt.active ? 1 : 0,
                    mixBlendMode: 'soft-light',
                    background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 38%, transparent 70%)`,
                  }}
                />

                {activeAccount.isFrozen && <div className="nx-frost-overlay" />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                    {activeAccount.isShared ? 'Compartida' : 'Estándar'}
                  </span>
                  <span className="nx-display privacy-sensitive" style={{ fontSize: '20px' }}>
                    {displayMoney(activeAccount.balance)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 3 }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '15px', fontWeight: 500 }}>
                      {activeAccount.name}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                      {activeAccount.createdDateLabel}
                    </span>
                  </div>

                  <CardNetworkLogo network={activeAccount.network} />
                </div>
              </div>
            </div>

            {accountsData.length > 1 && (
              <div className="nx-card-dots" aria-label="Selector de cuenta">
                {accountsData.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className={`nx-card-dot ${acc.id === activeProfileId ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic();
                      setShowAllCardTx(false);
                      switchProfile(acc.id);
                    }}
                    aria-label={`Cambiar a ${acc.name}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* HOJA REDONDEADA SUPERIOR (#F3F4F6) CON BOTONES Y TARJETAS EN BLANCO (#FFFFFF) */}
          <div className="nx-card-detail-sheet">
            <div className="sheet-handle" style={{ margin: '0 auto 16px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsAmountsHidden?.((prev) => !prev);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <span className="nx-detail-circle-btn">
                  {isAmountsHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <span className="nx-label">{isAmountsHidden ? 'Mostrar' : 'Ocultar'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFreeze(activeAccount.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: activeAccount.isFrozen ? 'var(--primary)' : 'var(--text-main)' }}
              >
                <span className={`nx-detail-circle-btn ${activeAccount.isFrozen ? 'frozen' : ''}`}>
                  <Snowflake size={20} />
                </span>
                <span className="nx-label">{activeAccount.isFrozen ? 'Descongelar' : 'Congelar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditName(activeAccount.name);
                  setEditDate(activeAccount.createdDateRaw);
                  setCopiedCode(false);
                  setIsSettingsOpen(true);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <span className="nx-detail-circle-btn">
                  <Settings size={20} />
                </span>
                <span className="nx-label">Ajustes</span>
              </button>
            </div>

            <div className="nx-detail-white-card" style={{ padding: '10px 18px 14px', marginBottom: 'var(--sp-md)' }}>
              {recentAccountTxs.length > 0 ? (
                <>
                  {recentAccountTxs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                  {transactions.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCardTx((prev) => !prev)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 0,
                        color: 'var(--text-main)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '12px 0 4px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {showAllCardTx ? 'Mostrar menos' : 'Ver todo'}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', textAlign: 'center', padding: 'var(--sp-lg) 0', margin: 0 }}>
                  Aún no hay movimientos en esta cuenta.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              className="nx-detail-white-card"
              style={{
                width: '100%',
                border: 0,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <span>Ver análisis mensual y categorías</span>
              <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL + AÑADIR O VINCULAR CUENTA */}
      {isAddModalOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAddModalOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="record-tabs" style={{ marginBottom: 'var(--sp-lg)' }}>
              <button type="button" className={addTab === 'create' ? 'active' : ''} onClick={() => { setAddTab('create'); setModalError(''); }}>
                Crear cuenta
              </button>
              <button type="button" className={addTab === 'join' ? 'active' : ''} onClick={() => { setAddTab('join'); setModalError(''); }}>
                Vincular compartida
              </button>
            </div>

            {addTab === 'create' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalError('');
                try {
                  const created = addProfile(newAccountName);
                  changeAccountTheme(created.id, selectedCardTheme);
                  changeAccountNetwork(created.id, selectedCardNetwork);
                  changeAccountCreatedDate(created.id, newAccountDate || getTodayIso());
                  setIsAddModalOpen(false);
                  setViewMode('detail');
                } catch (err) {
                  setModalError(err.message);
                }
              }}>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                  Nombre de la cuenta
                  <input
                    required
                    autoFocus
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ej. Trabajo, Ahorro, Pareja..."
                  />
                </label>

                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-lg)' }}>
                  Fecha de creación
                  <input
                    type="date"
                    value={newAccountDate}
                    onChange={(e) => setNewAccountDate(e.target.value)}
                    required
                  />
                </label>

                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
                  Color de tarjeta
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCardTheme(t.id)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--rounded-full)',
                        background: t.bg,
                        border: selectedCardTheme === t.id ? '3px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                      aria-label={t.label}
                    />
                  ))}
                </div>

                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
                  Red de pagos
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--sp-xl)' }}>
                  {CARD_NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedCardNetwork(net.id)}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        borderRadius: '999px',
                        border: 0,
                        fontSize: '12.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        backgroundColor: selectedCardNetwork === net.id ? 'var(--primary)' : 'var(--surface-soft)',
                        color: selectedCardNetwork === net.id ? '#FFFFFF' : 'var(--text-main)',
                      }}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>

                {modalError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: 'var(--sp-md)' }}>{modalError}</p>}

                <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                  Crear cuenta <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalError('');
                try {
                  const joined = joinProfile(joinCode, joinName);
                  changeAccountTheme(joined.id, 'cobalt');
                  changeAccountNetwork(joined.id, 'mastercard');
                  changeAccountCreatedDate(joined.id, getTodayIso());
                  setIsAddModalOpen(false);
                  setViewMode('detail');
                } catch (err) {
                  setModalError(err.message);
                }
              }}>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                  Código de invitación
                  <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
                </label>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-lg)' }}>
                  Nombre para esta cuenta
                  <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Casa" />
                </label>
                {modalError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: 'var(--sp-md)' }}>{modalError}</p>}
                <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                  <UserPlus size={16} /> Vincular cuenta
                </button>
              </form>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL AJUSTES DE LA CUENTA */}
      {isSettingsOpen && activeAccount && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSettingsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Ajustes de cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSettingsOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  renameProfile(activeAccount.id, editName);
                  if (editDate) changeAccountCreatedDate(activeAccount.id, editDate);
                  setIsSettingsOpen(false);
                } catch {}
              }}
              style={{ marginBottom: 'var(--sp-lg)' }}
            >
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                Nombre de la cuenta
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </label>

              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                Fecha de creación
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </label>

              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Guardar cambios
              </button>
            </form>

            <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
              Color de tarjeta
            </span>
            <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeAccountTheme(activeAccount.id, t.id)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--rounded-full)',
                    background: t.bg,
                    border: activeAccount.theme.id === t.id ? '3px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                  aria-label={t.label}
                />
              ))}
            </div>

            <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
              Red de pagos
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--sp-xl)' }}>
              {CARD_NETWORKS.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => changeAccountNetwork(activeAccount.id, net.id)}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '999px',
                    border: 0,
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: activeAccount.network === net.id ? 'var(--primary)' : 'var(--surface-soft)',
                    color: activeAccount.network === net.id ? '#FFFFFF' : 'var(--text-main)',
                  }}
                >
                  {net.label}
                </button>
              ))}
            </div>

            {shareCode && (
              <div className="nx-card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-mute)', marginBottom: '8px' }}>
                  <Share2 size={13} /> Código para compartir esta cuenta
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareCode}</code>
                  <button
                    type="button"
                    className="nx-btn-pill-sm"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => {
                      navigator.clipboard?.writeText(shareCode);
                      setCopiedCode(true);
                    }}
                  >
                    {copiedCode ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </button>
                </div>
              </div>
            )}

            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  deleteActiveProfile()
                    .then(() => {
                      setIsSettingsOpen(false);
                      setViewMode('list');
                    })
                    .catch((err) => alert(err.message));
                }}
                className="nx-btn-soft"
                style={{ width: '100%', color: 'var(--danger-red)' }}
              >
                <Trash2 size={15} /> {activeAccount.isShared ? 'Desvincular cuenta' : 'Eliminar cuenta'}
              </button>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL ANÁLISIS MENSUAL */}
      {isAnalyticsOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAnalyticsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>
                Análisis · {activeProfile?.name}
              </h2>
              <button type="button" className="sheet-close" onClick={() => setIsAnalyticsOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
              <div className="nx-card" style={{ padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Ingresos del mes</span>
                <span className="nx-display" style={{ display: 'block', fontSize: '20px', color: 'var(--accent-teal)', marginTop: '6px' }}>
                  {displayMoney(monthTotals.income)}
                </span>
              </div>
              <div className="nx-card" style={{ padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Gastos del mes</span>
                <span className="nx-display" style={{ display: 'block', fontSize: '20px', color: 'var(--danger-red)', marginTop: '6px' }}>
                  {displayMoney(monthTotals.expenses)}
                </span>
              </div>
            </div>

            <div className="nx-card" style={{ marginBottom: 'var(--sp-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Gastos por categoría</span>
                <button
                  type="button"
                  className="nx-btn-pill-sm"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    setIsAnalyticsOpen(false);
                    onOpenLimits?.();
                  }}
                >
                  Editar topes
                </button>
              </div>

              {categoryBreakdown.length > 0 ? categoryBreakdown.map((cat) => {
                const limit = Number(monthlyCategoryCaps?.[cat.name]) || 0;
                const pct = limit > 0
                  ? Math.min(100, Math.round((cat.amount / limit) * 100))
                  : (monthTotals.expenses > 0 ? Math.min(100, Math.round((cat.amount / monthTotals.expenses) * 100)) : 0);
                return (
                  <div key={cat.name} style={{ marginBottom: 'var(--sp-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span>{cat.name}</span>
                      <span>
                        {displayMoney(cat.amount)}
                        {limit > 0 && <span style={{ color: 'var(--text-mute)' }}> / {displayMoney(limit)}</span>}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--bg-card-alt)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 'var(--rounded-full)',
                        backgroundColor: limit > 0 && cat.amount > limit ? 'var(--danger-red)' : 'var(--primary)',
                      }} />
                    </div>
                  </div>
                );
              }) : (
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: 0 }}>
                  Sin gastos registrados este mes.
                </p>
              )}
            </div>

            <button type="button" className="nx-btn-dark" style={{ width: '100%' }} onClick={() => setIsAnalyticsOpen(false)}>
              Cerrar
            </button>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
};

export default MovementsView;
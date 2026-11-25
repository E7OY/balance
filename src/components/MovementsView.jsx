import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
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

const CardNetworkLogo = ({ network = 'mastercard' }) => {
  if (network === 'none') return null;

  if (network === 'visa') {
    return (
      <span
        style={{
          fontSize: '18px',
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
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          padding: '3px 6px',
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
  /* =========================================================
     ANIMACIONES FLUIDAS ESTILO APPLE iOS / REVOLUT SHEET
     ========================================================= */
  @keyframes nx-acc-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes nx-acc-backdrop-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes nx-acc-sheet-in {
    0% {
      opacity: 0.55;
      transform: translate3d(0, 104%, 0) scale(0.965);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes nx-acc-sheet-out {
    0% {
      opacity: 1;
      transform: translate3d(0, var(--drag-y, 0px), 0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate3d(0, 105%, 0) scale(0.975);
    }
  }

  .nx-accounts-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9990;
    background: rgba(8, 10, 18, 0.46);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: nx-acc-backdrop-in 0.36s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .nx-accounts-backdrop.closing {
    animation: nx-acc-backdrop-out 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    pointer-events: none;
  }

  /* POPUP SHEET DE CUENTAS LIMPIO */
  .nx-accounts-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    height: min(92dvh, 840px);
    max-width: 460px;
    margin: 0 auto;
    z-index: 9991;
    display: flex;
    flex-direction: column;
    border-radius: 34px 34px 0 0;
    overflow: hidden;
    background:
      radial-gradient(120% 70% at 15% 0%, rgba(255, 255, 255, 0.9) 0%, transparent 58%),
      linear-gradient(180deg, rgba(232, 238, 255, 0.88) 0%, rgba(242, 244, 248, 0.88) 44%, rgba(243, 244, 246, 0.92) 100%);
    backdrop-filter: blur(38px) saturate(200%);
    -webkit-backdrop-filter: blur(38px) saturate(200%);
    border-top: 1px solid rgba(255, 255, 255, 0.94);
    box-shadow:
      0 -20px 54px rgba(15, 23, 42, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.96);
    color: #0B0B0D;
    will-change: transform, opacity;
    transform-origin: bottom center;
    animation: nx-acc-sheet-in 0.46s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .dark .nx-accounts-sheet {
    background:
      radial-gradient(120% 65% at 20% 0%, rgba(59, 130, 246, 0.16) 0%, transparent 56%),
      linear-gradient(180deg, rgba(9, 14, 35, 0.9) 0%, rgba(7, 11, 25, 0.92) 48%, rgba(5, 6, 10, 0.95) 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 -22px 60px rgba(0, 0, 0, 0.65),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
  }

  .nx-accounts-sheet.dragging {
    animation: none !important;
    transition: none !important;
  }
  .nx-accounts-sheet.snapping {
    animation: none !important;
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1) !important;
  }
  .nx-accounts-sheet.closing {
    animation: nx-acc-sheet-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
    pointer-events: none;
  }

  /* BARRITA SUPERIOR INTERACTIVA */
  .nx-acc-grabber-zone {
    width: 100%;
    padding: 10px 0 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    touch-action: none;
    flex-shrink: 0;
    user-select: none;
  }
  .nx-acc-grabber-zone:active {
    cursor: grabbing;
  }
  .nx-acc-grabber-pill {
    width: 40px;
    height: 5px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.2);
    transition: width 0.18s ease, background-color 0.18s ease;
  }
  .nx-acc-grabber-zone:active .nx-acc-grabber-pill {
    width: 48px;
    background: rgba(15, 23, 42, 0.34);
  }
  .dark .nx-acc-grabber-pill {
    background: rgba(255, 255, 255, 0.28);
  }
  .dark .nx-acc-grabber-zone:active .nx-acc-grabber-pill {
    background: rgba(255, 255, 255, 0.45);
  }

  .nx-accounts-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .nx-card-hero-band {
    background: transparent !important;
    padding: 6px var(--sp-xl) 4px;
    overflow: visible;
  }

  .nx-hero-back-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(11, 11, 13, 0.06);
    color: #0B0B0D;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.12s ease;
  }
  .nx-hero-back-btn:active {
    transform: scale(0.92);
  }
  .dark .nx-hero-back-btn {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }

  .nx-pills-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nx-pills-strip::-webkit-scrollbar {
    display: none;
  }

  .nx-hero-add-pill {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 0;
    background: rgba(11, 11, 13, 0.08);
    color: #0B0B0D;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .dark .nx-hero-add-pill {
    background: rgba(255, 255, 255, 0.16);
    color: #FFFFFF;
  }

  .nx-hero-pill {
    height: 34px;
    padding: 6px 14px;
    border-radius: var(--rounded-full);
    border: 0;
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    flex-shrink: 0;
    background: rgba(11, 11, 13, 0.08);
    color: #0B0B0D;
    transition: background-color 0.16s ease, color 0.16s ease;
  }
  .nx-hero-pill.active {
    background: #0B0B0D;
    color: #FFFFFF;
  }
  .dark .nx-hero-pill {
    background: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .dark .nx-hero-pill.active {
    background: #FFFFFF;
    color: #0B0B0D;
  }

  /* =========================================================
     BORDE GLASEADO EXCLUSIVO EN LAS MINIATURAS DE TARJETAS
     ========================================================= */
  .nx-card-carousel {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin: -8px calc(var(--sp-xl) * -1) -26px;
    padding: 16px 20px 46px;
  }
  .nx-card-carousel::-webkit-scrollbar {
    display: none;
  }
  .nx-card-slide {
    flex: 0 0 calc(100% - 14px);
    scroll-snap-align: center;
    scroll-snap-stop: always;
    perspective: 1000px;
    padding: 6px;
    border-radius: 25px;
    background: rgba(73, 79, 223, 0.08);
    border: 1px solid rgba(73, 79, 223, 0.12);
    box-sizing: border-box;
  }
  .dark .nx-card-slide {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .nx-physical-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1.586 / 1;
    border-radius: 19px;
    padding: var(--sp-xl);
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.16);
    overflow: hidden;
    will-change: transform;
    transform-style: preserve-3d;
    user-select: none;
    cursor: pointer;
  }
  .dark .nx-physical-card {
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.36);
  }
  .nx-card-glare {
    position: absolute;
    inset: 0;
    border-radius: 19px;
    pointer-events: none;
    z-index: 1;
    transition: opacity 0.25s ease;
  }

  .nx-card-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 2px;
    margin-bottom: 6px;
    position: relative;
    z-index: 4;
  }
  .nx-card-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background-color: rgba(11, 11, 13, 0.2);
    cursor: pointer;
    transition: width 0.2s ease, background-color 0.2s ease;
  }
  .nx-card-dot.active {
    width: 16px;
    background-color: #0B0B0D;
  }
  .dark .nx-card-dot {
    background-color: rgba(255, 255, 255, 0.26);
  }
  .dark .nx-card-dot.active {
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
    border-radius: 19px;
    pointer-events: none;
    z-index: 2;
  }

  /* =========================================================
     CONTENIDO INFERIOR LIMPIO (SIN GLASEADO)
     ========================================================= */
  .nx-card-detail-sheet {
    position: relative;
    z-index: 3;
    background: transparent !important;
    padding: 14px var(--sp-lg) calc(var(--sp-xxl) + env(safe-area-inset-bottom, 0px));
  }
  .nx-detail-circle-btn {
    width: 50px;
    height: 50px;
    border-radius: var(--rounded-full);
    background-color: var(--canvas-light);
    color: var(--ink);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .dark .nx-detail-circle-btn {
    background-color: rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
    box-shadow: none;
  }
  .nx-detail-circle-btn.frozen {
    background-color: var(--primary);
    color: #FFFFFF;
  }
  .nx-detail-white-card {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: 20px;
    padding: var(--sp-xl);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
  }
  .dark .nx-detail-white-card {
    background-color: #16171B;
    color: var(--on-dark);
    box-shadow: none;
  }
`;

const MovementsView = ({ onClose, onOpenLimits }) => {
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

  const [frozenMap, setFrozenMap] = useState(() => readMapStorage('balance-frozen-accounts'));
  const [themeMap, setThemeMap] = useState(() => readMapStorage('balance-account-themes'));
  const [networkMap, setNetworkMap] = useState(() => readMapStorage('balance-account-networks'));
  const [createdMap, setCreatedMap] = useState(() => readMapStorage('balance-account-created-dates'));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState('create');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountDate, setNewAccountDate] = useState(() => getTodayIso());
  const [selectedCardTheme, setSelectedCardTheme] = useState('revolut-standard');
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

  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragStartYRef = useRef(0);

  const requestClose = () => {
    if (isClosing) return;
    triggerHaptic();
    setIsClosing(true);
    window.setTimeout(() => {
      onClose?.();
    }, 270);
  };

  const handleDragPointerDown = (e) => {
    if (isClosing) return;
    dragStartYRef.current = e.clientY;
    setIsDragging(true);
    setIsSnapping(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleDragPointerMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartYRef.current;
    setDragY(delta > 0 ? delta : delta * 0.18);
  };

  const handleDragPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 115) {
      requestClose();
    } else {
      setIsSnapping(true);
      setDragY(0);
      window.setTimeout(() => setIsSnapping(false), 360);
    }
  };

  const [cardTilt, setCardTilt] = useState({
    rx: 0,
    ry: 0,
    glareX: 50,
    glareY: 50,
    active: false,
  });

  const pillRefs = useRef({});
  const carouselRef = useRef(null);
  const scrollTimerRef = useRef(null);

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    setCardTilt({
      rx: (0.5 - py) * 16,
      ry: (px - 0.5) * 20,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
      active: true,
    });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
  };

  const displayMoney = (val) => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(val);

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

  const activeAccountIndex = Math.max(0, accountsData.findIndex((a) => a.id === activeProfileId));
  const activeAccount = accountsData[activeAccountIndex] || accountsData[0];

  useEffect(() => {
    const activePill = pillRefs.current[activeProfileId];
    activePill?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeProfileId]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.children[activeAccountIndex];
    if (!slide) return;
    const targetLeft = slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2;
    if (Math.abs(el.scrollLeft - targetLeft) > 8) {
      el.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [activeAccountIndex]);

  useEffect(() => () => window.clearTimeout(scrollTimerRef.current), []);

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

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || accountsData.length <= 1) return;
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = activeAccountIndex;
      let minDist = Infinity;
      Array.from(el.children).forEach((child, idx) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(center - childCenter);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      });
      if (closestIdx !== activeAccountIndex && accountsData[closestIdx]) {
        triggerHaptic();
        setShowAllCardTx(false);
        switchProfile(accountsData[closestIdx].id);
      }
    }, 90);
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

  if (!activeAccount) return null;

  const sheetClasses = [
    'nx-accounts-sheet',
    isDragging ? 'dragging' : '',
    isSnapping ? 'snapping' : '',
    isClosing ? 'closing' : '',
  ].filter(Boolean).join(' ');

  return createPortal(
    <>
      <style>{NX_ACCOUNTS_CSS}</style>

      {/* BACKDROP OSCURECIDO CON BLUR */}
      <div
        className={`nx-accounts-backdrop ${isClosing ? 'closing' : ''}`}
        onClick={requestClose}
        aria-hidden="true"
      />

      {/* POPUP SHEET PRINCIPAL */}
      <div
        className={sheetClasses}
        role="dialog"
        aria-modal="true"
        style={{
          '--drag-y': `${Math.max(0, dragY)}px`,
          transform: isDragging || isSnapping ? `translate3d(0, ${dragY}px, 0)` : undefined,
        }}
      >
        {/* BARRITA SUPERIOR INTERACTIVA */}
        <div
          className="nx-acc-grabber-zone"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
        >
          <span className="nx-acc-grabber-pill" />
        </div>

        <div className="nx-accounts-scroll">
          <div className="nx-card-hero-band">
            {/* BARRA SUPERIOR: CERRAR + BOTÓN AÑADIR + PILLS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: 'var(--sp-lg)' }}>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Cerrar cuentas"
                className="nx-hero-back-btn"
              >
                <X size={18} strokeWidth={2.3} />
              </button>

              <div className="nx-pills-strip">
                <button
                  type="button"
                  className="nx-hero-add-pill"
                  onClick={() => {
                    triggerHaptic();
                    setModalError('');
                    setNewAccountName('');
                    setNewAccountDate(getTodayIso());
                    setSelectedCardTheme('revolut-standard');
                    setSelectedCardNetwork('mastercard');
                    setJoinCode('');
                    setJoinName('');
                    setIsAddModalOpen(true);
                  }}
                  aria-label="Añadir cuenta"
                >
                  <Plus size={17} strokeWidth={2.4} />
                </button>

                {accountsData.map((acc) => (
                  <button
                    key={acc.id}
                    ref={(el) => { pillRefs.current[acc.id] = el; }}
                    type="button"
                    className={`nx-hero-pill ${acc.id === activeProfileId ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic();
                      setShowAllCardTx(false);
                      switchProfile(acc.id);
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* CARRUSEL DE TARJETAS CON BORDE GLASEADO */}
            <div
              ref={carouselRef}
              className="nx-card-carousel"
              onScroll={handleCarouselScroll}
            >
              {accountsData.map((acc) => {
                const isActive = acc.id === activeProfileId;
                return (
                  <div
                    key={acc.id}
                    className="nx-card-slide"
                    onClick={() => {
                      if (!isActive) {
                        triggerHaptic();
                        setShowAllCardTx(false);
                        switchProfile(acc.id);
                      }
                    }}
                  >
                    <div
                      className="nx-physical-card"
                      onMouseMove={isActive ? handleCardMouseMove : undefined}
                      onMouseLeave={isActive ? handleCardMouseLeave : undefined}
                      style={{
                        background: acc.theme.bg,
                        transform: isActive && cardTilt.active
                          ? `rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg) scale3d(1.015, 1.015, 1)`
                          : 'none',
                        boxShadow: isActive && cardTilt.active
                          ? `${-cardTilt.ry * 1.4}px ${cardTilt.rx * 1.4 + 20}px 42px rgba(0, 0, 0, 0.42)`
                          : undefined,
                        transition: isActive && cardTilt.active
                          ? 'transform 0.08s ease-out, box-shadow 0.08s ease-out'
                          : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease',
                      }}
                    >
                      {isActive && (
                        <div
                          className="nx-card-glare"
                          style={{
                            opacity: cardTilt.active ? 1 : 0,
                            mixBlendMode: 'soft-light',
                            background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 38%, transparent 70%)`,
                          }}
                        />
                      )}

                      {acc.isFrozen && <div className="nx-frost-overlay" />}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
                        <span style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                          {acc.isShared ? 'Compartida' : 'Estándar'}
                        </span>
                        <span className="nx-display privacy-sensitive" style={{ fontSize: '20px' }}>
                          {displayMoney(acc.balance)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 3 }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '15px', fontWeight: 500 }}>
                            {acc.name}
                          </span>
                          <span style={{ fontSize: '13.5px', fontWeight: 500, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                            {acc.createdDateLabel}
                          </span>
                        </div>

                        <CardNetworkLogo network={acc.network} />
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {/* ACCIONES Y CONTENIDO INFERIOR LIMPIO */}
          <div className="nx-card-detail-sheet">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsAmountsHidden?.((prev) => !prev);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit' }}
              >
                <span className="nx-detail-circle-btn">
                  {isAmountsHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <span className="nx-label">{isAmountsHidden ? 'Mostrar' : 'Ocultar'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFreeze(activeAccount.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: activeAccount.isFrozen ? 'var(--primary)' : 'inherit' }}
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
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit' }}
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
      </div>

      {/* SUB-MODAL + AÑADIR O VINCULAR CUENTA */}
      {isAddModalOpen && (
        <div className="sheet-layer" style={{ zIndex: 10010 }} onMouseDown={() => setIsAddModalOpen(false)}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--sp-lg)' }}>
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCardTheme(t.id)}
                      style={{
                        width: '36px',
                        height: '36px',
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
        </div>
      )}

      {/* SUB-MODAL AJUSTES DE LA CUENTA */}
      {isSettingsOpen && (
        <div className="sheet-layer" style={{ zIndex: 10010 }} onMouseDown={() => setIsSettingsOpen(false)}>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--sp-lg)' }}>
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeAccountTheme(activeAccount.id, t.id)}
                  style={{
                    width: '36px',
                    height: '36px',
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
        </div>
      )}

      {/* SUB-MODAL ANÁLISIS MENSUAL */}
      {isAnalyticsOpen && (
        <div className="sheet-layer" style={{ zIndex: 10010 }} onMouseDown={() => setIsAnalyticsOpen(false)}>
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
                <span className="nx-display privacy-sensitive" style={{ display: 'block', fontSize: '20px', color: 'var(--accent-teal)', marginTop: '6px' }}>
                  {displayMoney(monthTotals.income)}
                </span>
              </div>
              <div className="nx-card" style={{ padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Gastos del mes</span>
                <span className="nx-display privacy-sensitive" style={{ display: 'block', fontSize: '20px', color: 'var(--danger-red)', marginTop: '6px' }}>
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
                    requestClose();
                    window.setTimeout(() => onOpenLimits?.(), 280);
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
                      <span className="privacy-sensitive">
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
        </div>
      )}
    </>,
    document.body,
  );
};

export default MovementsView;
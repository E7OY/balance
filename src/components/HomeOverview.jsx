import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  BarChart2,
  CreditCard,
  FileText,
  FolderPlus,
  GitFork,
  Landmark,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import TransactionItem, { getCategoryVisuals } from "./TransactionItem";
import NexoLogo from "./NexoLogo";
import HomeThemeModal from "./HomeThemeModal";
import {
  getSavedHomeBackground,
  HOME_BG_EVENT,
  resolveBackgroundCss,
} from "../utils/homeBackgrounds";
import { useElasticScroll } from "../hooks/useElasticScroll";
import { getFromLocalStorage } from "../utils/localStorage";
import { triggerHaptic } from "../utils/haptics";

const HOME_TOKENS_CSS = `
  /* Fondo gris suave (#F3F4F6) en modo claro para que las tarjetas blancas (#FFFFFF) destaquen */
  .stage:not(.dark),
  .stage:not(.dark) .phone,
  .stage:not(.dark) .screen-content {
    background-color: var(--surface-soft);
  }

  /* CAPA DE FONDO INDEPENDIENTE CON DEGRADADO SUAVIZADO */
.nx-hero-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: calc(430px + env(safe-area-inset-top, 0px));
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .nx-hero-bg-artwork {
    position: absolute;
    inset: 0;
    background-position: center top;
    background-size: cover;
    background-repeat: no-repeat;
    transition: background 0.3s ease;
  }

  .nx-hero-bg-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.18) 0%,
      rgba(0, 0, 0, 0.1) 46%,
      rgba(243, 244, 246, 0.72) 80%,
      var(--surface-soft) 100%
    );
  }
  .dark .nx-hero-bg-fade {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.24) 0%,
      rgba(0, 0, 0, 0.12) 46%,
      rgba(0, 0, 0, 0.78) 80%,
      var(--canvas-dark) 100%
    );
  }

  /* HERO BAND */
  .nx-hero-band {
    background-color: transparent;
    color: var(--on-dark);
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-xl) 42px;
    border-radius: var(--rounded-none);
    position: relative;
    z-index: 2;
    overflow: visible;
  }

  .nx-hero-inner {
    position: relative;
    z-index: 2;
  }
  .nx-top-bar {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    margin-bottom: var(--sp-xxl);
  }
  .nx-avatar-pill {
    width: 36px;
    height: 36px;
    border-radius: var(--rounded-full);
    background: rgba(15, 23, 42, 0.28);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: var(--on-dark);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
  }
  .nx-avatar-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: var(--rounded-full);
    background-color: var(--accent-teal);
    border: 2px solid var(--canvas-dark);
  }
  .nx-search-pill {
    flex: 1;
    height: 36px;
    border-radius: var(--rounded-full);
    background: rgba(15, 23, 42, 0.26);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.22);
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: 0 var(--sp-lg);
    color: #FFFFFF;
  }
  .nx-search-pill input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: none;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.24px;
    min-width: 0;
  }
  .nx-search-pill input::placeholder {
    color: rgba(255, 255, 255, 0.82);
  }
  .nx-icon-circle {
    width: 36px;
    height: 36px;
    border-radius: var(--rounded-full);
    background: rgba(15, 23, 42, 0.26);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .nx-hero-band .nx-sub-nav-pill {
    background: rgba(15, 23, 42, 0.32);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #FFFFFF;
  }
  .nx-hero-balance {
    text-align: center;
    margin-bottom: 26px;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.22);
  }
  .nx-hero-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-weight: 500;
    line-height: 1.0;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
    margin: var(--sp-sm) 0 var(--sp-lg);
    cursor: pointer;
    user-select: none;
  }
  .nx-hero-int {
    font-size: 56px;
    color: #FFFFFF;
  }
  .nx-hero-dec {
    font-size: 28px;
    color: rgba(255, 255, 255, 0.88);
    margin-left: 2px;
  }

  /* 4 BOTONES CIRCULARES ESTILO REVOLUT */
  .nx-hero-circle-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    position: relative;
  }
  .nx-circle-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 0;
    padding: 0;
    color: #FFFFFF;
    font-family: inherit;
    cursor: pointer;
    user-select: none;
  }
  .nx-circle-disc {
    width: 50px;
    height: 50px;
    border-radius: var(--rounded-full);
    background: rgba(22, 24, 30, 0.56);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.16s ease;
  }
  .nx-circle-action:active .nx-circle-disc {
    transform: scale(0.92);
    background: rgba(255, 255, 255, 0.26);
  }
  .nx-circle-action.open .nx-circle-disc {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.32);
  }
  .nx-circle-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: rgba(255, 255, 255, 0.94);
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  }

  /* MENÚ DESPLEGABLE SOBRE EL BOTÓN MÁS */
  .nx-more-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0, 0, 0, 0.18);
  }
  .nx-more-popover {
    position: absolute;
    right: 0;
    bottom: calc(100% + 12px);
    width: 226px;
    z-index: 20;
    border-radius: 18px;
    background: rgba(30, 31, 38, 0.96);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);
    overflow: hidden;
    transform-origin: bottom right;
    animation: nx-popover-in 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .nx-more-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 16px;
    background: transparent;
    border: 0;
    color: rgba(255, 255, 255, 0.94);
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }
  .nx-more-item + .nx-more-item {
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }
  .nx-more-item:active {
    background: rgba(255, 255, 255, 0.1);
  }
  .nx-more-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.14);
  }
  .nx-more-item.danger {
    color: #EF4444;
  }

  @keyframes nx-popover-in {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* CATALOGUE BAND: SIEMPRE POR ENCIMA DE LA CAPA DE FONDO (z-index: 3 > z-index: 0) */
  .nx-catalogue-band {
    background-color: transparent;
    padding: 0 var(--sp-lg) var(--sp-xxl);
    margin-top: -18px;
    position: relative;
    z-index: 3;
  }

  .nx-tx-catalogue-card {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: 22px;
    padding: 10px 18px 14px;
    margin-bottom: var(--sp-xl);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
  }
  .dark .nx-tx-catalogue-card {
    background-color: rgba(24, 27, 34, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: var(--on-dark);
    box-shadow: none;
  }

  .nx-widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-md);
  }
  .nx-widget-tile {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: var(--rounded-lg);
    padding: 20px;
    border: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 172px;
    cursor: pointer;
    transition: transform 0.14s ease;
    min-width: 0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .dark .nx-widget-tile {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .nx-widget-tile:active {
    transform: scale(0.98);
  }

  .nx-cat-track {
    height: 4px;
    border-radius: var(--rounded-full);
    background-color: var(--surface-soft);
    overflow: hidden;
  }
  .dark .nx-cat-track {
    background-color: #242428;
  }WW
`;

const HomeOverview = ({
  initials = "MP",
  colorfulHero = true,
  query = "",
  onQueryChange,
  onOpenLimits,
  onQuickAction,
  onOpenProfile,
  onLongPressAvatar,
  onOpenMovements,
}) => {
  const {
    transactions,
    investmentRecords = [],
    filters,
    activeProfile,
    activeProfileId,
    profiles = [],
    getTransactionsForProfile,
    isAmountsHidden,
    setIsAmountsHidden,
    addProfile,
    deleteActiveProfile,
    exportPdf,
    exportCsv,
  } = useFinance();

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

  const [bgConfig, setBgConfig] = useState(() => getSavedHomeBackground());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountError, setNewAccountError] = useState("");
  const [showAllTx, setShowAllTx] = useState(false);

  const scrollContainerRef = useRef(null);
  const longPressRef = useRef(null);
  const didLongPressRef = useRef(false);

  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } =
    useElasticScroll(75, 0.35);

  useEffect(() => {
    const handleBgChanged = (e) => {
      setBgConfig(e.detail || getSavedHomeBackground());
    };
    window.addEventListener(HOME_BG_EVENT, handleBgChanged);
    return () => window.removeEventListener(HOME_BG_EVENT, handleBgChanged);
  }, []);

  const activeBackgroundCss = useMemo(() => {
    if (
      !colorfulHero &&
      !bgConfig.customImage &&
      bgConfig.id === "obsidian-pure"
    ) {
      return "#000000";
    }
    return resolveBackgroundCss(bgConfig);
  }, [bgConfig, colorfulHero]);

  const monthName = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(
    new Date(filters.year, filters.month),
  );
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}`;

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => typeof tx.date === "string" && tx.date.startsWith(monthPrefix),
      ),
    [transactions, monthPrefix],
  );

  const previousMonthExpenses = useMemo(() => {
    const prevDate = new Date(filters.year, filters.month - 1, 1);
    const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    return transactions
      .filter(
        (tx) =>
          tx.type === "Gasto" &&
          typeof tx.date === "string" &&
          tx.date.startsWith(prevPrefix),
      )
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, filters.year, filters.month]);

  const totals = useMemo(
    () =>
      monthlyTransactions.reduce(
        (acc, tx) => {
          const amt = Number(tx.amount);
          if (!Number.isFinite(amt) || amt <= 0) return acc;
          if (tx.type === "Ingreso") acc.income += amt;
          if (tx.type === "Gasto") acc.expenses += amt;
          return acc;
        },
        { income: 0, expenses: 0 },
      ),
    [monthlyTransactions],
  );

  const available = totals.income - totals.expenses;
  const expenseDiff = totals.expenses - previousMonthExpenses;

  const { totalWealth, allAccountsMonthlyDelta } = useMemo(() => {
    const accountList =
      profiles.length > 0 ? profiles : activeProfile ? [activeProfile] : [];
    let wealth = 0;
    let monthlyDelta = 0;

    accountList.forEach((profile) => {
      const pTxs =
        profile.id === activeProfileId
          ? transactions
          : getTransactionsForProfile
            ? getTransactionsForProfile(profile.id)
            : [];

      (Array.isArray(pTxs) ? pTxs : []).forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (!Number.isFinite(amt) || amt <= 0) return;
        if (tx.type === "Ingreso") {
          wealth += amt;
          if (typeof tx.date === "string" && tx.date.startsWith(monthPrefix))
            monthlyDelta += amt;
        } else if (tx.type === "Gasto") {
          wealth -= amt;
          if (typeof tx.date === "string" && tx.date.startsWith(monthPrefix))
            monthlyDelta -= amt;
        }
      });

      const pInvs =
        profile.id === activeProfileId
          ? investmentRecords
          : getFromLocalStorage(`finance:${profile.id}:investments`) || [];

      (Array.isArray(pInvs) ? pInvs : []).forEach((rec) => {
        if (!rec?.soldAt) {
          wealth += Number(rec?.currentValue) || 0;
        }
      });
    });

    return { totalWealth: wealth, allAccountsMonthlyDelta: monthlyDelta };
  }, [
    profiles,
    activeProfile,
    activeProfileId,
    transactions,
    investmentRecords,
    getTransactionsForProfile,
    monthPrefix,
  ]);

  const accountCircles = useMemo(() => {
    let savedThemes = {};
    try {
      savedThemes =
        JSON.parse(localStorage.getItem("balance-account-themes") || "{}") ||
        {};
    } catch {}

    const list =
      profiles.length > 0 ? profiles : activeProfile ? [activeProfile] : [];
    return list.map((p, idx) => {
      const themeId =
        savedThemes[p.id] ||
        FALLBACK_THEME_IDS[idx % FALLBACK_THEME_IDS.length];
      return {
        id: p.id,
        name: p.name,
        bg: ACCOUNT_THEME_BGS[themeId] || ACCOUNT_THEME_BGS.standard,
      };
    });
  }, [profiles, activeProfile]);

  const topCategories = useMemo(() => {
    const map = {};
    monthlyTransactions
      .filter((tx) => tx.type === "Gasto")
      .forEach((tx) => {
        const cat = tx.category || "Otros";
        map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
      });

    return Object.entries(map)
      .map(([name, amount]) => ({
        name,
        amount,
        share:
          totals.expenses > 0
            ? Math.min(100, Math.round((amount / totals.expenses) * 100))
            : 0,
        color: getCategoryVisuals(name, "Gasto").bg,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [monthlyTransactions, totals.expenses]);

  const spendWidgetChart = useMemo(() => {
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth =
      filters.year === today.getFullYear() &&
      filters.month === today.getMonth();
    const isPastMonth =
      filters.year < today.getFullYear() ||
      (filters.year === today.getFullYear() &&
        filters.month < today.getMonth());
    const cutoffDay = isCurrentMonth
      ? Math.min(daysInMonth, Math.max(1, today.getDate()))
      : isPastMonth
        ? daysInMonth
        : 1;

    const daily = Array(daysInMonth).fill(0);
    monthlyTransactions
      .filter((tx) => tx.type === "Gasto")
      .forEach((tx) => {
        const day = parseInt(tx.date.split("-")[2], 10);
        if (day >= 1 && day <= daysInMonth)
          daily[day - 1] += Number(tx.amount) || 0;
      });

    let running = 0;
    const cumulative = daily.map((val, idx) => {
      running += val;
      return { day: idx + 1, value: running };
    });

    const currentSpend = cumulative[cutoffDay - 1]?.value || 0;
    const projectedEnd =
      isCurrentMonth && cutoffDay < daysInMonth
        ? currentSpend +
          (currentSpend / cutoffDay) * (daysInMonth - cutoffDay) * 0.65
        : currentSpend;
    const maxY = Math.max(projectedEnd, currentSpend, 1);

    const toCoord = (day, val) => ({
      x: ((day - 1) / Math.max(1, daysInMonth - 1)) * 140,
      y: 42 - (val / maxY) * 32,
    });

    const actualPoints = cumulative
      .slice(0, cutoffDay)
      .map((item) => toCoord(item.day, item.value));
    const actualPath = actualPoints
      .map(
        (pt, i) =>
          `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      )
      .join(" ");
    const lastActual = actualPoints[actualPoints.length - 1] || { x: 0, y: 42 };
    const actualArea = `${actualPath} L${lastActual.x.toFixed(1)} 46 L0 46 Z`;

    const endCoord = toCoord(daysInMonth, projectedEnd);
    const hasProjection = cutoffDay < daysInMonth;
    const projectedPath = hasProjection
      ? `M${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L${endCoord.x.toFixed(1)} ${endCoord.y.toFixed(1)}`
      : "";
    const projectedArea = hasProjection
      ? `M${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L${endCoord.x.toFixed(1)} ${endCoord.y.toFixed(1)} L140 46 L${lastActual.x.toFixed(1)} 46 Z`
      : "";

    return {
      actualPath,
      actualArea,
      projectedPath,
      projectedArea,
      hasProjection,
    };
  }, [monthlyTransactions, filters.year, filters.month]);

  const formattedAvailable = isAmountsHidden
    ? "•••• €"
    : new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(available);
  const commaIdx = formattedAvailable.indexOf(",");
  const intPart =
    commaIdx === -1
      ? formattedAvailable
      : formattedAvailable.slice(0, commaIdx);
  const decPart = commaIdx === -1 ? "" : formattedAvailable.slice(commaIdx);

  const displayMoney = (val) =>
    isAmountsHidden
      ? "•••• €"
      : new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(val);

  const displayCompactMoney = (val) =>
    isAmountsHidden
      ? "•••• €"
      : new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: Number.isInteger(val) ? 0 : 2,
        }).format(val);

  const visibleTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = monthlyTransactions
      .filter((tx) =>
        `${tx.description || ""} ${tx.category} ${tx.paymentMethod || ""}`
          .toLowerCase()
          .includes(q),
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          String(b.id).localeCompare(String(a.id)),
      );
    return showAllTx ? list : list.slice(0, 4);
  }, [monthlyTransactions, query, showAllTx]);

  const secondarySpace =
    profiles.find((p) => p.id !== activeProfile?.id) || activeProfile;
  const spaceDisplayName = secondarySpace?.name || "Personal";
  const spaceInitials = spaceDisplayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      ref={scrollContainerRef}
      className={`elastic-scroll-wrapper ${isSnapping ? "snapping" : ""}`}
      style={{
        position: "relative",
        transform: pullY ? `translate3d(0, ${pullY}px, 0)` : undefined,
        zIndex: isMoreMenuOpen ? 60 : undefined,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={(e) =>
        onTouchMove(e, scrollContainerRef.current?.closest(".screen-content"))
      }
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <style>{HOME_TOKENS_CSS}</style>

      {isMoreMenuOpen &&
        createPortal(
          <div
            className="nx-more-backdrop"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
          />,
          document.body,
        )}

      {/* CAPA DE FONDO INDEPENDIENTE (z-index: 0, NUNCA TAPA LA TARJETA DE MOVIMIENTOS) */}
      <div className="nx-hero-bg-layer" aria-hidden="true">
        <div
          className="nx-hero-bg-artwork"
          style={{ background: activeBackgroundCss }}
        />
        <div className="nx-hero-bg-fade" />
      </div>

      {/* BANDA 1: HERO */}
      <section
        className="nx-hero-band"
        style={{ zIndex: isMoreMenuOpen ? 10 : 2 }}
      >
        <div className="nx-hero-inner">
          <div className="nx-top-bar">
            <button
              type="button"
              className="nx-avatar-pill"
              onPointerDown={() => {
                didLongPressRef.current = false;
                longPressRef.current = window.setTimeout(() => {
                  didLongPressRef.current = true;
                  onLongPressAvatar?.();
                }, 500);
              }}
              onPointerUp={() => window.clearTimeout(longPressRef.current)}
              onPointerLeave={() => window.clearTimeout(longPressRef.current)}
              onClick={() => {
                if (didLongPressRef.current) {
                  didLongPressRef.current = false;
                  return;
                }
                onOpenProfile?.();
              }}
              aria-label="Perfil y cuentas"
            >
              {initials}
              {profiles.length > 1 && <span className="nx-avatar-dot" />}
            </button>

            <div className="nx-search-pill">
              <Search size={14} strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder="Buscar movimientos"
                aria-label="Buscar movimientos"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange?.("")}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#FFFFFF",
                    display: "flex",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="nx-icon-circle"
              onClick={onOpenMovements}
              aria-label="Cuentas"
            >
              <CreditCard size={15} strokeWidth={2} />
            </button>
          </div>

          <div className="nx-hero-balance">
            <span
              className="nx-label"
              style={{ color: "rgba(255, 255, 255, 0.92)", display: "block" }}
            >
              {activeProfile?.name || "Personal"} · {capitalizedMonth}{" "}
              {filters.year}
            </span>

            <div
              className="nx-hero-display privacy-sensitive"
              onDoubleClick={() => {
                triggerHaptic();
                setIsAmountsHidden?.((prev) => !prev);
              }}
            >
              <span className="nx-hero-int">{intPart}</span>
              <span className="nx-hero-dec">{decPart}</span>
            </div>

            <button
              type="button"
              className="nx-sub-nav-pill"
              onClick={onOpenMovements}
            >
              Cuentas
            </button>
          </div>

          {/* 4 BOTONES CIRCULARES + MENÚ DESPLEGABLE EN "MÁS" */}
          <div className="nx-hero-circle-grid">
            {isMoreMenuOpen && (
              <div
                className="nx-more-popover"
                role="menu"
                aria-label="Más opciones"
              >
                <button
                  type="button"
                  className="nx-more-item"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    onOpenMovements?.();
                  }}
                >
                  <span>Análisis</span>
                  <BarChart2 size={17} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  className="nx-more-item"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    exportPdf?.();
                  }}
                >
                  <span>Extracto PDF</span>
                  <FileText size={17} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  className="nx-more-item"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    exportCsv?.();
                  }}
                >
                  <span>Exportar CSV</span>
                  <ArrowLeftRight size={17} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  className="nx-more-item"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    setIsThemeModalOpen(true);
                  }}
                >
                  <span>Tema</span>
                  <Palette size={17} strokeWidth={2} />
                </button>

                <div className="nx-more-divider" />

                <button
                  type="button"
                  className="nx-more-item"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    setNewAccountName("");
                    setNewAccountError("");
                    setIsNewAccountOpen(true);
                  }}
                >
                  <span>Nueva cuenta</span>
                  <FolderPlus size={17} strokeWidth={2} />
                </button>

                {profiles.length > 1 && (
                  <button
                    type="button"
                    className="nx-more-item danger"
                    role="menuitem"
                    onClick={() => {
                      triggerHaptic();
                      setIsMoreMenuOpen(false);
                      deleteActiveProfile?.().catch((err) =>
                        alert(err.message),
                      );
                    }}
                  >
                    <span>Eliminar cuenta</span>
                    <Trash2 size={17} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className="nx-circle-action"
              onClick={() => {
                setIsMoreMenuOpen(false);
                onQuickAction?.("income");
              }}
            >
              <span className="nx-circle-disc">
                <Plus size={22} strokeWidth={2.2} />
              </span>
              <span className="nx-circle-label">Ingreso</span>
            </button>

            <button
              type="button"
              className="nx-circle-action"
              onClick={() => {
                setIsMoreMenuOpen(false);
                onQuickAction?.("expense");
              }}
            >
              <span className="nx-circle-disc">
                <Shuffle size={20} strokeWidth={2.1} />
              </span>
              <span className="nx-circle-label">Gasto</span>
            </button>

            <button
              type="button"
              className="nx-circle-action"
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenLimits?.();
              }}
            >
              <span className="nx-circle-disc">
                <Landmark size={20} strokeWidth={2.1} />
              </span>
              <span className="nx-circle-label">Topes</span>
            </button>

            <button
              type="button"
              className={`nx-circle-action ${isMoreMenuOpen ? "open" : ""}`}
              onClick={() => {
                triggerHaptic();
                setIsMoreMenuOpen((prev) => !prev);
              }}
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="menu"
            >
              <span className="nx-circle-disc">
                <MoreHorizontal size={21} strokeWidth={2.2} />
              </span>
              <span className="nx-circle-label">Más</span>
            </button>
          </div>
        </div>
      </section>

      {/* BANDA 2: TARJETAS SOBRE FONDO (z-index: 3, POR ENCIMA DE LA CAPA DE FONDO) */}
      <div className="nx-catalogue-band">
        <div className="nx-tx-catalogue-card">
          {visibleTransactions.length > 0 ? (
            <>
              {visibleTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
              {monthlyTransactions.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllTx((prev) => !prev)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: 0,
                    color: "var(--text-main)",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    fontWeight: 500,
                    padding: "12px 0 4px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {showAllTx ? "Mostrar menos" : "Ver todo"}
                </button>
              )}
            </>
          ) : (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-mute)",
                textAlign: "center",
                padding: "var(--sp-xl) 0",
                margin: 0,
              }}
            >
              Sin movimientos en {monthName}. Desliza hacia los lados para
              cambiar de mes.
            </p>
          )}
        </div>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: "0 0 var(--sp-lg) 4px",
          }}
        >
          Widgets
        </h2>

        <div className="nx-widgets-grid">
          {/* WIDGET 1: GASTO ESTE MES */}
          <button
            type="button"
            className="nx-widget-tile"
            onClick={onOpenMovements}
          >
            <div>
              <span
                className="nx-label"
                style={{ color: "var(--text-mute)", display: "block" }}
              >
                Gasto este mes
              </span>
              <strong
                className="nx-display privacy-sensitive"
                style={{ fontSize: "22px", display: "block", marginTop: "6px" }}
              >
                {displayMoney(totals.expenses)}
              </strong>
              <span
                className="nx-label privacy-sensitive"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "6px",
                  color:
                    expenseDiff >= 0
                      ? "var(--accent-deep-pink)"
                      : "var(--accent-teal)",
                }}
              >
                <span style={{ fontSize: "9px" }}>
                  {expenseDiff >= 0 ? "▲" : "▼"}
                </span>
                {displayCompactMoney(Math.abs(expenseDiff))}
              </span>
            </div>

            <svg
              viewBox="0 0 140 46"
              preserveAspectRatio="none"
              style={{
                width: "100%",
                height: "46px",
                marginTop: "12px",
                overflow: "visible",
              }}
            >
              <defs>
                <linearGradient id="nxSpendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#494fdf" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#494fdf" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="nxProjFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {spendWidgetChart.hasProjection && (
                <>
                  <path
                    d={spendWidgetChart.projectedArea}
                    fill="url(#nxProjFill)"
                  />
                  <path
                    d={spendWidgetChart.projectedPath}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </>
              )}
              <path d={spendWidgetChart.actualArea} fill="url(#nxSpendFill)" />
              <path
                d={spendWidgetChart.actualPath}
                fill="none"
                stroke="#494fdf"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* WIDGET 2: PATRIMONIO TOTAL ENTRE TODAS LAS CUENTAS */}
          <button
            type="button"
            className="nx-widget-tile"
            onClick={onOpenMovements}
          >
            <div>
              <span
                className="nx-label"
                style={{ color: "var(--text-mute)", display: "block" }}
              >
                Patrimonio total
              </span>
              <strong
                className="nx-display privacy-sensitive"
                style={{ fontSize: "22px", display: "block", marginTop: "6px" }}
              >
                {displayCompactMoney(totalWealth)}
              </strong>
              <span
                className="nx-label privacy-sensitive"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "6px",
                  color:
                    allAccountsMonthlyDelta >= 0
                      ? "var(--primary)"
                      : "var(--danger-red)",
                }}
              >
                <span style={{ fontSize: "9px" }}>
                  {allAccountsMonthlyDelta >= 0 ? "▲" : "▼"}
                </span>
                {displayCompactMoney(Math.abs(allAccountsMonthlyDelta))}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center" }}
                aria-hidden="true"
              >
                {accountCircles.map((acc, idx) => (
                  <span
                    key={acc.id}
                    title={acc.name}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: acc.bg,
                      border: "2.5px solid var(--bg-card)",
                      marginLeft: idx === 0 ? 0 : "-10px",
                      zIndex: accountCircles.length - idx,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {profiles.length > 1 && (
                <span
                  className="nx-label"
                  style={{ color: "var(--text-mute)", fontSize: "11px" }}
                >
                  {profiles.length} cuentas
                </span>
              )}
            </div>
          </button>

          {/* WIDGET 3: GASTOS POR CATEGORÍA */}
          <button
            type="button"
            className="nx-widget-tile"
            onClick={onOpenLimits}
            style={{ padding: "18px" }}
          >
            <div style={{ width: "100%" }}>
              <span
                className="nx-label"
                style={{
                  color: "var(--text-mute)",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                Por categoría
              </span>

              {topCategories.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    width: "100%",
                  }}
                >
                  {topCategories.map((cat) => (
                    <div key={cat.name} style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "4px",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            minWidth: 0,
                            fontWeight: 500,
                            color: "var(--text-main)",
                          }}
                        >
                          <i
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              backgroundColor: cat.color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cat.name}
                          </span>
                        </span>
                        <span
                          className="privacy-sensitive"
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 500,
                            color: "var(--text-mute)",
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {displayCompactMoney(cat.amount)}
                        </span>
                      </div>
                      <div className="nx-cat-track">
                        <div
                          style={{
                            height: "100%",
                            width: `${cat.share}%`,
                            borderRadius: "var(--rounded-full)",
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: "14px" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-main)",
                    }}
                  >
                    Sin gastos
                  </span>
                  <span
                    className="nx-label"
                    style={{
                      display: "block",
                      color: "var(--text-mute)",
                      marginTop: "4px",
                    }}
                  >
                    Toca para ver topes
                  </span>
                </div>
              )}
            </div>
          </button>

          {/* WIDGET 4: ESPACIO RÁPIDO CON GLYPH NEXO */}
          <div
            className="nx-widget-tile"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            <div
              onClick={() => {
                if (profiles.length > 1) onLongPressAvatar?.();
                else onOpenProfile?.();
              }}
              style={{
                position: "relative",
                width: "46px",
                height: "46px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "var(--rounded-full)",
                  backgroundColor: "var(--accent-teal)",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {spaceInitials}
              </div>
              <span
                style={{
                  position: "absolute",
                  right: "-2px",
                  bottom: "-2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "var(--rounded-full)",
                  backgroundColor: "var(--canvas-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                }}
              >
                <NexoLogo size={11} />
              </span>
            </div>

            <span
              onClick={onOpenProfile}
              className="nx-label"
              style={{
                color: "var(--text-main)",
                margin: "8px 0",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {spaceDisplayName}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={onOpenLimits}
                aria-label="Topes"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: 0,
                  background: "transparent",
                  color: "var(--text-mute)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <GitFork size={16} />
              </button>

              <button
                type="button"
                onClick={() => onQuickAction?.("expense")}
                aria-label="Añadir gasto"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: 0,
                  background: "rgba(73, 79, 223, 0.14)",
                  color: "var(--primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ArrowUp size={18} />
              </button>

              <button
                type="button"
                onClick={() => onQuickAction?.("income")}
                aria-label="Añadir ingreso"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: 0,
                  background: "transparent",
                  color: "var(--text-mute)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CREAR NUEVA CUENTA DESDE EL MENÚ MÁS */}
      {isNewAccountOpen &&
        createPortal(
          <div
            className="sheet-layer"
            style={{ zIndex: 110 }}
            onMouseDown={() => setIsNewAccountOpen(false)}
          >
            <section
              className="bottom-sheet"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <h2 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>
                  Nueva cuenta
                </h2>
                <button
                  type="button"
                  className="sheet-close"
                  onClick={() => setIsNewAccountOpen(false)}
                >
                  <X size={17} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewAccountError("");
                  try {
                    addProfile(newAccountName);
                    triggerHaptic();
                    setNewAccountName("");
                    setIsNewAccountOpen(false);
                  } catch (err) {
                    setNewAccountError(err.message);
                  }
                }}
              >
                <label
                  className="nx-label"
                  style={{
                    display: "block",
                    color: "var(--text-mute)",
                    marginBottom: "16px",
                  }}
                >
                  Nombre de la cuenta
                  <input
                    required
                    autoFocus
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ej. Ahorro, Viajes, Trabajo..."
                  />
                </label>
                {newAccountError && (
                  <p
                    style={{
                      color: "var(--danger-red)",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {newAccountError}
                  </p>
                )}
                <button
                  type="submit"
                  className="nx-btn-dark"
                  style={{ width: "100%" }}
                >
                  Crear cuenta <ArrowRight size={16} />
                </button>
              </form>
            </section>
          </div>,
          document.body,
        )}

      {/* MODAL SELECTOR DE TEMA Y FONDO ESTILO REVOLUT */}
      <HomeThemeModal
        open={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        accountLabel={`${activeProfile?.name || "Personal"} · EUR`}
        balanceDisplay={formattedAvailable}
        onApplied={(nextConfig) => setBgConfig(nextConfig)}
      />
    </div>
  );
};

export default HomeOverview;
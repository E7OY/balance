import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  CreditCard,
  Eye,
  EyeOff,
  GitFork,
  ListChecks,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { useElasticScroll } from '../hooks/useElasticScroll';
import { triggerHaptic } from '../utils/haptics';

const REVOLUT_HOME_CSS = `
  .rev-hero {
    position: relative;
    overflow: hidden;
    background: url('./public/hero_bg.jpg') center / cover no-repeat;
    color: #FFFFFF;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 54px;
  }
  .dark .rev-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(11, 14, 20, 0.32);
    pointer-events: none;
  }
  .rev-hero-inner {
    position: relative;
    z-index: 1;
  }
  .rev-top-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 34px;
  }
  .rev-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.24);
    border: 1.5px solid rgba(255, 255, 255, 0.45);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
  }
  .rev-avatar-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #10B981;
    border: 1.5px solid #3D17EE;
  }
  .rev-liquid-pill {
    background: rgba(255, 255, 255, 0.17);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26);
  }
  .rev-search-pill {
    flex: 1;
    height: 34px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 13px;
    color: #FFFFFF;
  }
  .rev-search-pill input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: none;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    min-width: 0;
  }
  .rev-search-pill input::placeholder {
    color: rgba(255, 255, 255, 0.85);
  }
  .rev-top-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .rev-balance-block {
    text-align: center;
    margin-bottom: 34px;
  }
  .rev-account-label {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.94);
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .rev-main-amount {
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
    margin: 2px 0 14px;
    cursor: pointer;
    user-select: none;
  }
  .rev-main-int {
    font-size: 50px;
    font-weight: 700;
    line-height: 1;
    color: #FFFFFF;
  }
  .rev-main-dec {
    font-size: 25px;
    font-weight: 700;
    color: #FFFFFF;
    margin-left: 1px;
  }
  .rev-accounts-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 20px;
    border-radius: 999px;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.12s ease, background 0.15s ease;
  }
  .rev-accounts-pill:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.28);
  }
  .rev-hero-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .rev-hero-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 0;
    color: #FFFFFF;
    font-family: inherit;
    cursor: pointer;
  }
  .rev-hero-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    transition: transform 0.12s ease, background 0.15s ease;
  }
  .rev-hero-action:active .rev-hero-circle {
    transform: scale(0.91);
    background: rgba(255, 255, 255, 0.28);
  }
  .rev-hero-action span {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.96);
    letter-spacing: -0.01em;
  }
  .rev-body-section {
    position: relative;
    z-index: 2;
    padding: 0 14px;
    margin-top: -32px;
  }
  .rev-promo-card {
    position: relative;
    background: var(--rev-card);
    border-radius: 18px;
    padding: 15px 16px;
    box-shadow: var(--rev-shadow);
    border: 1px solid var(--rev-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    overflow: hidden;
  }
  .rev-promo-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--rev-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
  }
  .rev-dots {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin: 9px 0 12px;
  }
  .rev-dots button {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 0;
    padding: 0;
    background: var(--rev-muted);
    opacity: 0.3;
    cursor: pointer;
  }
  .rev-dots button.active {
    opacity: 0.95;
    background: var(--rev-text);
  }
  .rev-tx-card {
    background: var(--rev-card);
    border-radius: 18px;
    padding: 14px 16px 8px;
    box-shadow: var(--rev-shadow);
    border: 1px solid var(--rev-border);
  }
  .rev-tx-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--rev-muted);
    margin-bottom: 4px;
  }
  .rev-see-all {
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--rev-blue);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 0 6px;
    cursor: pointer;
    text-align: center;
  }

  /* WIDGETS ESTILO REVOLUT 2x2 */
  .rev-widgets-title {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--rev-text);
    margin: 20px 2px 12px;
  }
  .rev-widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .rev-widget-card {
    background: var(--rev-card);
    border-radius: 22px;
    padding: 16px;
    box-shadow: var(--rev-shadow);
    border: 1px solid var(--rev-border);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 164px;
    text-align: left;
    position: relative;
    overflow: hidden;
    transition: transform 0.14s ease;
  }
  .rev-widget-card:active {
    transform: scale(0.98);
  }
  .rev-widget-label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--rev-muted);
    letter-spacing: -0.01em;
    display: block;
  }
  .rev-widget-value {
    font-size: 21px;
    font-weight: 700;
    color: var(--rev-text);
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    display: block;
    margin-top: 3px;
  }
  .rev-widget-delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    margin-top: 4px;
  }
  .rev-wealth-circles {
    display: flex;
    align-items: center;
    margin-top: 16px;
  }
  .rev-wealth-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2.5px solid var(--rev-card);
    flex-shrink: 0;
  }
  .rev-wealth-circle + .rev-wealth-circle {
    margin-left: -8px;
  }
  .rev-mini-card {
    width: 64px;
    height: 41px;
    border-radius: 7px;
    background: linear-gradient(135deg, #27272A 0%, #111113 100%);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
    padding: 5px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.85);
  }
  .rev-widget-round-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 0;
    background: var(--rev-blue-soft);
    color: var(--rev-blue);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .rev-widget-round-btn:active {
    transform: scale(0.91);
  }
  .rev-widget-ghost-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--rev-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .rev-widget-ghost-btn:active {
    background: var(--rev-subtle);
  }
`;

const HomeOverview = ({
  initials = 'MP',
  query = '',
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
    profiles = [],
    isAmountsHidden,
    setIsAmountsHidden,
  } = useFinance();

  const [promoIndex, setPromoIndex] = useState(0);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const scrollContainerRef = useRef(null);
  const longPressRef = useRef(null);
  const didLongPressRef = useRef(false);
  const promoSwipeRef = useRef(null);

  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } = useElasticScroll(75, 0.35);

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(filters.year, filters.month));
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;

  const monthlyTransactions = useMemo(
    () => transactions.filter((tx) => typeof tx.date === 'string' && tx.date.startsWith(monthPrefix)),
    [transactions, monthPrefix],
  );

  const previousMonthExpenses = useMemo(() => {
    const prevDate = new Date(filters.year, filters.month - 1, 1);
    const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((tx) => tx.type === 'Gasto' && typeof tx.date === 'string' && tx.date.startsWith(prevPrefix))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, filters.year, filters.month]);

  const totals = useMemo(() => monthlyTransactions.reduce((acc, tx) => {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt) || amt <= 0) return acc;
    if (tx.type === 'Ingreso') acc.income += amt;
    if (tx.type === 'Gasto') acc.expenses += amt;
    return acc;
  }, { income: 0, expenses: 0 }), [monthlyTransactions]);

  const available = totals.income - totals.expenses;
  const expenseDiff = totals.expenses - previousMonthExpenses;

  // Patrimonio total: balance histórico de movimientos + cartera de inversiones activa
  const totalWealth = useMemo(() => {
    const cashTotal = transactions.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      return tx.type === 'Ingreso' ? acc + amt : tx.type === 'Gasto' ? acc - amt : acc;
    }, 0);
    const investmentsTotal = (investmentRecords || []).reduce((acc, rec) => (
      rec.soldAt ? acc : acc + (Number(rec.currentValue) || 0)
    ), 0);
    return cashTotal + investmentsTotal;
  }, [transactions, investmentRecords]);

  // Datos para el mini gráfico de gasto mensual con línea continua hasta hoy y proyección discontinua
  const spendWidgetChart = useMemo(() => {
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = filters.year === today.getFullYear() && filters.month === today.getMonth();
    const isPastMonth = filters.year < today.getFullYear()
      || (filters.year === today.getFullYear() && filters.month < today.getMonth());
    const cutoffDay = isCurrentMonth ? Math.min(daysInMonth, Math.max(1, today.getDate())) : isPastMonth ? daysInMonth : 1;

    const daily = Array(daysInMonth).fill(0);
    monthlyTransactions
      .filter((tx) => tx.type === 'Gasto')
      .forEach((tx) => {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (day >= 1 && day <= daysInMonth) daily[day - 1] += Number(tx.amount) || 0;
      });

    let running = 0;
    const cumulative = daily.map((val, idx) => {
      running += val;
      return { day: idx + 1, value: running };
    });

    const currentSpend = cumulative[cutoffDay - 1]?.value || 0;
    const projectedEnd = isCurrentMonth && cutoffDay < daysInMonth
      ? currentSpend + (currentSpend / cutoffDay) * (daysInMonth - cutoffDay) * 0.65
      : currentSpend;
    const maxY = Math.max(projectedEnd, currentSpend, 1);

    const toCoord = (day, val) => ({
      x: ((day - 1) / Math.max(1, daysInMonth - 1)) * 140,
      y: 42 - (val / maxY) * 32,
    });

    const actualPoints = cumulative.slice(0, cutoffDay).map((item) => toCoord(item.day, item.value));
    const actualPath = actualPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
    const lastActual = actualPoints[actualPoints.length - 1] || { x: 0, y: 42 };
    const actualArea = `${actualPath} L${lastActual.x.toFixed(1)} 46 L0 46 Z`;

    const endCoord = toCoord(daysInMonth, projectedEnd);
    const hasProjection = cutoffDay < daysInMonth;
    const projectedPath = hasProjection
      ? `M${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L${endCoord.x.toFixed(1)} ${endCoord.y.toFixed(1)}`
      : '';
    const projectedArea = hasProjection
      ? `M${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L${endCoord.x.toFixed(1)} ${endCoord.y.toFixed(1)} L140 46 L${lastActual.x.toFixed(1)} 46 Z`
      : '';

    return { actualPath, actualArea, projectedPath, projectedArea, hasProjection };
  }, [monthlyTransactions, filters.year, filters.month]);

  const formattedAvailable = isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(available);
  const commaIdx = formattedAvailable.indexOf(',');
  const intPart = commaIdx === -1 ? formattedAvailable : formattedAvailable.slice(0, commaIdx);
  const decPart = commaIdx === -1 ? '' : formattedAvailable.slice(commaIdx);

  const displayMoney = (val) => (isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val));

  const displayCompactMoney = (val) => (isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: Number.isInteger(val) ? 0 : 2,
    }).format(val));

  const visibleTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = monthlyTransactions
      .filter((tx) => `${tx.description || ''} ${tx.category} ${tx.paymentMethod || ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
    return showAllTx ? list : list.slice(0, 4);
  }, [monthlyTransactions, query, showAllTx]);

  const secondarySpace = profiles.find((p) => p.id !== activeProfile?.id) || activeProfile;
  const spaceDisplayName = secondarySpace?.name || 'Mi espacio';
  const spaceInitials = spaceDisplayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const promoCards = [
    {
      title: 'Comparte gastos en pareja o piso',
      subtitle: 'Invita a alguien a tu espacio y llevad las cuentas juntos',
      onClick: onOpenProfile,
    },
    {
      title: `Gastos de ${monthName}: ${displayMoney(totals.expenses)}`,
      subtitle: 'Consulta el desglose por categorías y tu ahorro mensual',
      onClick: onOpenMovements,
    },
    {
      title: 'Controla tus topes mensuales',
      subtitle: 'Configura límites por categoría para no pasarte',
      onClick: onOpenLimits,
    },
  ];
  const currentPromo = promoCards[promoIndex] || promoCards[0];

  return (
    <div
      ref={scrollContainerRef}
      className={`elastic-scroll-wrapper ${isSnapping ? 'snapping' : ''}`}
      style={{ transform: `translate3d(0, ${pullY}px, 0)` }}
      onTouchStart={onTouchStart}
      onTouchMove={(e) => onTouchMove(e, scrollContainerRef.current?.closest('.screen-content'))}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <style>{REVOLUT_HOME_CSS}</style>

      {/* HERO CON IMAGEN DE FONDO */}
      <section className="rev-hero">
        <div className="rev-hero-inner">
          {/* TOP BAR */}
          <div className="rev-top-bar">
            <button
              type="button"
              className="rev-avatar"
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
              {profiles.length > 1 && <span className="rev-avatar-dot" />}
            </button>

            <div className="rev-search-pill rev-liquid-pill">
              <Search size={15} strokeWidth={2.2} />
              <input
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder="Buscar"
                aria-label="Buscar"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange?.('')}
                  style={{ background: 'transparent', border: 0, color: '#fff', display: 'flex', padding: 0, cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="rev-top-icon-btn rev-liquid-pill"
              onClick={onOpenMovements}
              aria-label="Análisis"
            >
              <BarChart2 size={16} strokeWidth={2.4} />
            </button>

            <button
              type="button"
              className="rev-top-icon-btn rev-liquid-pill"
              onClick={onOpenLimits}
              aria-label="Topes"
            >
              <CreditCard size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* SALDO CENTRAL */}
          <div className="rev-balance-block">
            <div className="rev-account-label">
              Disponible {capitalizedMonth} {filters.year}
            </div>

            <div
              className="rev-main-amount privacy-sensitive"
              onDoubleClick={() => {
                triggerHaptic();
                setIsAmountsHidden?.((prev) => !prev);
              }}
            >
              <span className="rev-main-int">{intPart}</span>
              <span className="rev-main-dec">{decPart}</span>
            </div>

            <button type="button" className="rev-accounts-pill rev-liquid-pill" onClick={onOpenProfile}>
              {activeProfile?.name || 'Cuentas'}
            </button>
          </div>

          {/* 4 BOTONES CIRCULARES TRANSLÚCIDOS */}
          <div className="rev-hero-actions">
            <button type="button" className="rev-hero-action" onClick={() => onQuickAction?.('income')}>
              <span className="rev-hero-circle rev-liquid-pill">
                <Plus size={22} strokeWidth={2.3} />
              </span>
              <span>Ingreso</span>
            </button>

            <button type="button" className="rev-hero-action" onClick={() => onQuickAction?.('expense')}>
              <span className="rev-hero-circle rev-liquid-pill">
                <RefreshCw size={20} strokeWidth={2.2} />
              </span>
              <span>Gasto</span>
            </button>

            <button type="button" className="rev-hero-action" onClick={onOpenLimits}>
              <span className="rev-hero-circle rev-liquid-pill">
                <ListChecks size={20} strokeWidth={2.2} />
              </span>
              <span>Topes</span>
            </button>

            <button type="button" className="rev-hero-action" onClick={onOpenProfile}>
              <span className="rev-hero-circle rev-liquid-pill">
                <MoreHorizontal size={21} strokeWidth={2.3} />
              </span>
              <span>Más</span>
            </button>
          </div>
        </div>
      </section>

      {/* CUERPO SUPERPUESTO SOBRE EL DEGRADADO */}
      <div className="rev-body-section">
        {!promoDismissed && (
          <>
            <div
              className="rev-promo-card"
              data-month-swipe-ignore
              onTouchStart={(e) => { promoSwipeRef.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (promoSwipeRef.current === null) return;
                const diff = e.changedTouches[0].clientX - promoSwipeRef.current;
                promoSwipeRef.current = null;
                if (Math.abs(diff) > 35) {
                  setPromoIndex((prev) => (diff < 0 ? (prev + 1) % promoCards.length : (prev - 1 + promoCards.length) % promoCards.length));
                }
              }}
              onClick={currentPromo.onClick}
            >
              <button
                type="button"
                className="rev-promo-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setPromoDismissed(true);
                }}
                aria-label="Cerrar aviso"
              >
                <X size={13} />
              </button>

              <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--rev-text)', letterSpacing: '-0.01em' }}>
                  {currentPromo.title}
                </strong>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)', marginTop: '4px', lineHeight: 1.35 }}>
                  {currentPromo.subtitle}
                </small>
              </div>

              <svg width="62" height="56" viewBox="0 0 64 58" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                <defs>
                  <linearGradient id="revBoxBlue" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6EA8FF" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                  <linearGradient id="revRibbonLime" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#BEF264" />
                    <stop offset="100%" stopColor="#84CC16" />
                  </linearGradient>
                </defs>
                <rect x="14" y="18" width="38" height="34" rx="8" fill="url(#revBoxBlue)" />
                <rect x="29" y="18" width="8" height="34" fill="url(#revRibbonLime)" />
                <path d="M33 18C26 18 19 13 22 8C25 4 31 10 33 18Z" fill="url(#revRibbonLime)" />
                <path d="M33 18C40 18 47 13 44 8C41 4 35 10 33 18Z" fill="url(#revRibbonLime)" />
                <circle cx="20" cy="40" r="13" fill="#E2E8F0" stroke="#FFFFFF" strokeWidth="2" />
                <text x="20" y="45" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif">A</text>
              </svg>
            </div>

            <div className="rev-dots">
              {promoCards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={promoIndex === i ? 'active' : ''}
                  onClick={() => setPromoIndex(i)}
                  aria-label={`Tarjeta ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* TARJETA DE TRANSACCIONES REVOLUT */}
        <div className="rev-tx-card" style={{ marginTop: promoDismissed ? '0' : undefined }}>
          <div className="rev-tx-card-header">
            <span>Transacción</span>
            <span>Importe</span>
          </div>

          {visibleTransactions.length > 0 ? (
            <>
              {visibleTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
              {monthlyTransactions.length > 4 && (
                <button
                  type="button"
                  className="rev-see-all"
                  onClick={() => setShowAllTx((prev) => !prev)}
                >
                  {showAllTx ? 'Mostrar menos' : 'Ver todo'}
                </button>
              )}
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--rev-muted)', textAlign: 'center', padding: '18px 0' }}>
              No hay movimientos en {monthName}. Desliza hacia los lados para cambiar de mes.
            </p>
          )}
        </div>

        {/* SECCIÓN WIDGETS ESTILO REVOLUT 2x2 */}
        <h2 className="rev-widgets-title">Widgets</h2>
        <div className="rev-widgets-grid">
          {/* WIDGET 1: GASTO ESTE MES CON GRÁFICO Y PROYECCIÓN */}
          <button
            type="button"
            className="rev-widget-card"
            onClick={onOpenMovements}
            style={{ cursor: 'pointer', border: '1px solid var(--rev-border)' }}
          >
            <div>
              <span className="rev-widget-label">Gasto este mes</span>
              <strong className="rev-widget-value privacy-sensitive">
                {displayMoney(totals.expenses)}
              </strong>
              <span
                className="rev-widget-delta privacy-sensitive"
                style={{ color: expenseDiff >= 0 ? '#EC4899' : 'var(--rev-green)' }}
              >
                <span style={{ fontSize: '9px' }}>{expenseDiff >= 0 ? '▲' : '▼'}</span>
                {displayCompactMoney(Math.abs(expenseDiff))}
              </span>
            </div>

            <svg viewBox="0 0 140 46" preserveAspectRatio="none" style={{ width: '100%', height: '46px', marginTop: '10px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="revSpendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B38F6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3B38F6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="revProjFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {spendWidgetChart.hasProjection && (
                <>
                  <path d={spendWidgetChart.projectedArea} fill="url(#revProjFill)" />
                  <path
                    d={spendWidgetChart.projectedPath}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </>
              )}
              <path d={spendWidgetChart.actualArea} fill="url(#revSpendFill)" />
              <path
                d={spendWidgetChart.actualPath}
                fill="none"
                stroke="#3B38F6"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* WIDGET 2: PATRIMONIO TOTAL CON 3 CÍRCULOS SUPERPUESTOS */}
          <button
            type="button"
            className="rev-widget-card"
            onClick={onOpenProfile}
            style={{ cursor: 'pointer', border: '1px solid var(--rev-border)' }}
          >
            <div>
              <span className="rev-widget-label">Patrimonio total</span>
              <strong className="rev-widget-value privacy-sensitive">
                {displayCompactMoney(totalWealth)}
              </strong>
              <span
                className="rev-widget-delta privacy-sensitive"
                style={{ color: available >= 0 ? '#4F46E5' : 'var(--rev-red)' }}
              >
                <span style={{ fontSize: '9px' }}>{available >= 0 ? '▲' : '▼'}</span>
                {displayCompactMoney(Math.abs(available))}
              </span>
            </div>

            <div className="rev-wealth-circles" aria-hidden="true">
              <span className="rev-wealth-circle" style={{ background: '#0075EB', zIndex: 3 }} />
              <span className="rev-wealth-circle" style={{ background: '#64748B', zIndex: 2 }} />
              <span className="rev-wealth-circle" style={{ background: '#00B894', zIndex: 1 }} />
            </div>
          </button>

          {/* WIDGET 3: TARJETA / PRIVACIDAD CON BOTÓN DE OJO */}
          <div
            className="rev-widget-card"
            onClick={() => {
              triggerHaptic();
              setIsAmountsHidden?.((prev) => !prev);
            }}
            style={{ alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}
          >
            <div className="rev-mini-card" aria-hidden="true">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.04em', opacity: 0.9 }}>NEXO</span>
                <span style={{ width: '9px', height: '7px', borderRadius: '2px', background: 'rgba(255,255,255,0.28)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', marginLeft: '-3px' }} />
              </div>
            </div>

            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--rev-text)', margin: '8px 0' }}>
              {isAmountsHidden ? 'Saldos ocultos' : 'Privacidad'}
            </span>

            <button
              type="button"
              className="rev-widget-round-btn"
              aria-label={isAmountsHidden ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {isAmountsHidden ? <EyeOff size={19} strokeWidth={2.2} /> : <Eye size={19} strokeWidth={2.2} />}
            </button>
          </div>

          {/* WIDGET 4: ESPACIO / CONTACTO RÁPIDO CON ACCIONES */}
          <div className="rev-widget-card" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div
              onClick={() => {
                if (profiles.length > 1) onLongPressAvatar?.();
                else onOpenProfile?.();
              }}
              style={{ position: 'relative', width: '46px', height: '46px', cursor: 'pointer' }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0EA5E9 0%, #3B28F6 100%)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {spaceInitials}
              </div>
              <span style={{
                position: 'absolute',
                right: '-2px',
                bottom: '-2px',
                width: '17px',
                height: '17px',
                borderRadius: '50%',
                background: 'var(--rev-card)',
                color: 'var(--rev-text)',
                fontSize: '10px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.16)',
              }}>
                A
              </span>
            </div>

            <span
              onClick={onOpenProfile}
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--rev-text)',
                margin: '8px 0',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {spaceDisplayName}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
              <button
                type="button"
                className="rev-widget-ghost-btn"
                onClick={onOpenLimits}
                aria-label="Topes y categorías"
              >
                <GitFork size={16} strokeWidth={2.1} />
              </button>

              <button
                type="button"
                className="rev-widget-round-btn"
                onClick={() => onQuickAction?.('expense')}
                aria-label="Añadir gasto"
              >
                <ArrowUp size={19} strokeWidth={2.4} />
              </button>

              <button
                type="button"
                className="rev-widget-ghost-btn"
                onClick={() => onQuickAction?.('income')}
                aria-label="Añadir ingreso"
              >
                <ArrowDown size={16} strokeWidth={2.1} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeOverview;
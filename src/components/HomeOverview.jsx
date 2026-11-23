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
  Search,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import NexoLogo from './NexoLogo';
import { useElasticScroll } from '../hooks/useElasticScroll';
import { triggerHaptic } from '../utils/haptics';

const HOME_TOKENS_CSS = `
  /* HERO BAND DARK (#000000 full-bleed) */
  .nx-hero-band {
    background-color: var(--canvas-dark);
    color: var(--on-dark);
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-xl) var(--sp-xxl);
    border-radius: var(--rounded-none);
    position: relative;
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
    background-color: var(--surface-elevated);
    border: 1px solid rgba(255, 255, 255, 0.16);
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
    background-color: var(--surface-elevated);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: 0 var(--sp-lg);
    color: var(--on-dark-mute);
  }
  .nx-search-pill input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: none;
    color: var(--on-dark);
    font-family: inherit;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.24px;
    min-width: 0;
  }
  .nx-search-pill input::placeholder {
    color: var(--on-dark-mute);
  }
  .nx-icon-circle {
    width: 36px;
    height: 36px;
    border-radius: var(--rounded-full);
    background-color: var(--surface-elevated);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--on-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .nx-hero-balance {
    text-align: center;
    margin-bottom: var(--sp-xl);
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
    color: var(--on-dark);
  }
  .nx-hero-dec {
    font-size: 28px;
    color: var(--on-dark-mute);
    margin-left: 2px;
  }
  .nx-hero-cta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-md);
    margin-bottom: var(--sp-xl);
  }
  .nx-hero-sub-pills {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-sm);
    flex-wrap: wrap;
  }

  /* CATALOGUE BAND (#FFFFFF in light mode, full-bleed slam) */
  .nx-catalogue-band {
    background-color: var(--bg-page);
    padding: var(--sp-xl) var(--sp-lg) var(--sp-xxl);
  }
  .nx-featured-banner {
    background-color: var(--primary);
    color: var(--on-primary);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-md);
    cursor: pointer;
    position: relative;
    margin-bottom: var(--sp-xl);
  }
  .nx-tx-catalogue-card {
    background-color: var(--bg-card);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xl);
    margin-bottom: var(--sp-xl);
  }
  .nx-widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-md);
  }
  .nx-widget-tile {
    background-color: var(--bg-card);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xl);
    border: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 172px;
    cursor: pointer;
    transition: transform 0.14s ease;
  }
  .nx-widget-tile:active {
    transform: scale(0.98);
  }
  .nx-mini-card {
    width: 66px;
    height: 42px;
    border-radius: var(--rounded-md);
    background-color: var(--canvas-dark);
    color: var(--on-dark);
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.14);
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

  const [promoDismissed, setPromoDismissed] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const scrollContainerRef = useRef(null);
  const longPressRef = useRef(null);
  const didLongPressRef = useRef(false);

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

  // Gráfico mensual del widget con curva suave y proyección discontinua
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
  const spaceDisplayName = secondarySpace?.name || 'Personal';
  const spaceInitials = spaceDisplayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
      <style>{HOME_TOKENS_CSS}</style>

      {/* BANDA 1: HERO BAND DARK (#000000 FULL-BLEED) */}
      <section className="nx-hero-band">
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
                onClick={() => onQueryChange?.('')}
                style={{ background: 'transparent', border: 0, color: 'var(--on-dark)', display: 'flex', padding: 0, cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button type="button" className="nx-icon-circle" onClick={onOpenMovements} aria-label="Cuentas">
            <CreditCard size={15} strokeWidth={2} />
          </button>
        </div>

        {/* DISPLAY BALANCE (WEIGHT 500, TIGHT NEGATIVE LETTER-SPACING) */}
        <div className="nx-hero-balance">
          <span className="nx-label" style={{ color: 'var(--on-dark-mute)', display: 'block' }}>
            {activeProfile?.name || 'Personal'} · {capitalizedMonth} {filters.year}
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

          <button type="button" className="nx-sub-nav-pill" onClick={onOpenMovements}>
            Cuentas
          </button>
        </div>

        {/* PRIMARY CTA: WHITE PILL ON BLACK + SECONDARY OUTLINE PILL */}
        <div className="nx-hero-cta-row">
          <button type="button" className="nx-btn-primary" onClick={() => onQuickAction?.('expense')}>
            <Plus size={16} strokeWidth={2.2} />
            <span>Añadir gasto</span>
          </button>

          <button type="button" className="nx-btn-outline-dark" onClick={() => onQuickAction?.('income')}>
            <span>+ Ingreso</span>
          </button>
        </div>

        {/* SUB-NAV PILLS */}
        <div className="nx-hero-sub-pills">
          <button type="button" className="nx-sub-nav-pill" onClick={onOpenLimits}>
            <ListChecks size={14} /> Topes
          </button>
          <button type="button" className="nx-sub-nav-pill" onClick={onOpenMovements}>
            <BarChart2 size={14} /> Análisis
          </button>
          <button type="button" className="nx-sub-nav-pill" onClick={onOpenProfile}>
            <MoreHorizontal size={14} /> Más
          </button>
        </div>
      </section>

      {/* BANDA 2: CATALOGUE BAND (#FFFFFF LIGHT / #000000 DARK, FULL-BLEED SLAM) */}
      <div className="nx-catalogue-band">
        {/* PLAN-CARD-FEATURED (#494fdf COBALT VIOLET) */}
        {!promoDismissed && (
          <div className="nx-featured-banner" onClick={onOpenProfile}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPromoDismissed(true);
              }}
              aria-label="Cerrar tarjeta"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderRadius: 'var(--rounded-full)',
                border: 0,
                background: 'rgba(255,255,255,0.16)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
            </button>

            <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 'var(--rounded-full)',
                  background: 'rgba(255, 255, 255, 0.18)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.24px',
                  marginBottom: '8px',
                }}
              >
                Espacios compartidos
              </span>
              <strong style={{ display: 'block', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em' }}>
                Comparte gastos con tu pareja o piso
              </strong>
              <small style={{ display: 'block', fontSize: '13px', opacity: 0.85, marginTop: '4px', lineHeight: 1.4 }}>
                Sincroniza movimientos en tiempo real entre cuentas.
              </small>
            </div>
          </div>
        )}

        {/* TARJETA DE TRANSACCIONES (rounded-lg: 20px, padding: 24px) */}
        <div className="nx-tx-catalogue-card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sp-md)',
          }}>
            <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Transacción</span>
            <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Importe</span>
          </div>

          {visibleTransactions.length > 0 ? (
            <>
              {visibleTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
              {monthlyTransactions.length > 4 && (
                <div style={{ textAlign: 'center', marginTop: 'var(--sp-md)' }}>
                  <button
                    type="button"
                    className="nx-btn-pill-sm"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => setShowAllTx((prev) => !prev)}
                  >
                    {showAllTx ? 'Mostrar menos' : 'Ver todo'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-mute)', textAlign: 'center', padding: 'var(--sp-xl) 0', margin: 0 }}>
              Sin movimientos en {monthName}. Desliza hacia los lados para cambiar de mes.
            </p>
          )}
        </div>

        {/* SECCIÓN WIDGETS 2x2 */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: '0 0 var(--sp-lg) 4px',
        }}>
          Widgets
        </h2>

        <div className="nx-widgets-grid">
          {/* WIDGET 1: GASTO ESTE MES */}
          <button type="button" className="nx-widget-tile" onClick={onOpenMovements}>
            <div>
              <span className="nx-label" style={{ color: 'var(--text-mute)', display: 'block' }}>
                Gasto este mes
              </span>
              <strong
                className="nx-display privacy-sensitive"
                style={{ fontSize: '22px', display: 'block', marginTop: '6px' }}
              >
                {displayMoney(totals.expenses)}
              </strong>
              <span
                className="nx-label privacy-sensitive"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  color: expenseDiff >= 0 ? 'var(--accent-deep-pink)' : 'var(--accent-teal)',
                }}
              >
                <span style={{ fontSize: '9px' }}>{expenseDiff >= 0 ? '▲' : '▼'}</span>
                {displayCompactMoney(Math.abs(expenseDiff))}
              </span>
            </div>

            <svg viewBox="0 0 140 46" preserveAspectRatio="none" style={{ width: '100%', height: '46px', marginTop: '12px', overflow: 'visible' }}>
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
                  <path d={spendWidgetChart.projectedArea} fill="url(#nxProjFill)" />
                  <path d={spendWidgetChart.projectedPath} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="3 3" />
                </>
              )}
              <path d={spendWidgetChart.actualArea} fill="url(#nxSpendFill)" />
              <path d={spendWidgetChart.actualPath} fill="none" stroke="#494fdf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* WIDGET 2: PATRIMONIO TOTAL (3 CÍRCULOS CON COLORES DE PRODUCTO) */}
          <button type="button" className="nx-widget-tile" onClick={onOpenProfile}>
            <div>
              <span className="nx-label" style={{ color: 'var(--text-mute)', display: 'block' }}>
                Patrimonio total
              </span>
              <strong
                className="nx-display privacy-sensitive"
                style={{ fontSize: '22px', display: 'block', marginTop: '6px' }}
              >
                {displayCompactMoney(totalWealth)}
              </strong>
              <span
                className="nx-label privacy-sensitive"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  color: available >= 0 ? 'var(--primary)' : 'var(--danger-red)',
                }}
              >
                <span style={{ fontSize: '9px' }}>{available >= 0 ? '▲' : '▼'}</span>
                {displayCompactMoney(Math.abs(available))}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }} aria-hidden="true">
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-light-blue)', border: '2.5px solid var(--bg-card)', zIndex: 3 }} />
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-brown)', border: '2.5px solid var(--bg-card)', marginLeft: '-8px', zIndex: 2 }} />
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-teal)', border: '2.5px solid var(--bg-card)', marginLeft: '-8px', zIndex: 1 }} />
            </div>
          </button>

          {/* WIDGET 3: TARJETA / PRIVACIDAD */}
          <div
            className="nx-widget-tile"
            onClick={() => {
              triggerHaptic();
              setIsAmountsHidden?.((prev) => !prev);
            }}
            style={{ alignItems: 'center', textAlign: 'center' }}
          >
            <div className="nx-mini-card" aria-hidden="true">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '7px', fontWeight: 600, letterSpacing: '0.24px' }}>NEXO</span>
                <span style={{ width: '9px', height: '7px', borderRadius: '2px', background: 'rgba(255,255,255,0.28)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-deep-pink)' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-orange)', marginLeft: '-3px' }} />
              </div>
            </div>

            <span className="nx-label" style={{ color: 'var(--text-main)', margin: '8px 0' }}>
              {isAmountsHidden ? 'Saldos ocultos' : 'Privacidad'}
            </span>

            <span
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--rounded-full)',
                backgroundColor: 'rgba(73, 79, 223, 0.14)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isAmountsHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          {/* WIDGET 4: ESPACIO RÁPIDO CON GLYPH NEXO */}
          <div className="nx-widget-tile" style={{ alignItems: 'center', textAlign: 'center' }}>
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
                borderRadius: 'var(--rounded-full)',
                backgroundColor: 'var(--accent-teal)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 500,
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
                width: '18px',
                height: '18px',
                borderRadius: 'var(--rounded-full)',
                backgroundColor: 'var(--canvas-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              }}>
                <NexoLogo size={11} />
              </span>
            </div>

            <span
              onClick={onOpenProfile}
              className="nx-label"
              style={{
                color: 'var(--text-main)',
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <button
                type="button"
                onClick={onOpenLimits}
                aria-label="Topes"
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: 0, background: 'transparent', color: 'var(--text-mute)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <GitFork size={16} />
              </button>

              <button
                type="button"
                onClick={() => onQuickAction?.('expense')}
                aria-label="Añadir gasto"
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: 0, background: 'rgba(73, 79, 223, 0.14)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ArrowUp size={18} />
              </button>

              <button
                type="button"
                onClick={() => onQuickAction?.('income')}
                aria-label="Añadir ingreso"
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: 0, background: 'transparent', color: 'var(--text-mute)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeOverview;
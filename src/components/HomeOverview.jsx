import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { useElasticScroll } from '../hooks/useElasticScroll';

const HomeOverview = ({ query = '', onOpenLimits }) => {
  const { transactions, filters } = useFinance();
  
  const [period, setPeriod] = useState('1M');
  const [scrubIndex, setScrubIndex] = useState(null);
  const chartRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Rebote elástico idéntico a Trade Republic
  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } = useElasticScroll(75, 0.35);
  
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(filters.year, filters.month));
  const yearName = filters.year;

  const activeTransactions = useMemo(() => {
    const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
    if (period === 'Máx') return transactions;
    if (period === '1A') return transactions.filter(tx => tx.date.startsWith(`${filters.year}-`));
    if (period === '1S') {
       return transactions.filter(tx => {
         if (!tx.date.startsWith(monthPrefix)) return false;
         const day = parseInt(tx.date.split('-')[2], 10);
         return day <= 7;
       });
    }
    if (period === '1D') {
       const today = new Date();
       const isCurrent = filters.year === today.getFullYear() && filters.month === today.getMonth();
       const targetDay = isCurrent ? String(today.getDate()).padStart(2, '0') : '01';
       return transactions.filter(tx => tx.date === `${monthPrefix}-${targetDay}`);
    }
    return transactions.filter(tx => tx.date.startsWith(monthPrefix));
  }, [transactions, filters, period]);

  const totals = useMemo(() => activeTransactions.reduce((acc, tx) => {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt) || amt <= 0) return acc;
    if (tx.type === 'Ingreso') acc.income += amt;
    if (tx.type === 'Gasto') acc.expenses += amt;
    return acc;
  }, { income: 0, expenses: 0 }), [activeTransactions]);

  const previousTotals = useMemo(() => {
    let prevTxs = [];
    if (period === '1A') {
       prevTxs = transactions.filter(tx => tx.date.startsWith(`${filters.year - 1}-`));
    } else if (period === '1M') {
       const d = new Date(filters.year, filters.month - 1, 1);
       const prevPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
       prevTxs = transactions.filter(tx => tx.date.startsWith(prevPrefix));
    } else if (period === '1S') {
       const d = new Date(filters.year, filters.month - 1, 1);
       const prevPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
       prevTxs = transactions.filter(tx => tx.date.startsWith(prevPrefix) && parseInt(tx.date.split('-')[2], 10) <= 7);
    } else if (period === '1D') {
       const today = new Date();
       if (filters.year === today.getFullYear() && filters.month === today.getMonth()) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const prevPrefix = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
          prevTxs = transactions.filter(tx => tx.date === prevPrefix);
       }
    }
    return prevTxs.reduce((acc, tx) => {
      const amt = Number(tx.amount);
      if (tx.type === 'Ingreso') acc.income += amt;
      if (tx.type === 'Gasto') acc.expenses += amt;
      return acc;
    }, { income: 0, expenses: 0 });
  }, [transactions, filters, period]);

  const chartSeries = useMemo(() => {
    const expenses = activeTransactions.filter(tx => tx.type === 'Gasto');
    let rawItems = [];

    if (period === '1D') {
      const totalDay = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
      rawItems = [
        { label: 'Inicio del día', value: 0 },
        { label: 'Cierre del día', value: totalDay }
      ];
    } else if (period === '1S') {
      const days = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'];
      const daily = Array(7).fill(0);
      expenses.forEach(tx => {
        const d = parseInt(tx.date.split('-')[2], 10);
        if (d >= 1 && d <= 7) daily[d - 1] += Number(tx.amount);
      });
      rawItems = days.map((label, idx) => ({ label, value: daily[idx] }));
    } else if (period === '1M') {
      const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
      const daily = Array(daysInMonth).fill(0);
      expenses.forEach(tx => {
        const d = parseInt(tx.date.split('-')[2], 10);
        if (d >= 1 && d <= daysInMonth) daily[d - 1] += Number(tx.amount);
      });
      rawItems = Array.from({ length: daysInMonth }, (_, idx) => {
        const dayNumber = idx + 1;
        return {
          label: `${dayNumber} de ${monthName}`,
          value: daily[idx]
        };
      });
    } else if (period === '1A') {
      const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthly = Array(12).fill(0);
      expenses.forEach(tx => {
        const m = parseInt(tx.date.split('-')[1], 10);
        if (m >= 1 && m <= 12) monthly[m - 1] += Number(tx.amount);
      });
      rawItems = monthNamesShort.map((m, idx) => ({
        label: `${m} ${yearName}`,
        value: monthly[idx]
      }));
    } else if (period === 'Máx') {
      const years = {};
      expenses.forEach(tx => {
        const y = tx.date.split('-')[0];
        years[y] = (years[y] || 0) + Number(tx.amount);
      });
      const sortedYears = Object.keys(years).sort();
      if (sortedYears.length === 0) {
        rawItems = [{ label: 'Sin registros', value: 0 }];
      } else if (sortedYears.length === 1) {
        rawItems = [
          { label: `Inicio ${sortedYears[0]}`, value: 0 },
          { label: sortedYears[0], value: years[sortedYears[0]] }
        ];
      } else {
        rawItems = sortedYears.map(y => ({ label: `Año ${y}`, value: years[y] }));
      }
    }

    let running = 0;
    const cumulativeItems = rawItems.map(item => {
      running += item.value;
      return {
        label: item.label,
        dailyValue: item.value,
        cumulativeValue: running
      };
    });

    const maxVal = cumulativeItems[cumulativeItems.length - 1]?.cumulativeValue || 0;
    const len = cumulativeItems.length;

    const coordinates = cumulativeItems.map((item, index) => {
      const x = len > 1 ? (index / (len - 1)) * 390 : 195;
      const y = maxVal > 0 ? 145 - (item.cumulativeValue / maxVal) * 125 : 145;
      return { x, y, ...item };
    });

    const path = coordinates.map((coord, idx) => (
      `${idx === 0 ? 'M' : 'L'}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`
    )).join(' ');

    return { coordinates, path, totalExpenses: maxVal };
  }, [activeTransactions, period, filters, monthName, yearName]);

  useEffect(() => {
    setScrubIndex(null);
  }, [period]);

  const scrubChart = (clientX) => {
    const element = chartRef.current;
    const count = chartSeries.coordinates.length;
    if (!element || count === 0) return;
    const { left, width } = element.getBoundingClientRect();
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    setScrubIndex(count > 1 ? Math.round(ratio * (count - 1)) : 0);
  };

  const handleChartKeyDown = (event) => {
    const count = chartSeries.coordinates.length;
    if (count === 0) return;
    const current = scrubIndex ?? count - 1;
    let next;
    if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
    else if (event.key === 'ArrowRight') next = Math.min(count - 1, current + 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else if (event.key === 'Escape') {
      event.stopPropagation();
      setScrubIndex(null);
      return;
    } else return;
    event.preventDefault();
    setScrubIndex(next);
  };

  const activePoint = scrubIndex !== null ? chartSeries.coordinates[scrubIndex] : null;

  const diffExpenses = totals.expenses - previousTotals.expenses;
  const diffExpensesPercent = previousTotals.expenses !== 0 ? (diffExpenses / previousTotals.expenses) * 100 : 0;
  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);
  const activeCategoriesCount = new Set(activeTransactions.filter(tx => tx.type === 'Gasto').map(tx => tx.category)).size;

  const latestExpenses = useMemo(() => 
    [...activeTransactions]
      .filter(tx => tx.type === 'Gasto')
      .filter(tx => `${tx.description || ''} ${tx.category}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
      .slice(0, 5),
  [activeTransactions, query]);

  const titleLabel = 
    period === '1D' ? 'Gastos del día' :
    period === '1S' ? 'Gastos de la semana' :
    period === '1M' ? `Gastos de ${monthName}` :
    period === '1A' ? `Gastos del año ${yearName}` :
    'Gastos históricos totales';

  const vsLabel = 
    period === '1D' ? 'frente a ayer' :
    period === '1A' ? 'frente al año pasado' :
    period === 'Máx' ? 'en toda la cuenta' :
    'frente al mes pasado';

  const displayedAmount = activePoint ? activePoint.cumulativeValue : totals.expenses;

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
      <section className="overview expenses">
        <div className="overview-label">
          <span>{activePoint ? activePoint.label : titleLabel}</span>
        </div>
        <div className="amount-line">
          <h1 className="privacy-sensitive">{displayMoney(displayedAmount)}</h1>
          {!activePoint && totals.expenses > 0 && period !== 'Máx' && diffExpenses !== 0 && (
            <span className={`change ${diffExpenses > 0 ? 'negative' : ''}`}>
              {diffExpenses > 0 ? '+' : ''}{diffExpensesPercent.toFixed(1)} %
            </span>
          )}
        </div>
        <p>{activePoint ? `Gasto del momento: ${displayMoney(activePoint.dailyValue)}` : vsLabel}</p>
      </section>

      <div className="periods" role="tablist" aria-label="Periodo de la gráfica">
        {['1D', '1S', '1M', '1A', 'Máx'].map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={period === item}
            className={period === item ? 'active' : ''}
            onClick={() => setPeriod(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="graph" aria-label="Gráfica interactiva de gastos" data-month-swipe-ignore>
        <div
          ref={chartRef}
          className="investment-chart-scrub"
          data-chart-scrub
          role="slider"
          tabIndex={0}
          aria-label="Gráfico interactivo de gastos"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, chartSeries.coordinates.length - 1)}
          aria-valuenow={scrubIndex ?? chartSeries.coordinates.length - 1}
          onPointerDown={(event) => {
            if (event.pointerType !== 'mouse') event.currentTarget.setPointerCapture?.(event.pointerId);
            scrubChart(event.clientX);
          }}
          onPointerMove={(event) => {
            if (scrubIndex !== null || event.buttons > 0) scrubChart(event.clientX);
          }}
          onPointerUp={(event) => {
            if (event.pointerType !== 'mouse') setScrubIndex(null);
          }}
          onPointerCancel={() => setScrubIndex(null)}
          onPointerLeave={() => setScrubIndex(null)}
          onKeyDown={handleChartKeyDown}
          onBlur={() => setScrubIndex(null)}
        >
          <svg viewBox="0 0 390 190" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {activePoint && (
                <clipPath id="expenses-scrub-clip">
                  <rect x="0" y="-20" width={activePoint.x} height="230" />
                </clipPath>
              )}
            </defs>
            <path className="baseline" d="M0 145H390" />
            
            {activePoint && (
              <path
                className="spend-line negative"
                d={chartSeries.path}
                style={{ opacity: 0.28 }}
              />
            )}
            
            <path
              className="spend-line negative"
              d={chartSeries.path}
              clipPath={activePoint ? 'url(#expenses-scrub-clip)' : undefined}
            />
          </svg>

          {activePoint && (
            <span
              aria-hidden="true"
              className="investment-chart-cursor"
              style={{ left: `${(activePoint.x / 390) * 100}%` }}
            />
          )}

          {activePoint && (
            <span
              aria-hidden="true"
              className="investment-chart-dot negative active"
              style={{
                left: `${(activePoint.x / 390) * 100}%`,
                top: `${(activePoint.y / 190) * 100}%`,
              }}
            />
          )}
        </div>
      </section>

      <section className="summary-grid">
        <button type="button">
          <span>Gastos</span>
          <strong className="privacy-sensitive" style={{ color: '#e74c3c' }}>{displayMoney(totals.expenses)}</strong>
        </button>
        <button type="button">
          <span>Disponible</span>
          <strong className="privacy-sensitive" style={{ color: 'green' }}>{displayMoney(totals.income - totals.expenses)}</strong>
        </button>
        <button type="button" onClick={onOpenLimits}>
          <span>Categorías activas</span>
          <strong>{activeCategoriesCount}</strong>
        </button>
      </section>

      <section className="movements">
        <div className="section-title home-transactions">
          <h2>Transacciones</h2>
        </div>
        <div className="movement-list">
          {latestExpenses.map((expense) => (
            <TransactionItem key={expense.id} transaction={expense} layout="list" />
          ))}
          {latestExpenses.length === 0 && (
             <p style={{fontSize: '12px', color: '#999', marginTop: '10px'}}>Aún no hay gastos registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomeOverview;

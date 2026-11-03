import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';

const HomeOverview = ({ query = '', onOpenLimits }) => {
  const { transactions, filters } = useFinance();
  
  const [period, setPeriod] = useState('1M'); 
  
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

  const graphPath = useMemo(() => {
    const expenses = activeTransactions.filter(tx => tx.type === 'Gasto');
    if (expenses.length === 0) return 'M0 145 L390 145';

    let dataPoints = [];
    
    if (period === '1D') {
       dataPoints = [0, expenses.reduce((sum, tx) => sum + Number(tx.amount), 0)];
    } else if (period === '1S') {
       const daily = Array(7).fill(0);
       expenses.forEach(tx => {
          const d = parseInt(tx.date.split('-')[2], 10);
          if (d >= 1 && d <= 7) daily[d-1] += Number(tx.amount);
       });
       dataPoints = daily;
    } else if (period === '1M') {
       const totalSteps = new Date(filters.year, filters.month + 1, 0).getDate();
       const daily = Array(totalSteps).fill(0);
       expenses.forEach(tx => {
          const d = parseInt(tx.date.split('-')[2], 10);
          if (d >= 1 && d <= totalSteps) daily[d-1] += Number(tx.amount);
       });
       dataPoints = daily;
    } else if (period === '1A') {
       const monthly = Array(12).fill(0);
       expenses.forEach(tx => {
          const m = parseInt(tx.date.split('-')[1], 10);
          if (m >= 1 && m <= 12) monthly[m-1] += Number(tx.amount);
       });
       dataPoints = monthly;
    } else if (period === 'Máx') {
       const years = {};
       expenses.forEach(tx => {
          const y = tx.date.split('-')[0];
          years[y] = (years[y] || 0) + Number(tx.amount);
       });
       const sortedYears = Object.keys(years).sort();
       if (sortedYears.length === 1) dataPoints = [0, years[sortedYears[0]]];
       else dataPoints = sortedYears.map(y => years[y]);
    }

    let running = 0;
    const cumulative = dataPoints.map(val => {
       running += val;
       return running;
    });

    const maxVal = cumulative[cumulative.length - 1] || 1;
    const points = [];
    
    for (let i = 0; i < cumulative.length; i++) {
      const x = (i / Math.max(1, cumulative.length - 1)) * 390;
      const y = 145 - (cumulative[i] / maxVal) * 130;
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [activeTransactions, period, filters]);

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
    period === '1S' ? 'Gastos de la 1ª semana' :
    period === '1M' ? `Gastos del mes de ${monthName}` :
    period === '1A' ? `Gastos del año ${yearName}` :
    'Gastos históricos totales';

  const vsLabel = 
    period === '1D' ? 'frente a ayer' :
    period === '1A' ? 'frente al año pasado' :
    period === 'Máx' ? 'en toda la cuenta' :
    'frente al mes pasado';

  // Texto entre paréntesis para la sección inferior:
  const sectionPeriodTag = 
    period === '1M' ? monthName : 
    period === '1A' ? yearName : 
    period === 'Máx' ? 'Total' : 
    period;

  return (
    <>
      <section className="overview expenses">
        <div className="overview-label">
          <span>{titleLabel}</span>
          <button aria-label="Cambiar mes">⌄</button>
        </div>
        <div className="amount-line">
          <h1 className="privacy-sensitive">{displayMoney(totals.expenses)}</h1>
          {totals.expenses > 0 && period !== 'Máx' && diffExpenses !== 0 && (
            <span className={`change ${diffExpenses > 0 ? 'negative' : ''}`}>
              {diffExpenses > 0 ? '+' : ''}{diffExpensesPercent.toFixed(1)} %
            </span>
          )}
        </div>
        <p>{vsLabel}</p>
      </section>

      <div className="periods" role="tablist" aria-label="Periodo de la gráfica">
        {['1D', '1S', '1M', '1A', 'Máx'].map((item) => (
          <button
            key={item}
            className={period === item ? 'active' : ''}
            onClick={() => setPeriod(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="graph" aria-label="Gráfica de gastos">
        <svg viewBox="0 0 390 190" preserveAspectRatio="none">
          <path className="baseline" d="M0 145H390" />
          <path
            className="spend-line"
            d={graphPath}
            style={{ transition: 'd 0.3s ease' }}
          />
        </svg>
      </section>

      <section className="summary-grid">
        <button>
          <span>Gastos</span>
          <strong className="privacy-sensitive">{displayMoney(totals.expenses)}</strong>
        </button>
        <button>
          <span>Disponible</span>
          <strong className="privacy-sensitive">{displayMoney(totals.income - totals.expenses)}</strong>
        </button>
        <button onClick={onOpenLimits}>
          <span>Categorías activas</span>
          <strong>{activeCategoriesCount}</strong>
        </button>
      </section>

      <section className="movements">
        <div className="section-title">
          {/* AHORA MUESTRA EL NOMBRE DEL MES (EJ: ÚLTIMOS GASTOS (NOVIEMBRE)) */}
          <h2>Últimos gastos ({sectionPeriodTag})</h2>
          <button>Ordenar por ⌄</button>
        </div>
        <div className="movement-list">
          {latestExpenses.map((expense) => (
            <TransactionItem key={expense.id} transaction={expense} layout="list" />
          ))}
          {latestExpenses.length === 0 && (
             <p style={{fontSize: '9px', color: '#999', marginTop: '10px'}}>Aún no hay gastos registrados.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default HomeOverview;
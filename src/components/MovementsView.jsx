import React, { useMemo, useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { useElasticScroll } from '../hooks/useElasticScroll';

const MovementsView = ({ query = '' }) => {
  const { transactions, filters, categoryLimits, activeProfileId } = useFinance();
  const [period, setPeriod] = useState('1M');
  const scrollContainerRef = useRef(null);

  // Hook con amortiguación suave de 75px
  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } = useElasticScroll(75, 0.35);

  const effectiveLimits = useMemo(() => {
    try {
      const storageKey = `balance-category-limits-${activeProfileId || 'default'}`;
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { ...saved, ...(categoryLimits || {}) };
    } catch {
      return categoryLimits || {};
    }
  }, [categoryLimits, activeProfileId]);

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  
  const monthlyTransactions = useMemo(
    () => transactions.filter((tx) => typeof tx.date === 'string' && tx.date.startsWith(monthPrefix)),
    [transactions, monthPrefix]
  );

  const totals = useMemo(() => monthlyTransactions.reduce((acc, tx) => {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt) || amt <= 0) return acc;
    if (tx.type === 'Ingreso') acc.income += amt;
    if (tx.type === 'Gasto') acc.expenses += amt;
    return acc;
  }, { income: 0, expenses: 0 }), [monthlyTransactions]);

  const categoryMetrics = useMemo(() => {
    const historical = {};
    monthlyTransactions
      .filter((tx) => tx.type === 'Gasto')
      .forEach((tx) => {
        historical[tx.category] = (historical[tx.category] || 0) + Number(tx.amount);
      });
    return Object.entries(historical)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);

  const visibleTransactions = useMemo(() => 
    monthlyTransactions
      .filter((tx) => `${tx.description || ''} ${tx.category}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))),
  [monthlyTransactions, query]);

  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);
  const available = totals.income - totals.expenses;
  const savingsPercent = totals.income > 0 ? (available / totals.income) * 100 : 0;

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
      <section className="overview movements">
        <div className="overview-label">
          <span>Disponible {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(filters.year, filters.month))}</span>
        </div>
        <div className="amount-line">
          <h1 className="privacy-sensitive">{displayMoney(available)}</h1>
          <span className={`change ${savingsPercent < 0 ? 'negative' : ''}`}>
            {savingsPercent > 0 ? '+' : ''}{savingsPercent.toFixed(1)} %
          </span>
        </div>
      </section>

      
      <section className="summary-grid mt-6">
        <button>
          <span>Ingresos</span>
          <strong className="positive privacy-sensitive">{displayMoney(totals.income)}</strong>
        </button>
        <button>
          <span>Gastos</span>
          <strong className="privacy-sensitive" style={{ color: '#df242b' }}>{displayMoney(totals.expenses)}</strong>
        </button>
        <button>
          <span>Ahorro</span>
          <strong className="privacy-sensitive">{displayMoney(available)}</strong>
        </button>
      </section>

      <section className="graph category-graph">
        <div className="category-metrics">
          <div className="category-metrics-title">
            <strong>Gastos por categoría</strong>
            <span className="privacy-sensitive">{displayMoney(totals.expenses)}</span>
          </div>
          
          {categoryMetrics.length > 0 ? categoryMetrics.slice(0, 5).map((category) => {
            const rawLimit = effectiveLimits?.[category.name];
            const limit = Number(rawLimit) > 0 ? Number(rawLimit) : 0;
            const exceeded = limit > 0 && category.amount > limit;
            const percentage = limit > 0 
              ? Math.min(100, Math.round((category.amount / limit) * 100)) 
              : (totals.expenses > 0 ? Math.min(100, (category.amount / totals.expenses) * 100) : 0);

            return (
              <div className={`category-metric ${exceeded ? "exceeded" : ""}`} key={category.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{category.name}</strong>
                  <strong
                    className="privacy-sensitive"
                    style={{ whiteSpace: 'nowrap', color: exceeded ? '#df242b' : undefined }}
                  >
                    {displayMoney(category.amount)}
                    {limit > 0 && (
                      <span style={{ color: '#888', fontWeight: 500 }}>
                        {' / '}{displayMoney(limit)}
                      </span>
                    )}
                  </strong>
                </div>
                <i>
                  <b 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: exceeded ? '#df242b' : undefined,
                      transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }} 
                  />
                </i>
              </div>
            );
          }) : (
            <p style={{fontSize: '12px', color: '#999', marginTop: '10px'}}>Aún no hay gastos registrados este mes.</p>
          )}
        </div>
      </section>

      <section className="movements">
        <div className="section-title">
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>Todos los movimientos</h2>
        </div>
        <div className="movement-list">
          {visibleTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} layout="list" />
          ))}
          {visibleTransactions.length === 0 && (
             <p style={{fontSize: '12px', color: '#999', marginTop: '10px', textAlign: 'left'}}>No se encontraron movimientos.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MovementsView;
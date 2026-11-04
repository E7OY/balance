import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { useElasticScroll } from '../hooks/useElasticScroll';

const MovementsView = ({ query = '' }) => {
  const { transactions, investmentRecords, filters, categoryLimits, activeProfileId } = useFinance();
  const [period, setPeriod] = useState('1M');
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [summaryType, setSummaryType] = useState(null);
  const [analysisMonth, setAnalysisMonth] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const analysisSwipeStart = useRef(null);
  const [analysisSwipeY, setAnalysisSwipeY] = useState(0);
  const [isAnalysisDragging, setIsAnalysisDragging] = useState(false);
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
  const summaryTransactions = useMemo(() => (
    summaryType
      ? monthlyTransactions
        .filter((transaction) => transaction.type === summaryType)
        .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
      : []
  ), [monthlyTransactions, summaryType]);

  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);
  const available = totals.income - totals.expenses;
  const savingsPercent = totals.income > 0 ? (available / totals.income) * 100 : 0;
  const analysisMonths = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(filters.year, filters.month - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).replace('.', ''),
    };
  }), [filters.year, filters.month]);
  const displayedAnalysisMonth = analysisMonth || analysisMonths[analysisMonths.length - 1]?.key;
  const analysisTotals = useMemo(() => {
    const monthTransactions = transactions.filter(
      (transaction) => typeof transaction.date === 'string' && transaction.date.startsWith(displayedAnalysisMonth),
    );
    return {
      income: monthTransactions.reduce((sum, transaction) => (
        transaction.type === 'Ingreso' ? sum + (Number(transaction.amount) || 0) : sum
      ), 0),
      expenses: monthTransactions.reduce((sum, transaction) => (
        transaction.type === 'Gasto' ? sum + (Number(transaction.amount) || 0) : sum
      ), 0),
      investments: (investmentRecords || []).reduce((sum, record) => (
        typeof record.date === 'string' && record.date.startsWith(displayedAnalysisMonth)
          ? sum + (Number(record.investedAmount) || 0)
          : sum
      ), 0),
    };
  }, [transactions, investmentRecords, displayedAnalysisMonth]);
  const analysisBubbles = [
    { key: 'income', label: 'Ingresos', value: analysisTotals.income, color: 'income' },
    { key: 'expenses', label: 'Gastos', value: analysisTotals.expenses, color: 'expenses' },
    { key: 'investments', label: 'Inversiones', value: analysisTotals.investments, color: 'investments' },
  ];
  const largestAnalysisValue = Math.max(...analysisBubbles.map(({ value }) => value), 0);
  const selectedAnalysisBubble = analysisBubbles.find(({ key }) => key === selectedAnalysisType);
  const selectedAnalysisItems = useMemo(() => {
    if (selectedAnalysisType === 'investments') {
      return (investmentRecords || [])
        .filter((record) => typeof record.date === 'string' && record.date.startsWith(displayedAnalysisMonth))
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    const transactionType = selectedAnalysisType === 'income' ? 'Ingreso' : 'Gasto';
    return transactions
      .filter((transaction) => (
        transaction.type === transactionType
        && typeof transaction.date === 'string'
        && transaction.date.startsWith(displayedAnalysisMonth)
      ))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
  }, [selectedAnalysisType, transactions, investmentRecords, displayedAnalysisMonth]);

  useEffect(() => {
    if (!isAnalysisOpen && !summaryType) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAnalysisOpen(false);
        setSummaryType(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isAnalysisOpen, summaryType]);

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
            <span className="change-icon" aria-hidden="true">
              {savingsPercent < 0 ? '↘' : '↗'}
            </span>
            {savingsPercent > 0 ? '+' : ''}{savingsPercent.toFixed(2)}%
          </span>
        </div>
      </section>

      
      <section className="summary-grid mt-6">
        <button type="button" onClick={() => setSummaryType('Ingreso')}>
          <span>Ingresos</span>
          <strong className="positive privacy-sensitive">{displayMoney(totals.income)}</strong>
        </button>
        <button type="button" onClick={() => setSummaryType('Gasto')}>
          <span>Gastos</span>
          <strong className="privacy-sensitive" style={{ color: '#df242b' }}>{displayMoney(totals.expenses)}</strong>
        </button>
        <button
          type="button"
          className="movement-analysis-trigger"
          onClick={() => {
            setAnalysisMonth(monthPrefix);
            setIsAnalysisOpen(true);
          }}
          aria-haspopup="dialog"
          aria-label="Abrir análisis mensual"
        >
          <span className="movement-analysis-title">Análisis</span>
          <span className="movement-analysis-bubbles" aria-hidden="true">
            <i className="income" />
            <i className="expenses" />
            <i className="investments" />
          </span>
        </button>
      </section>

      {summaryType && createPortal((
        <div
          className="movement-summary-layer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSummaryType(null);
          }}
        >
          <section
            className="movement-summary-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-summary-title"
          >
            <div className="sheet-handle" />
            <button
              type="button"
              className="sheet-close"
              onClick={() => setSummaryType(null)}
              aria-label="Cerrar detalle"
            >
              ×
            </button>
            <p className="detail-kicker">
              {summaryType === 'Ingreso' ? 'RESUMEN DE INGRESOS' : 'RESUMEN DE GASTOS'}
            </p>
            <h2 id="movement-summary-title">
              {summaryType === 'Ingreso' ? 'Todos los ingresos' : 'Todos los gastos'}
            </h2>
            <strong className={`detail-amount ${summaryType === 'Ingreso' ? 'income' : 'expense'}`}>
              {displayMoney(summaryType === 'Ingreso' ? totals.income : totals.expenses)}
            </strong>
            <div className="movement-summary-list">
              {summaryTransactions.length > 0 ? summaryTransactions.map((transaction) => (
                <div className="movement-summary-row" key={transaction.id}>
                  <span className={`movement-summary-icon ${summaryType === 'Ingreso' ? 'income' : 'expense'}`}>
                    {summaryType === 'Ingreso' ? '+' : '−'}
                  </span>
                  <span className="movement-summary-info">
                    <strong>{transaction.description || transaction.category}</strong>
                    <small>{transaction.category} · {transaction.date}</small>
                  </span>
                  <strong className={`movement-summary-amount ${summaryType === 'Ingreso' ? 'income' : 'expense'} privacy-sensitive`}>
                    {summaryType === 'Ingreso' ? '+' : '−'}{displayMoney(Number(transaction.amount) || 0)}
                  </strong>
                </div>
              )) : (
                <p className="movement-summary-empty">
                  No hay {summaryType === 'Ingreso' ? 'ingresos' : 'gastos'} registrados este mes.
                </p>
              )}
            </div>
          </section>
        </div>
      ), document.body)}

      {isAnalysisOpen && createPortal((
        <div
          className="analysis-layer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsAnalysisOpen(false);
          }}
        >
          <section
            className={`analysis-sheet ${isAnalysisDragging ? 'is-swiping' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="analysis-title"
            style={{ transform: `translateY(${analysisSwipeY}px)` }}
            onTouchStart={(event) => {
              const sheet = event.currentTarget;
              if (sheet.scrollTop > 0 || event.touches.length !== 1) {
                analysisSwipeStart.current = null;
                setIsAnalysisDragging(false);
                return;
              }
              analysisSwipeStart.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              };
              setIsAnalysisDragging(true);
            }}
            onTouchMove={(event) => {
              const start = analysisSwipeStart.current;
              if (!start || event.touches.length !== 1 || event.currentTarget.scrollTop > 0) return;
              const deltaX = event.touches[0].clientX - start.x;
              const deltaY = event.touches[0].clientY - start.y;
              if (deltaY > 0 && deltaY > Math.abs(deltaX)) {
                setAnalysisSwipeY(deltaY);
              }
            }}
            onTouchEnd={(event) => {
              const start = analysisSwipeStart.current;
              analysisSwipeStart.current = null;
              setIsAnalysisDragging(false);
              if (!start || event.changedTouches.length !== 1) return;
              const deltaY = event.changedTouches[0].clientY - start.y;
              const deltaX = event.changedTouches[0].clientX - start.x;
              if (deltaY > 90 && deltaY > Math.abs(deltaX) * 1.2) {
                setAnalysisSwipeY(window.innerHeight);
                window.setTimeout(() => setIsAnalysisOpen(false), 220);
              } else {
                setAnalysisSwipeY(0);
              }
            }}
            onTouchCancel={() => {
              analysisSwipeStart.current = null;
              setIsAnalysisDragging(false);
              setAnalysisSwipeY(0);
            }}
          >
            <div className="analysis-handle" />
            <header className="analysis-header">
              <h2 id="analysis-title">Análisis</h2>
              <p>Sigue tus gastos, tus inversiones y tus ingresos</p>
            </header>

            <div className="analysis-months" role="tablist" aria-label="Mes del análisis">
              {analysisMonths.map((month) => (
                <button
                  key={month.key}
                  type="button"
                  role="tab"
                  aria-selected={displayedAnalysisMonth === month.key}
                  className={displayedAnalysisMonth === month.key ? 'active' : ''}
                  onClick={() => {
                    setAnalysisMonth(month.key);
                    setSelectedAnalysisType(null);
                  }}
                >
                  {month.label}
                </button>
              ))}
            </div>

            <div className="analysis-bubble-chart" role="group" aria-label="Gráfico de burbujas del mes">
              {analysisBubbles.map((bubble) => {
                const scale = largestAnalysisValue > 0
                  ? Math.sqrt(bubble.value / largestAnalysisValue)
                  : 0;
                const size = Math.round(92 + scale * 58);
                return (
                  <button
                    key={bubble.key}
                    className={`analysis-bubble ${bubble.color} ${bubble.value === 0 ? 'empty' : ''}`}
                    style={{ '--bubble-size': `${size}px` }}
                    aria-label={`${bubble.label}: ${displayMoney(bubble.value)}`}
                    aria-pressed={selectedAnalysisType === bubble.key}
                    onClick={() => setSelectedAnalysisType((current) => (
                      current === bubble.key ? null : bubble.key
                    ))}
                  >
                    <strong className="privacy-sensitive">{displayMoney(bubble.value)}</strong>
                    <span>{bubble.label}</span>
                  </button>
                );
              })}
            </div>

            <section className="analysis-categories" aria-label="Totales por tipo">
              <h3>{selectedAnalysisBubble?.label || 'Categorías'}</h3>
              {selectedAnalysisType ? (
                selectedAnalysisItems.length > 0 ? selectedAnalysisItems.map((item) => {
                  const isInvestment = selectedAnalysisType === 'investments';
                  const amount = isInvestment ? item.investedAmount : item.amount;
                  const label = isInvestment ? item.name : (item.description || item.category);
                  const detail = isInvestment
                    ? (item.asset?.symbol || item.date)
                    : `${item.category} · ${item.date}`;
                  return (
                    <div className="analysis-category" key={item.id}>
                      <i className={selectedAnalysisBubble.color} aria-hidden="true" />
                      <span className="analysis-category-detail">
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </span>
                      <strong className="privacy-sensitive">
                        {selectedAnalysisType === 'income' ? '+' : selectedAnalysisType === 'expenses' ? '−' : ''}
                        {displayMoney(Number(amount) || 0)}
                      </strong>
                    </div>
                  );
                }) : (
                  <p className="analysis-empty">
                    No hay {selectedAnalysisBubble.label.toLowerCase()} en este mes.
                  </p>
                )
              ) : (
                analysisBubbles.map((bubble) => (
                  <div className="analysis-category" key={bubble.key}>
                    <i className={bubble.color} aria-hidden="true" />
                    <span>{bubble.label}</span>
                    <strong className="privacy-sensitive">{displayMoney(bubble.value)}</strong>
                  </div>
                ))
              )}
            </section>
          </section>
        </div>
      ), document.body)}

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
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';

function Icon({ name, size = 17 }) {
  const paths = { chevron: <path d="m9 7 5 5-5 5" /> };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 7 5 5-5 5" /></svg>;
}

const getAssetTone = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('bitcoin') || n.includes('btc') || n.includes('crypto')) return 'bitcoin';
  if (n.includes('apple') || n.includes('aapl')) return 'apple';
  return 'world'; 
};

const getAssetLogo = (name = '', symbol = '') => {
  if (symbol === 'BTC') return '₿';
  if (symbol) return symbol.slice(0, 1).toUpperCase();
  if (name) return name.slice(0, 1).toUpperCase();
  return 'I';
};

const InvestmentsOverview = ({ query = '' }) => {
  const { investmentRecords } = useFinance();
  const [period, setPeriod] = useState('1M');
  
  const totals = useMemo(() => investmentRecords.reduce((result, record) => {
    const invested = Number(record.investedAmount) || 0;
    const current = Number(record.currentValue) || 0;
    result.invested += invested;
    result.currentValue += current;
    return result;
  }, { invested: 0, currentValue: 0 }), [investmentRecords]);

  // Aplicar el filtro de búsqueda
  const visibleInvestments = useMemo(() => {
    if (!query.trim()) return investmentRecords;
    const q = query.toLowerCase();
    return investmentRecords.filter((record) => 
      record.name.toLowerCase().includes(q) || 
      (record.asset?.symbol || '').toLowerCase().includes(q)
    );
  }, [investmentRecords, query]);

  const performance = totals.currentValue - totals.invested;
  const performancePercent = totals.invested > 0 ? (performance / totals.invested) * 100 : 0;
  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);
  
  return (
    <>
      <section className="overview investments">
        <div className="overview-label">
          <span>Valor de la cartera</span>
          <button aria-label="Cambiar divisa">⌄</button>
        </div>
        <div className="amount-line">
          <h1 className="privacy-sensitive">{displayMoney(totals.currentValue)}</h1>
          {totals.invested > 0 && (
             <span className={`change ${performance < 0 ? 'negative' : ''}`}>
               {performance > 0 ? '+' : ''}{performancePercent.toFixed(2)} %
             </span>
          )}
        </div>
        <p>Rentabilidad desde el inicio</p>
      </section>

      <div className="periods" role="tablist" aria-label="Periodo de la gráfica">
        {["1D", "1S", "1M", "1A", "Máx"].map((item) => (
          <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>
        ))}
      </div>

      <section className="graph" aria-label="Inversiones">
        <svg viewBox="0 0 390 190" preserveAspectRatio="none">
          <path className="baseline" d="M0 145H390" />
          <path className="spend-line" d="M0 162 L12 128 L24 115 L36 109 L48 119 L60 86 L72 78 L84 96 L96 91 L108 80 L120 104 L132 88 L144 93 L156 79 L168 108 L180 120 L192 111 L204 125 L216 118 L228 96 L240 82 L252 104 L264 88 L276 64 L288 73 L300 47 L312 66 L324 40 L336 57 L348 29 L360 43 L374 20 L390 31" />
        </svg>
      </section>

      <section className="summary-grid">
        <button>
          <span>Capital invertido</span>
          <strong className="privacy-sensitive">{displayMoney(totals.invested)}</strong>
        </button>
        <button>
          <span>Rentabilidad</span>
          <strong className={`privacy-sensitive ${performance >= 0 ? 'positive' : 'negative'}`}>
            {performance > 0 ? '+' : ''}{displayMoney(performance)}
          </strong>
        </button>
        <button>
          <span>Posiciones</span>
          <strong>{visibleInvestments.length}</strong>
        </button>
      </section>

      <section className="movements portfolio">
        <div className="section-title">
          <h2>Inversiones</h2>
          <button>Ordenar por ⌄</button>
        </div>
        <div className="movement-list">
          {visibleInvestments.map((record) => {
            const diff = Number(record.currentValue) - Number(record.investedAmount);
            const diffPercent = Number(record.investedAmount) > 0 ? (diff / Number(record.investedAmount)) * 100 : 0;
            const tone = getAssetTone(record.asset?.name || record.name);
            const logo = getAssetLogo(record.asset?.name || record.name, record.asset?.symbol);

            return (
              <button className="movement" key={record.id}>
                <span className={`asset-logo ${tone}`}>{logo}</span>
                <span className="movement-info">
                  <strong>{record.name}</strong>
                  <small>{record.asset?.symbol || 'Activo manual'}</small>
                </span>
                <span className="holding-value">
                  <strong className="privacy-sensitive">{displayMoney(Number(record.currentValue))}</strong>
                  <small className={diff < 0 ? 'negative' : ''}>
                    {diff > 0 ? '+' : ''}{diffPercent.toFixed(2)} %
                  </small>
                </span>
                <Icon name="chevron" size={14} />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default InvestmentsOverview;
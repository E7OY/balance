import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetIcon from './InvestmentAssetIcon';
import { getInvestmentHistory } from '../utils/investmentMarketData';

const periods = ['1D', '1S', '1M', '1A', 'Máx'];
const periodDurations = {
  '1D': 24 * 60 * 60 * 1000,
  '1S': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '1A': 365 * 24 * 60 * 60 * 1000,
};

const displayMoney = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
}).format(value);

const getPriceAt = (points, timestamp) => {
  let low = 0;
  let high = points.length - 1;
  let match = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (Date.parse(points[middle].timestamp) <= timestamp) {
      match = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return match >= 0 ? Number(points[match].price) : null;
};

const downsample = (points, limit = 120) => {
  if (points.length <= limit) return points;
  const step = (points.length - 1) / (limit - 1);
  return Array.from({ length: limit }, (_, index) => points[Math.round(index * step)]);
};

const InvestmentsOverview = ({ query = '' }) => {
  const { investmentRecords } = useFinance();
  const [period, setPeriod] = useState('1M');
  const [historyByAsset, setHistoryByAsset] = useState({});
  const [historyError, setHistoryError] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const marketAssets = useMemo(() => [...new Map(
    investmentRecords
      .filter((record) => record.asset?.provider && record.asset?.id)
      .map((record) => [`${record.asset.provider}:${record.asset.id}`, record.asset]),
  ).values()], [investmentRecords]);
  const assetSignature = marketAssets.map((asset) => `${asset.provider}:${asset.id}`).join('|');

  const totals = useMemo(() => investmentRecords.reduce((result, record) => {
    result.invested += Number(record.investedAmount) || 0;
    result.currentValue += Number(record.currentValue) || 0;
    return result;
  }, { invested: 0, currentValue: 0 }), [investmentRecords]);

  const visibleInvestments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    if (!normalizedQuery) return investmentRecords;
    return investmentRecords.filter((record) => (
      (record.name || '').toLocaleLowerCase('es').includes(normalizedQuery)
      || (record.asset?.symbol || '').toLocaleLowerCase('es').includes(normalizedQuery)
    ));
  }, [investmentRecords, query]);

  useEffect(() => {
    if (!marketAssets.length) {
      setHistoryByAsset({});
      setHistoryError('');
      setIsLoadingHistory(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    const requestedPeriod = period === 'Máx' ? 'TODO' : period;
    setHistoryByAsset({});
    setHistoryError('');
    setIsLoadingHistory(true);

    Promise.allSettled(marketAssets.map(async (asset) => {
      const key = `${asset.provider}:${asset.id}`;
      const points = await getInvestmentHistory(asset, requestedPeriod, controller.signal);
      return [key, points];
    })).then((entries) => {
      if (!active) return;
      const succeeded = entries
        .filter((entry) => entry.status === 'fulfilled')
        .map((entry) => entry.value);
      const failures = entries
        .filter((entry) => entry.status === 'rejected' && entry.reason?.name !== 'AbortError')
        .map((entry) => entry.reason?.message)
        .filter(Boolean);
      setHistoryByAsset(Object.fromEntries(succeeded));
      if (failures.length) setHistoryError(failures.join(' '));
    }).finally(() => {
      if (active) setIsLoadingHistory(false);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [assetSignature, period]);

  const chartPoints = useMemo(() => {
    const hasManualRecords = investmentRecords.some((record) => !record.asset);
    const hasMarketPoints = Object.values(historyByAsset).some((points) => points.length > 0);
    if (!hasManualRecords && !hasMarketPoints) return [];

    const now = Date.now();
    const start = period === 'Máx'
      ? Math.min(...investmentRecords.map((record) => Date.parse(`${record.date}T00:00:00`)).filter(Number.isFinite), now)
      : now - periodDurations[period];
    const marketTimestamps = Object.values(historyByAsset)
      .flat()
      .map((point) => Date.parse(point.timestamp))
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= start && timestamp <= now);
    const manualTimestamps = investmentRecords
      .filter((record) => !record.asset)
      .map((record) => Date.parse(`${record.date}T00:00:00`))
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= start && timestamp <= now);
    const chartStart = marketTimestamps.length ? Math.min(...marketTimestamps) : start;
    const timestamps = [...new Set([chartStart, ...marketTimestamps, ...manualTimestamps, now])]
      .sort((a, b) => a - b);

    const points = timestamps.map((timestamp) => {
      const value = investmentRecords.reduce((total, record) => {
        const purchaseDate = Date.parse(`${record.date}T00:00:00`);
        if (!Number.isFinite(purchaseDate) || timestamp < purchaseDate) return total;

        if (!record.asset) return total + (Number(record.currentValue) || 0);

        const key = `${record.asset.provider}:${record.asset.id}`;
        const price = getPriceAt(historyByAsset[key] || [], timestamp);
        if (price === null || !Number.isFinite(Number(record.units))) return total;
        return total + price * Number(record.units);
      }, 0);
      return { timestamp, value };
    });

    return downsample(points);
  }, [historyByAsset, investmentRecords, period]);

  const performance = totals.currentValue - totals.invested;
  const performancePercent = totals.invested > 0 ? (performance / totals.invested) * 100 : 0;
  const chartValues = chartPoints.map((point) => point.value);
  const minValue = chartValues.length ? Math.min(...chartValues) : 0;
  const maxValue = chartValues.length ? Math.max(...chartValues) : 0;
  const valueRange = maxValue - minValue;
  const chartPath = chartPoints.map((point, index) => {
    const x = chartPoints.length > 1 ? (index / (chartPoints.length - 1)) * 390 : 195;
    const y = valueRange > 0 ? 164 - ((point.value - minValue) / valueRange) * 138 : 95;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const hasManualInvestments = investmentRecords.some((record) => !record.asset);

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
        {periods.map((item) => (
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

      <section className="graph investment-graph" aria-label={`Evolución de la cartera: ${period}`}>
        {chartPoints.length > 0 && (
          <svg viewBox="0 0 390 190" preserveAspectRatio="none" role="img" aria-label="Gráfico de valor histórico de la cartera en euros">
            <path className="baseline" d="M0 164H390" />
            {chartPath && <path className="spend-line" d={chartPath} />}
          </svg>
        )}
        {isLoadingHistory && <p className="investment-chart-message" role="status">Cargando histórico del mercado…</p>}
        {!isLoadingHistory && historyError && !chartPoints.length && (
          <p className="investment-chart-message investment-chart-error" role="alert">{historyError}</p>
        )}
        {!isLoadingHistory && !historyError && investmentRecords.length === 0 && (
          <p className="investment-chart-message">Añade una inversión para ver su evolución.</p>
        )}
        {!isLoadingHistory && !historyError && investmentRecords.length > 0 && !chartPoints.length && (
          <p className="investment-chart-message">No hay histórico disponible para este periodo.</p>
        )}
      </section>
      {hasManualInvestments && (
        <p className="investment-chart-note">Las inversiones manuales se muestran con el último valor registrado.</p>
      )}
      {historyError && chartPoints.length > 0 && (
        <p className="investment-chart-note investment-chart-error" role="alert">
          No se pudo consultar el histórico de algunas inversiones. El gráfico incluye los datos disponibles.
        </p>
      )}

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
            const diffPercent = Number(record.investedAmount) > 0
              ? (diff / Number(record.investedAmount)) * 100
              : 0;
            const symbol = record.asset?.symbol || record.name || 'I';

            return (
              <button className="movement" key={record.id}>
                {record.asset
                  ? <InvestmentAssetIcon asset={record.asset} className="size-12" />
                  : <span className="asset-logo">{symbol.slice(0, 1).toUpperCase()}</span>}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 7 5 5-5 5" />
                </svg>
              </button>
            );
          })}
          {visibleInvestments.length === 0 && (
            <p className="investment-chart-message">No hay inversiones que coincidan con la búsqueda.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default InvestmentsOverview;

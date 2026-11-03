import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetIcon from './InvestmentAssetIcon';
import { getInvestmentHistory, getInvestmentQuote } from '../utils/investmentMarketData';

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

const getHoldingKey = (record) => record.asset?.provider && record.asset?.id
  ? `${record.asset.provider}:${record.asset.id}`
  : `manual:${record.id}`;

const formatPurchaseDate = (date) => {
  const timestamp = Date.parse(`${date}T00:00:00`);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp)
    : date;
};

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

const InvestmentDetail = ({
  investment,
  purchases,
  history,
  period,
  onPeriodChange,
  onBack,
  onSell,
  onUpdatePrice,
}) => {
  const [marketQuote, setMarketQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const invested = purchases.reduce((sum, purchase) => sum + (Number(purchase.investedAmount) || 0), 0);
  const units = purchases.reduce((sum, purchase) => sum + (Number(purchase.units) || 0), 0);
  const assetKey = investment.asset?.provider && investment.asset?.id
    ? `${investment.asset.provider}:${investment.asset.id}`
    : '';
  const lastRecordedPrice = purchases
    .filter((purchase) => Number(purchase.currentPrice) > 0)
    .sort((a, b) => Date.parse(b.lastPriceUpdated || '') - Date.parse(a.lastPriceUpdated || ''))[0]?.currentPrice;
  const currentPrice = marketQuote?.priceEur || Number(lastRecordedPrice) || 0;
  const currentValue = investment.asset && currentPrice > 0
    ? currentPrice * units
    : purchases.reduce((sum, purchase) => sum + (Number(purchase.currentValue) || 0), 0);
  const averageCost = units > 0 ? invested / units : 0;
  const profit = currentValue - invested;
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
  const purchaseSignature = purchases.map((purchase) => purchase.id).join('|');

  useEffect(() => {
    if (!investment.asset || !assetKey) return undefined;

    const controller = new AbortController();
    setMarketQuote(null);
    setQuoteError('');
    setIsLoadingQuote(true);

    getInvestmentQuote(investment.asset, controller.signal)
      .then((quote) => {
        setMarketQuote(quote);
        purchases.forEach((purchase) => onUpdatePrice(purchase.id, quote));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setQuoteError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingQuote(false);
      });

    return () => controller.abort();
  }, [assetKey, investment.asset, onUpdatePrice, purchaseSignature]);

  const historyPoints = (history[assetKey] || [])
    .filter((point) => Number.isFinite(Date.parse(point.timestamp)) && Number.isFinite(Number(point.price)))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const now = Date.now();
  const earliestPurchase = Math.min(...purchases.map((purchase) => Date.parse(`${purchase.date}T00:00:00`)).filter(Number.isFinite), now);
  const periodStart = period === 'Máx' ? earliestPurchase : now - periodDurations[period];
  const relevantHistory = historyPoints.filter((point) => {
    const timestamp = Date.parse(point.timestamp);
    return timestamp >= Math.max(periodStart, earliestPurchase) && timestamp <= now;
  });
  const chartTimestamps = [...new Set([
    ...purchases
      .map((purchase) => Date.parse(`${purchase.date}T00:00:00`))
      .filter((timestamp) => timestamp >= periodStart && timestamp <= now),
    ...relevantHistory.map((point) => Date.parse(point.timestamp)),
  ])].sort((a, b) => a - b);
  const detailPoints = relevantHistory.length && units > 0
    ? downsample(chartTimestamps.flatMap((timestamp) => {
      const price = getPriceAt(historyPoints, timestamp);
      if (price === null) return [];
      const ownedUnits = purchases.reduce((sum, purchase) => (
        Date.parse(`${purchase.date}T00:00:00`) <= timestamp
          && (!purchase.soldAt || timestamp <= Date.parse(purchase.soldAt))
          ? sum + (Number(purchase.units) || 0)
          : sum
      ), 0);
      return [{ timestamp, value: price * ownedUnits }];
    }))
    : [];
  const values = detailPoints.map((point) => point.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const valueRange = maxValue - minValue;
  const chartPath = detailPoints.map((point, index) => {
    const x = detailPoints.length > 1 ? (index / (detailPoints.length - 1)) * 390 : 195;
    const y = valueRange > 0 ? 164 - ((point.value - minValue) / valueRange) * 138 : 95;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const manualHistory = purchases.some((purchase) => Array.isArray(purchase.priceHistory) && purchase.priceHistory.length > 1);

  return (
    <section className="investment-detail-page" aria-label={`Detalle de ${investment.name}`}>
      <header className="investment-detail-header">
        <button type="button" className="investment-detail-back" onClick={onBack} aria-label="Volver a inversiones">
          <ArrowLeft size={23} aria-hidden="true" />
        </button>
        <span>Detalle de inversión</span>
      </header>

      <div className="investment-detail-identity">
        {investment.asset
          ? <InvestmentAssetIcon asset={investment.asset} className="size-14" />
          : <span className="asset-logo">{investment.name.slice(0, 1).toUpperCase()}</span>}
        <span className="investment-detail-name">{investment.name}</span>
        {investment.asset?.symbol && <span className="investment-detail-symbol">{investment.asset.symbol}</span>}
      </div>

      <section className="investment-detail-balance">
        <span>{investment.asset ? 'Precio actual del activo' : 'Valor actual de la posición'}</span>
        <div className="investment-detail-value-row">
          <strong>{displayMoney(investment.asset ? currentPrice : currentValue)}</strong>
          {investment.asset && <span>por unidad</span>}
        </div>
        {investment.asset && isLoadingQuote && <small role="status">Actualizando cotización…</small>}
        {investment.asset && quoteError && (
          <small className="investment-quote-error" role="alert">
            No se pudo actualizar el precio. Se muestra la última cotización guardada.
          </small>
        )}
      </section>

      <section className="summary-grid investment-detail-summary" aria-label="Resumen de la posición">
        <div>
          <span>Valor de tu posición</span>
          <strong className="privacy-sensitive">{displayMoney(currentValue)}</strong>
        </div>
        <div>
          <span>Invertido</span>
          <strong className="privacy-sensitive">{displayMoney(invested)}</strong>
        </div>
        <div>
          <span>Rentabilidad</span>
          <strong className={`privacy-sensitive ${profit >= 0 ? 'positive' : 'negative'}`}>
            {profit > 0 ? '+' : ''}{displayMoney(profit)} ({profitPercent.toFixed(2)} %)
          </strong>
        </div>
        <div>
          <span>{investment.asset ? 'Unidades' : 'Compras'}</span>
          <strong>
            {investment.asset
              ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 }).format(units)
              : purchases.length}
          </strong>
        </div>
      </section>

      <div className="periods investment-detail-periods" role="tablist" aria-label="Periodo del activo">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={period === item}
            className={period === item ? 'active' : ''}
            onClick={() => onPeriodChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="investment-detail-chart" aria-label={`Histórico de ${investment.name}: ${period}`}>
        {detailPoints.length > 0 ? (
          <svg viewBox="0 0 390 190" preserveAspectRatio="none" role="img" aria-label={`Valor histórico de tu posición en ${investment.name}`}>
            <path className="baseline" d="M0 164H390" />
            <path className={`spend-line ${profit < 0 ? 'negative' : 'positive'}`} d={chartPath} />
          </svg>
        ) : (
          <p>
            {investment.asset
              ? 'No hay histórico disponible para este periodo.'
              : manualHistory
                ? 'El histórico guardado no cubre este periodo.'
                : 'Las inversiones manuales no tienen histórico de mercado.'}
          </p>
        )}
      </section>

      <section className="investment-detail-section">
        <h2>Información <ChevronRight size={20} aria-hidden="true" /></h2>
        <p className="investment-detail-description">
          {investment.asset
            ? `${investment.asset.name || investment.name}${investment.asset.type ? ` · ${investment.asset.type}` : ''}. Posición en cartera basada en tus compras registradas.`
            : 'Posición manual registrada en tu cartera.'}
        </p>
      </section>

      <section className="investment-detail-section">
        <h2>Datos clave</h2>
        <dl className="investment-key-data">
          <div><dt>Capital invertido</dt><dd>{displayMoney(invested)}</dd></div>
          <div><dt>Valor de tu posición</dt><dd>{displayMoney(currentValue)}</dd></div>
          {units > 0 && (
            <>
              <div><dt>Unidades</dt><dd>{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 }).format(units)}</dd></div>
              <div><dt>Precio actual por unidad</dt><dd>{displayMoney(currentPrice)}</dd></div>
              <div><dt>Precio medio de compra</dt><dd>{displayMoney(averageCost)}</dd></div>
            </>
          )}
          <div><dt>Compras</dt><dd>{purchases.length}</dd></div>
          <div><dt>Primera compra</dt><dd>{formatPurchaseDate(purchases.reduce((first, purchase) => purchase.date < first ? purchase.date : first, purchases[0].date))}</dd></div>
        </dl>
      </section>

      <section className="investment-detail-section investment-purchases">
        <div className="investment-purchases-heading">
          <h2>Tus compras de {investment.name}</h2>
          <button type="button" className="investment-sell-button" disabled={investment.asset && !currentPrice} onClick={() => {
            setSaleError('');
            setIsConfirmingSale(true);
          }}>
            Vender todo
          </button>
        </div>
        {isConfirmingSale && (
          <div className="investment-sell-confirmation" role="group" aria-label="Confirmar venta total">
            <p>
              Registrarás una venta total por {displayMoney(currentValue)}. Esto actualiza tu cartera,
              pero no ejecuta una operación en un broker.
            </p>
            {saleError && <p className="investment-quote-error" role="alert">{saleError}</p>}
            <div>
              <button
                type="button"
                disabled={isSelling}
                onClick={() => {
                  setIsSelling(true);
                  setSaleError('');
                  try {
                    onSell(purchases, currentPrice);
                  } catch (error) {
                    setSaleError(error.message);
                    setIsSelling(false);
                  }
                }}
              >
                {isSelling ? 'Registrando…' : 'Confirmar venta'}
              </button>
              <button type="button" disabled={isSelling} onClick={() => setIsConfirmingSale(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        <div className="investment-purchase-list">
          {[...purchases].sort((a, b) => b.date.localeCompare(a.date)).map((purchase) => {
            const purchaseUnits = Number(purchase.units) || 0;
            const purchaseCost = purchaseUnits > 0
              ? Number(purchase.investedAmount) / purchaseUnits
              : 0;

            return (
              <article className="investment-purchase" key={purchase.id}>
                {investment.asset
                  ? <InvestmentAssetIcon asset={investment.asset} className="size-11" />
                  : <span className="asset-logo">{investment.name.slice(0, 1).toUpperCase()}</span>}
                <div className="investment-purchase-info">
                  <strong>Compra</strong>
                  <small>{formatPurchaseDate(purchase.date)}</small>
                  {purchaseUnits > 0 && (
                    <small>
                      {new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 }).format(purchaseUnits)} unidades · {displayMoney(purchaseCost)} / unidad
                    </small>
                  )}
                </div>
                <strong className="investment-purchase-amount">{displayMoney(Number(purchase.investedAmount) || 0)}</strong>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
};

const InvestmentsOverview = ({ query = '' }) => {
  const { investmentRecords, sellInvestmentRecords, updateInvestmentPrice } = useFinance();
  const [period, setPeriod] = useState('1M');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
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
    if (record.soldAt) return result;
    result.invested += Number(record.investedAmount) || 0;
    result.currentValue += Number(record.currentValue) || 0;
    return result;
  }, { invested: 0, currentValue: 0 }), [investmentRecords]);

  const visibleInvestments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    const activeRecords = investmentRecords.filter((record) => !record.soldAt);
    if (!normalizedQuery) return activeRecords;
    return activeRecords.filter((record) => (
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
    const hasManualRecords = investmentRecords.some((record) => !record.asset && !record.soldAt);
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
      .flatMap((record) => [
        Date.parse(`${record.date}T00:00:00`),
        ...(record.soldAt ? [Date.parse(record.soldAt)] : []),
      ])
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= start && timestamp <= now);
    const saleTimestamps = investmentRecords
      .map((record) => record.soldAt ? Date.parse(record.soldAt) : NaN)
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= start && timestamp <= now);
    const chartStart = marketTimestamps.length ? Math.min(...marketTimestamps) : start;
    const timestamps = [...new Set([chartStart, ...marketTimestamps, ...manualTimestamps, ...saleTimestamps, now])]
      .sort((a, b) => a - b);

    const points = timestamps.map((timestamp) => {
      const value = investmentRecords.reduce((total, record) => {
        const purchaseDate = Date.parse(`${record.date}T00:00:00`);
        if (!Number.isFinite(purchaseDate) || timestamp < purchaseDate) return total;
        if (record.soldAt && timestamp > Date.parse(record.soldAt)) return total;

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
  const hasManualInvestments = investmentRecords.some((record) => !record.asset && !record.soldAt);
  const selectedInvestment = investmentRecords.find((record) => record.id === selectedInvestmentId && !record.soldAt);
  const selectedPurchases = selectedInvestment
    ? investmentRecords.filter((record) => !record.soldAt && getHoldingKey(record) === getHoldingKey(selectedInvestment))
    : [];

  if (selectedInvestment) {
    return (
      <InvestmentDetail
        key={getHoldingKey(selectedInvestment)}
        investment={selectedInvestment}
        purchases={selectedPurchases}
        history={historyByAsset}
        period={period}
        onPeriodChange={setPeriod}
        onBack={() => setSelectedInvestmentId(null)}
        onSell={(purchases, price) => {
          sellInvestmentRecords(purchases.map((purchase) => purchase.id), price);
          setSelectedInvestmentId(null);
        }}
        onUpdatePrice={updateInvestmentPrice}
      />
    );
  }

  return (
    <>
      <section className="overview investments">
        <div className="overview-label">
          <span>Valor de la cartera</span>
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
              <button
                className="movement"
                key={record.id}
                type="button"
                onClick={() => setSelectedInvestmentId(record.id)}
                aria-label={`Ver detalle de ${record.name}`}
              >
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetIcon from './InvestmentAssetIcon';
import { getInvestmentHistory, getInvestmentQuote, getInvestmentQuotes } from '../utils/investmentMarketData';
import { useElasticScroll } from '../hooks/useElasticScroll';
import { triggerHaptic } from '../utils/haptics';

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

const formatScrubLabel = (timestamp, period) => {
  const options = period === '1D' || period === '1S'
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : period === '1M'
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('es-ES', options).format(new Date(timestamp));
};

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

const KNOWN_ASSET_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', USDC: '#2775CA', BNB: '#F3BA2F',
  SOL: '#9945FF', XRP: '#2B6CB0', ADA: '#2A5ADA', DOGE: '#C2A633', DOT: '#E6007A',
};

const getAssetBadgeStyle = (name, symbol) => {
  const key = String(symbol || '').toUpperCase();
  const bg = KNOWN_ASSET_COLORS[key] || '#0075EB';
  return {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: bg,
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
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
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [scrubIndex, setScrubIndex] = useState(null);
  const chartRef = useRef(null);

  const isSold = purchases.every((p) => p.soldAt);
  const invested = purchases.reduce((sum, p) => sum + (Number(p.investedAmount) || 0), 0);
  const units = purchases.reduce((sum, p) => sum + (Number(p.units) || 0), 0);
  const assetKey = investment.asset?.provider && investment.asset?.id
    ? `${investment.asset.provider}:${investment.asset.id}`
    : '';
  const lastRecordedPrice = purchases
    .filter((p) => Number(p.currentPrice) > 0)
    .sort((a, b) => Date.parse(b.lastPriceUpdated || '') - Date.parse(a.lastPriceUpdated || ''))[0]?.currentPrice;
  const currentPrice = marketQuote?.priceEur || Number(lastRecordedPrice) || 0;

  const currentValue = isSold
    ? purchases.reduce((sum, p) => sum + (Number(p.soldValue) || 0), 0)
    : (investment.asset && currentPrice > 0
      ? currentPrice * units
      : purchases.reduce((sum, p) => sum + (Number(p.currentValue) || 0), 0));

  const profit = currentValue - invested;
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
  const purchaseSignature = purchases.map((p) => p.id).join('|');

  useEffect(() => {
    if (!investment.asset || !assetKey || isSold) return undefined;
    const controller = new AbortController();
    setIsLoadingQuote(true);
    getInvestmentQuote(investment.asset, controller.signal)
      .then((quote) => {
        if (quote.priceEur > 0) {
          setMarketQuote(quote);
          purchases.forEach((p) => onUpdatePrice(p.id, quote));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingQuote(false);
      });
    return () => controller.abort();
  }, [assetKey, investment.asset, onUpdatePrice, purchaseSignature, isSold]);

  const historyPoints = (history[assetKey] || [])
    .filter((pt) => Number.isFinite(Date.parse(pt.timestamp)) && Number.isFinite(Number(pt.price)))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const now = Date.now();
  const earliestPurchase = Math.min(
    ...purchases.map((p) => Date.parse(`${p.date}T00:00:00`)).filter(Number.isFinite),
    now,
  );
  const periodStart = period === 'Máx' ? earliestPurchase : now - periodDurations[period];
  const relevantHistory = historyPoints.filter((pt) => {
    const ts = Date.parse(pt.timestamp);
    return ts >= Math.max(periodStart, earliestPurchase) && ts <= now;
  });

  const detailPoints = useMemo(() => {
    if (!relevantHistory.length || units <= 0) return [];
    const timestamps = [...new Set([...relevantHistory.map((pt) => Date.parse(pt.timestamp)), now])].sort((a, b) => a - b);
    return downsample(timestamps.flatMap((ts) => {
      const price = ts === now && currentPrice > 0 ? currentPrice : getPriceAt(historyPoints, ts);
      if (price === null) return [];
      return [{ timestamp: ts, price, value: price * units }];
    }));
  }, [relevantHistory, units, now, currentPrice, historyPoints]);

  const vals = detailPoints.map((p) => p.value);
  const minVal = vals.length ? Math.min(...vals) : 0;
  const maxVal = vals.length ? Math.max(...vals) : 0;
  const range = maxVal - minVal;
  const coords = detailPoints.map((pt, idx) => ({
    x: detailPoints.length > 1 ? (idx / (detailPoints.length - 1)) * 390 : 195,
    y: range > 0 ? 115 - ((pt.value - minVal) / range) * 90 : 70,
    ...pt,
  }));
  const chartPath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const activePt = scrubIndex !== null ? coords[scrubIndex] : null;
  const trendColor = profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

  return createPortal(
    <div className="sheet-layer" style={{ zIndex: 105 }} onMouseDown={onBack}>
      <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {investment.asset
              ? <InvestmentAssetIcon asset={investment.asset} className="size-11" />
              : <span style={getAssetBadgeStyle(investment.name, investment.asset?.symbol)}>{investment.name.slice(0, 1).toUpperCase()}</span>}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{investment.name}</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {investment.asset?.symbol || 'Posición manual'} {isSold ? '· Vendido' : ''}
              </span>
            </div>
          </div>
          <button type="button" onClick={onBack} className="sheet-close" style={{ position: 'static' }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {activePt ? formatScrubLabel(activePt.timestamp, period) : isSold ? 'Valor de venta' : 'Valor de tu posición'}
          </span>
          <strong style={{ display: 'block', fontSize: '34px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
            {displayMoney(activePt ? activePt.value : currentValue)}
          </strong>
          {isLoadingQuote && <small style={{ color: 'var(--text-secondary)' }}>Actualizando cotización...</small>}
        </div>

        {coords.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <div className="record-tabs" style={{ marginBottom: '10px' }}>
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={period === p ? 'active' : ''}
                  onClick={() => { onPeriodChange(p); setScrubIndex(null); }}
                >
                  {p}
                </button>
              ))}
            </div>
            <div
              ref={chartRef}
              data-chart-scrub
              style={{ position: 'relative', height: '130px', touchAction: 'pan-y', cursor: 'crosshair' }}
              onPointerMove={(e) => {
                if (e.buttons <= 0 && e.pointerType === 'mouse') return;
                const rect = chartRef.current?.getBoundingClientRect();
                if (!rect) return;
                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                const idx = Math.round(ratio * (coords.length - 1));
                if (idx !== scrubIndex) {
                  setScrubIndex(idx);
                  triggerHaptic();
                }
              }}
              onPointerUp={() => setScrubIndex(null)}
              onPointerLeave={() => setScrubIndex(null)}
            >
              <svg viewBox="0 0 390 130" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <path d={chartPath} fill="none" stroke={trendColor} strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              {activePt && (
                <span
                  style={{
                    position: 'absolute',
                    left: `${(activePt.x / 390) * 100}%`,
                    top: `${(activePt.y / 130) * 100}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: `3px solid ${trendColor}`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>Invertido</span>
            <strong style={{ display: 'block', fontSize: '16px', fontWeight: 800, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {displayMoney(invested)}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>Rentabilidad</span>
            <strong style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: 800,
              marginTop: '4px',
              fontVariantNumeric: 'tabular-nums',
              color: trendColor,
            }}>
              {profit > 0 ? '+' : ''}{displayMoney(profit)} ({profitPercent.toFixed(1)}%)
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Compras registradas
          </h3>
          {purchases.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'var(--bg-subtle)',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              <div>
                <strong>{formatPurchaseDate(p.date)}</strong>
                {Number(p.units) > 0 && (
                  <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                    {Number(p.units).toFixed(6)} uds
                  </small>
                )}
              </div>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{displayMoney(Number(p.investedAmount) || 0)}</strong>
            </div>
          ))}
        </div>

        {!isSold && (
          isConfirmingSale ? (
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '18px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Confirmar venta total por <strong>{displayMoney(currentValue)}</strong>.
              </p>
              {saleError && <p style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{saleError}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isSelling}
                  className="sheet-submit"
                  onClick={() => {
                    setIsSelling(true);
                    try {
                      onSell(purchases, currentPrice);
                    } catch (err) {
                      setSaleError(err.message);
                      setIsSelling(false);
                    }
                  }}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingSale(false)}
                  style={{
                    height: '52px',
                    borderRadius: '16px',
                    border: 0,
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="sheet-submit"
              disabled={investment.asset && !currentPrice}
              onClick={() => setIsConfirmingSale(true)}
            >
              Vender posición <ArrowRight size={16} />
            </button>
          )
        )}
      </section>
    </div>,
    document.body,
  );
};

const InvestmentsOverview = ({ query = '' }) => {
  const scrollContainerRef = useRef(null);
  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } = useElasticScroll(75, 0.35);
  const { investmentRecords, sellInvestmentRecords, updateInvestmentPrice, isAmountsHidden } = useFinance();
  const [period, setPeriod] = useState('1M');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  const [historyByAsset, setHistoryByAsset] = useState({});
  const [portfolioScrubIndex, setPortfolioScrubIndex] = useState(null);
  const portfolioChartRef = useRef(null);

  const marketAssets = useMemo(() => [...new Map(
    investmentRecords
      .filter((r) => r.asset?.provider && r.asset?.id)
      .map((r) => [`${r.asset.provider}:${r.asset.id}`, r.asset]),
  ).values()], [investmentRecords]);
  const assetSignature = marketAssets.map((a) => `${a.provider}:${a.id}`).join('|');

  useEffect(() => {
    if (!marketAssets.length) return undefined;
    let active = true;
    getInvestmentQuotes(marketAssets).then(({ quotes }) => {
      if (!active) return;
      investmentRecords.forEach((rec) => {
        if (!rec.soldAt && rec.asset) {
          const quote = quotes.get(`${rec.asset.provider}:${rec.asset.id}`);
          if (quote) updateInvestmentPrice(rec.id, quote);
        }
      });
    });
    return () => { active = false; };
  }, [assetSignature, updateInvestmentPrice]);

  useEffect(() => {
    if (!marketAssets.length) {
      setHistoryByAsset({});
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    const requestedPeriod = period === 'Máx' ? 'TODO' : period;
    Promise.allSettled(marketAssets.map(async (asset) => {
      const points = await getInvestmentHistory(asset, requestedPeriod, controller.signal);
      return [`${asset.provider}:${asset.id}`, points];
    })).then((entries) => {
      if (!active) return;
      const ok = entries.filter((e) => e.status === 'fulfilled').map((e) => e.value);
      setHistoryByAsset(Object.fromEntries(ok));
    });
    return () => { active = false; controller.abort(); };
  }, [assetSignature, period]);

  const totals = useMemo(() => investmentRecords.reduce((res, rec) => {
    if (rec.soldAt) return res;
    res.invested += Number(rec.investedAmount) || 0;
    res.currentValue += Number(rec.currentValue) || 0;
    return res;
  }, { invested: 0, currentValue: 0 }), [investmentRecords]);

  const visibleInvestments = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? investmentRecords.filter((r) => (r.name || '').toLowerCase().includes(q) || (r.asset?.symbol || '').toLowerCase().includes(q))
      : investmentRecords;

    const map = new Map();
    filtered.forEach((rec) => {
      const key = `${getHoldingKey(rec)}-${Boolean(rec.soldAt)}`;
      if (!map.has(key)) map.set(key, { ...rec, _group: [] });
      map.get(key)._group.push(rec);
    });

    return Array.from(map.values()).map((h) => {
      const isSold = Boolean(h.soldAt);
      return {
        ...h,
        investedAmount: h._group.reduce((s, p) => s + (Number(p.investedAmount) || 0), 0),
        currentValue: h._group.reduce((s, p) => s + (Number(isSold ? p.soldValue : p.currentValue) || 0), 0),
      };
    }).sort((a, b) => Number(Boolean(a.soldAt)) - Number(Boolean(b.soldAt)));
  }, [investmentRecords, query]);

  const chartPoints = useMemo(() => {
    const now = Date.now();
    const start = period === 'Máx'
      ? Math.min(...investmentRecords.map((r) => Date.parse(`${r.date}T00:00:00`)).filter(Number.isFinite), now)
      : now - periodDurations[period];
    const marketTs = Object.values(historyByAsset).flat()
      .map((p) => Date.parse(p.timestamp))
      .filter((t) => Number.isFinite(t) && t >= start && t <= now);
    const timestamps = [...new Set([start, ...marketTs, now])].sort((a, b) => a - b);

    return downsample(timestamps.map((ts) => {
      const value = investmentRecords.reduce((sum, rec) => {
        const buyTs = Date.parse(`${rec.date}T00:00:00`);
        if (!Number.isFinite(buyTs) || ts < buyTs) return sum;
        if (rec.soldAt && ts > Date.parse(rec.soldAt)) return sum;
        if (!rec.asset || ts === now) return sum + (Number(rec.currentValue) || 0);
        const price = getPriceAt(historyByAsset[`${rec.asset.provider}:${rec.asset.id}`] || [], ts);
        return price !== null ? sum + price * Number(rec.units || 0) : sum;
      }, 0);
      return { timestamp: ts, value };
    }));
  }, [historyByAsset, investmentRecords, period]);

  const performance = totals.currentValue - totals.invested;
  const performancePercent = totals.invested > 0 ? (performance / totals.invested) * 100 : 0;
  const chartValues = chartPoints.map((p) => p.value);
  const minVal = chartValues.length ? Math.min(...chartValues) : 0;
  const maxVal = chartValues.length ? Math.max(...chartValues) : 0;
  const range = maxVal - minVal;

  const coords = chartPoints.map((p, idx) => ({
    x: chartPoints.length > 1 ? (idx / (chartPoints.length - 1)) * 390 : 195,
    y: range > 0 ? 135 - ((p.value - minVal) / range) * 105 : 95,
    ...p,
  }));
  const chartPath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

  const scrubPortfolioChart = (clientX) => {
    const rect = portfolioChartRef.current?.getBoundingClientRect();
    if (!rect || coords.length === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (coords.length - 1));
    if (idx !== portfolioScrubIndex) {
      setPortfolioScrubIndex(idx);
      triggerHaptic();
    }
  };

  const activeScrub = portfolioScrubIndex !== null ? coords[portfolioScrubIndex] : null;
  const shownVal = activeScrub ? activeScrub.value : totals.currentValue;
  const formatted = isAmountsHidden ? '•••• €' : displayMoney(shownVal);
  const commaIdx = formatted.indexOf(',');
  const intPart = commaIdx === -1 ? formatted : formatted.slice(0, commaIdx);
  const decPart = commaIdx === -1 ? '' : formatted.slice(commaIdx);
  const isUp = performance >= 0;
  const strokeColor = isUp ? 'var(--accent-green)' : 'var(--accent-red)';

  const selectedInvestment = investmentRecords.find((r) => r.id === selectedInvestmentId);
  const selectedPurchases = selectedInvestment
    ? investmentRecords.filter((r) => getHoldingKey(r) === getHoldingKey(selectedInvestment) && Boolean(r.soldAt) === Boolean(selectedInvestment.soldAt))
    : [];

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
      <div style={{ padding: '6px 16px 0' }}>
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '26px',
          padding: '24px 0 0',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              {activeScrub ? formatScrubLabel(activeScrub.timestamp, period) : 'Valor de la cartera'}
            </span>

            <div className="privacy-sensitive" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', margin: '6px 0 12px' }}>
              <span style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1 }}>{intPart}</span>
              <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '2px' }}>{decPart}</span>
            </div>

            {totals.invested > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                background: isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                color: strokeColor,
              }}>
                {isUp ? '+' : ''}{performancePercent.toFixed(2)}% ({isUp ? '+' : ''}{displayMoney(performance)})
              </span>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px',
              margin: '18px auto 0',
              background: 'var(--bg-subtle)',
              borderRadius: '999px',
              width: 'max-content',
            }}>
              {periods.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setPeriod(item); setPortfolioScrubIndex(null); }}
                  style={{
                    border: 0,
                    background: period === item ? 'var(--bg-card)' : 'transparent',
                    color: period === item ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: period === item ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={portfolioChartRef}
            data-chart-scrub
            style={{ position: 'relative', height: '155px', marginTop: '14px', touchAction: 'pan-y', cursor: 'crosshair' }}
            onPointerDown={(e) => {
              if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture?.(e.pointerId);
              scrubPortfolioChart(e.clientX);
            }}
            onPointerMove={(e) => {
              if (portfolioScrubIndex !== null || e.buttons > 0) scrubPortfolioChart(e.clientX);
            }}
            onPointerUp={(e) => {
              if (e.pointerType !== 'mouse') setPortfolioScrubIndex(null);
            }}
            onPointerCancel={() => setPortfolioScrubIndex(null)}
            onPointerLeave={() => setPortfolioScrubIndex(null)}
          >
            {coords.length > 0 && (
              <svg viewBox="0 0 390 155" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="inv-area-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? '#10B981' : '#F43F5E'} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={isUp ? '#10B981' : '#F43F5E'} stopOpacity="0" />
                  </linearGradient>
                  {activeScrub && (
                    <clipPath id="inv-scrub-clip">
                      <rect x="0" y="-20" width={activeScrub.x} height="195" />
                    </clipPath>
                  )}
                </defs>
                <path
                  d={`${chartPath} L390 155 L0 155 Z`}
                  fill="url(#inv-area-fill)"
                  style={{ opacity: activeScrub ? 0.35 : 1 }}
                />
                {activeScrub && (
                  <path d={chartPath} fill="none" stroke={strokeColor} strokeWidth="2.5" style={{ opacity: 0.25 }} />
                )}
                <path
                  d={chartPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  clipPath={activeScrub ? 'url(#inv-scrub-clip)' : undefined}
                />
              </svg>
            )}

            {activeScrub && (
              <>
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    left: `${(activeScrub.x / 390) * 100}%`,
                    background: 'var(--border-subtle)',
                    pointerEvents: 'none',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: `${(activeScrub.x / 390) * 100}%`,
                    top: `${(activeScrub.y / 155) * 100}%`,
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: `3px solid ${strokeColor}`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 5px rgba(16, 185, 129, 0.2)',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px 16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '22px', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Capital invertido</span>
          <strong className="privacy-sensitive" style={{ display: 'block', fontSize: '18px', fontWeight: 800, marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
            {isAmountsHidden ? '•••• €' : displayMoney(totals.invested)}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '22px', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Posiciones activas</span>
          <strong style={{ display: 'block', fontSize: '18px', fontWeight: 800, marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
            {investmentRecords.filter((r) => !r.soldAt).length}
          </strong>
        </div>
      </div>

      <section style={{ padding: '6px 16px 0' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '8px 0 12px' }}>Cartera</h2>
        {visibleInvestments.length > 0 ? visibleInvestments.map((rec) => {
          const isSold = Boolean(rec.soldAt);
          const val = isSold ? Number(rec.soldValue) : Number(rec.currentValue);
          const diff = val - Number(rec.investedAmount);
          const diffPct = Number(rec.investedAmount) > 0 ? (diff / Number(rec.investedAmount)) * 100 : 0;

          return (
            <button
              key={`${rec.id}-${isSold}`}
              type="button"
              onClick={() => setSelectedInvestmentId(rec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '14px 16px',
                marginBottom: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                opacity: isSold ? 0.6 : 1,
              }}
            >
              {rec.asset
                ? <InvestmentAssetIcon asset={rec.asset} className="size-11" />
                : <span style={getAssetBadgeStyle(rec.name, rec.asset?.symbol)}>{(rec.name || 'I').slice(0, 1).toUpperCase()}</span>}

              <span style={{ flex: 1, minWidth: 0, marginLeft: '13px' }}>
                <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {rec.name}
                </strong>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {rec.asset?.symbol || 'Manual'}
                </small>
              </span>

              <span style={{ textAlign: 'right', marginRight: '8px', fontVariantNumeric: 'tabular-nums' }}>
                <strong className="privacy-sensitive" style={{ display: 'block', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAmountsHidden ? '•••• €' : displayMoney(val)}
                </strong>
                {isSold ? (
                  <small style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Vendido</small>
                ) : (
                  <small style={{ fontSize: '12px', fontWeight: 700, color: diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {diff > 0 ? '+' : ''}{diffPct.toFixed(2)}%
                  </small>
                )}
              </span>
              <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          );
        }) : (
          <div style={{
            padding: '24px',
            borderRadius: '22px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            Aún no tienes inversiones registradas.
          </div>
        )}
      </section>

      {selectedInvestment && (
        <InvestmentDetail
          investment={selectedInvestment}
          purchases={selectedPurchases}
          history={historyByAsset}
          period={period}
          onPeriodChange={setPeriod}
          onBack={() => setSelectedInvestmentId(null)}
          onSell={(purchases, price) => {
            sellInvestmentRecords(purchases.map((p) => p.id), price);
            setSelectedInvestmentId(null);
          }}
          onUpdatePrice={updateInvestmentPrice}
        />
      )}
    </div>
  );
};

export default InvestmentsOverview;
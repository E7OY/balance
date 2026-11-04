import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetIcon from './InvestmentAssetIcon';
import { getInvestmentHistory, getInvestmentQuote } from '../utils/investmentMarketData';
import './investmentDetailSheet.css';

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
  LTC: '#345D9D', AVAX: '#E84142', LINK: '#2A5ADA', MATIC: '#8247E5', TRX: '#EC0928',
};

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((character) => character + character).join('') : value;
  return [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16));
};

const rgbToHex = (red, green, blue) => `#${[red, green, blue]
  .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
  .join('')}`;

const getLuminance = (hex) => {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const getReadableTextColor = (hex) => {
  const luminance = getLuminance(hex);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithDark = (luminance + 0.05) / (getLuminance('#090909') + 0.05);
  return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#090909';
};

const getFallbackAccent = (investment) => {
  const symbol = String(investment.asset?.symbol || '').toUpperCase();
  if (KNOWN_ASSET_COLORS[symbol]) return KNOWN_ASSET_COLORS[symbol];
  const seed = String(investment.asset?.id || investment.name || 'activo');
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  const hue = hash / 60;
  const chroma = 0.62 * 0.9;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const lightness = 0.62 - chroma / 2;
  const [red, green, blue] = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(hue) % 6];
  return rgbToHex((red + lightness) * 255, (green + lightness) * 255, (blue + lightness) * 255);
};

const getAssetLogoStyle = (name, symbol) => {
  const bg = getFallbackAccent({ asset: { symbol }, name });
  const color = getReadableTextColor(bg);
  return {
    backgroundColor: bg,
    color,
    borderColor: 'transparent',
  };
};

const sampleImageColor = (source) => new Promise((resolve) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    try {
      const size = 24;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      const { data } = context.getImageData(0, 0, size, size);
      let red = 0;
      let green = 0;
      let blue = 0;
      let weight = 0;
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] < 200) continue;
        const max = Math.max(data[index], data[index + 1], data[index + 2]);
        const min = Math.min(data[index], data[index + 1], data[index + 2]);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const pixelWeight = saturation ** 2 + 0.01;
        red += data[index] * pixelWeight;
        green += data[index + 1] * pixelWeight;
        blue += data[index + 2] * pixelWeight;
        weight += pixelWeight;
      }
      resolve(weight > 0 ? rgbToHex(red / weight, green / weight, blue / weight) : null);
    } catch {
      resolve(null);
    }
  };
  image.onerror = () => resolve(null);
  image.src = source;
});

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
      return [{ timestamp, value: price * ownedUnits, price }];
    }))
    : [];
  const values = detailPoints.map((point) => point.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const valueRange = maxValue - minValue;
  const chartCoordinates = detailPoints.map((point, index) => ({
    x: detailPoints.length > 1 ? (index / (detailPoints.length - 1)) * 390 : 195,
    y: valueRange > 0 ? 164 - ((point.value - minValue) / valueRange) * 138 : 95,
  }));
  const chartPath = chartCoordinates.map((coordinate, index) => (
    `${index === 0 ? 'M' : 'L'}${coordinate.x.toFixed(1)} ${coordinate.y.toFixed(1)}`
  )).join(' ');
  const manualHistory = purchases.some((purchase) => Array.isArray(purchase.priceHistory) && purchase.priceHistory.length > 1);

  const [phoneNode, setPhoneNode] = useState(null);
  const [accent, setAccent] = useState(() => getFallbackAccent(investment));
  const [topOffset, setTopOffset] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const bodyRef = useRef(null);
  const dragRef = useRef({ startY: 0, lastY: 0, startTime: 0, active: false, canDrag: false });
  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);
  const chartRef = useRef(null);
  const [scrubIndex, setScrubIndex] = useState(null);

  useEffect(() => {
    setScrubIndex(null);
  }, [period, detailPoints.length]);

  const scrubChart = (clientX) => {
    const element = chartRef.current;
    const count = detailPoints.length;
    if (!element || count === 0) return;
    const { left, width } = element.getBoundingClientRect();
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    setScrubIndex(count > 1 ? Math.round(ratio * (count - 1)) : 0);
  };

  const handleChartKeyDown = (event) => {
    const count = detailPoints.length;
    if (count === 0) return;
    const current = scrubIndex ?? count - 1;
    let next;
    if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
    else if (event.key === 'ArrowRight') next = Math.min(count - 1, current + 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else if (event.key === 'Escape') {
      if (scrubIndex === null) return;
      event.stopPropagation();
      setScrubIndex(null);
      return;
    } else return;
    event.preventDefault();
    setScrubIndex(next);
  };

  const scrubPoint = scrubIndex !== null ? detailPoints[scrubIndex] ?? null : null;
  const scrubCoordinate = scrubPoint ? chartCoordinates[scrubIndex] : null;
  const shownPoint = scrubPoint ?? detailPoints[detailPoints.length - 1] ?? null;
  const firstPrice = detailPoints[0]?.price ?? 0;
  const priceChangeAmount = shownPoint ? shownPoint.price - firstPrice : 0;
  const priceChangePercent = shownPoint && firstPrice > 0 ? (priceChangeAmount / firstPrice) * 100 : 0;
  const chartTrend = profit < 0 ? 'negative' : 'positive';

  useEffect(() => {
    const phone = document.querySelector('.phone');
    const header = phone?.querySelector('.app-header');
    if (phone && header) {
      const phoneRect = phone.getBoundingClientRect();
      const headerBottom = header.getBoundingClientRect().bottom - phoneRect.top;
      setTopOffset(Math.min(Math.max(0, Math.round(headerBottom + 10)), Math.round(phoneRect.height * 0.45)));
    }
    setPhoneNode(phone || document.body);
    return () => window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!phoneNode) return undefined;
    let cancelled = false;
    const timers = [];
    const tryToSample = () => {
      const image = bodyRef.current?.querySelector('.investment-detail-identity img');
      const source = image?.currentSrc || image?.src;
      if (!source) return false;
      sampleImageColor(source).then((color) => {
        if (!cancelled && color) setAccent(color);
      });
      return true;
    };
    if (!tryToSample()) timers.push(window.setTimeout(tryToSample, 400));
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [phoneNode, assetKey]);

  const requestClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onBack, 220);
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') requestCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const finishDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setIsDragging(false);
    const distance = drag.lastY - drag.startY;
    const velocity = distance / Math.max(1, performance.now() - drag.startTime);
    if (distance > 110 || (distance > 40 && velocity > 0.6)) requestClose();
    else setDragY(0);
  };

  const handleGrabberPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { startY: event.clientY, lastY: event.clientY, startTime: performance.now(), active: true, canDrag: true };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleGrabberPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.lastY = event.clientY;
    setDragY(Math.max(0, event.clientY - drag.startY));
  };

  const handleBodyTouchStart = (event) => {
    const body = bodyRef.current;
    if (!body || event.touches.length !== 1) return;
    const y = event.touches[0].clientY;
    const isOnChart = Boolean(event.target.closest?.('[data-chart-scrub]'));
    dragRef.current = { startY: y, lastY: y, startTime: performance.now(), active: false, canDrag: body.scrollTop <= 0 && !isOnChart };
  };

  const handleBodyTouchMove = (event) => {
    const drag = dragRef.current;
    if (!drag.canDrag || event.touches.length !== 1) return;
    const y = event.touches[0].clientY;
    const distance = y - drag.startY;
    if (!drag.active) {
      if (distance < 6) return;
      drag.active = true;
      setIsDragging(true);
    }
    drag.lastY = y;
    setDragY(Math.max(0, distance));
  };

  if (!phoneNode) return null;

  return createPortal(
    <div
      className="investment-sheet-layer"
      style={{ top: topOffset, opacity: isClosing ? 0 : 1, transition: 'opacity 0.22s ease-out' }}
      onMouseDown={requestClose}
    >
      <section
        className="investment-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${investment.name}`}
        style={{
          transform: isClosing ? 'translateY(100%)' : dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.22s ease-out',
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="investment-sheet-grabber"
          onPointerDown={handleGrabberPointerDown}
          onPointerMove={handleGrabberPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="investment-sheet-handle" />
        </div>
        <div
          className="investment-sheet-body"
          ref={bodyRef}
          onTouchStart={handleBodyTouchStart}
          onTouchMove={handleBodyTouchMove}
          onTouchEnd={finishDrag}
          onTouchCancel={finishDrag}
        >
          <div className="investment-detail-page">
            <div className="investment-detail-identity">
              {investment.asset
                ? <InvestmentAssetIcon asset={investment.asset} className="size-14" />
                : (
                  <span
                    className="asset-logo"
                    style={getAssetLogoStyle(investment.name, investment.asset?.symbol)}
                  >
                    {investment.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              <span className="investment-detail-name">{investment.name}</span>
              {investment.asset?.symbol && <span className="investment-detail-symbol">{investment.asset.symbol}</span>}
            </div>

            <section className="investment-detail-balance">
              <span>
                {scrubPoint
                  ? formatScrubLabel(scrubPoint.timestamp, period)
                  : investment.asset ? 'Precio actual del activo' : 'Valor actual de la posición'}
              </span>
              <div className="investment-detail-value-row">
                <strong>
                  {displayMoney(scrubPoint && investment.asset ? scrubPoint.price : investment.asset ? currentPrice : currentValue)}
                </strong>
                {investment.asset && <span>por unidad</span>}
              </div>
              {investment.asset && shownPoint && detailPoints.length > 1 && (
                <div className={`investment-detail-delta ${priceChangeAmount >= 0 ? 'up' : 'down'}`}>
                  <span>
                    {priceChangeAmount >= 0 ? '▲' : '▼'}{' '}
                    {priceChangeAmount > 0 ? '+' : ''}{displayMoney(priceChangeAmount)}
                    {' '}({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)} %)
                  </span>
                  <span className="investment-detail-delta-note">
                    {scrubPoint ? `Tu posición ${displayMoney(scrubPoint.value)}` : period}
                  </span>
                </div>
              )}
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
                <div
                  ref={chartRef}
                  className="investment-chart-scrub"
                  data-chart-scrub
                  role="slider"
                  tabIndex={0}
                  aria-label={`Valor histórico de tu posición en ${investment.name}`}
                  aria-orientation="horizontal"
                  aria-valuemin={0}
                  aria-valuemax={detailPoints.length - 1}
                  aria-valuenow={scrubIndex ?? detailPoints.length - 1}
                  aria-valuetext={shownPoint ? `${formatScrubLabel(shownPoint.timestamp, period)}: ${displayMoney(shownPoint.price)} por unidad, tu posición ${displayMoney(shownPoint.value)}` : undefined}
                  onPointerDown={(event) => {
                    if (event.pointerType !== 'mouse') event.currentTarget.setPointerCapture?.(event.pointerId);
                    scrubChart(event.clientX);
                  }}
                  onPointerMove={(event) => scrubChart(event.clientX)}
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
                      {scrubCoordinate && (
                        <clipPath id="investment-detail-scrub-clip">
                          <rect x="0" y="-20" width={scrubCoordinate.x} height="230" />
                        </clipPath>
                      )}
                    </defs>
                    <path className="baseline" d={`M0 ${(detailPoints.length > 1 ? chartCoordinates[0].y : 164).toFixed(1)}H390`} />
                    {scrubCoordinate && <path className={`spend-line ${chartTrend}`} d={chartPath} style={{ opacity: 0.28 }} />}
                    <path
                      className={`spend-line ${chartTrend}`}
                      d={chartPath}
                      clipPath={scrubCoordinate ? 'url(#investment-detail-scrub-clip)' : undefined}
                    />
                  </svg>
                  {scrubCoordinate && (
                    <span
                      aria-hidden="true"
                      className="investment-chart-cursor"
                      style={{ left: `${(scrubCoordinate.x / 390) * 100}%` }}
                    />
                  )}
                  {(scrubCoordinate || chartCoordinates.length > 0) && (
                    <span
                      aria-hidden="true"
                      className={`investment-chart-dot ${chartTrend} ${scrubCoordinate ? 'active' : ''}`}
                      style={{
                        left: `${((scrubCoordinate ?? chartCoordinates[chartCoordinates.length - 1]).x / 390) * 100}%`,
                        top: `${((scrubCoordinate ?? chartCoordinates[chartCoordinates.length - 1]).y / 190) * 100}%`,
                      }}
                    />
                  )}
                </div>
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
              </div>
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
                        : (
                          <span
                            className="asset-logo"
                            style={getAssetLogoStyle(investment.name, investment.asset?.symbol)}
                          >
                            {investment.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
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
          </div>
        </div>
        <div className="investment-sheet-footer">
          {isConfirmingSale ? (
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
                  style={{ background: accent, color: getReadableTextColor(accent) }}
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
          ) : (
            <button
              type="button"
              className="investment-sell-action"
              disabled={investment.asset && !currentPrice}
              style={{ background: accent, color: getReadableTextColor(accent) }}
              onClick={() => {
                setSaleError('');
                setIsConfirmingSale(true);
              }}
            >
              Vender todo
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>,
    phoneNode,
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
                  : (
                    <span
                      className="asset-logo"
                      style={getAssetLogoStyle(record.name, record.asset?.symbol)}
                    >
                      {symbol.slice(0, 1).toUpperCase()}
                    </span>
                  )}
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

      {selectedInvestment && (
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
      )}
    </>
  );
};

export default InvestmentsOverview;

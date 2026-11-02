import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, RefreshCw, TrendingUp, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, formatUnitPrice, getLocalDateString } from '../utils/helpers';
import { getInvestmentHistory, getInvestmentQuote, getInvestmentQuotes } from '../utils/investmentMarketData';
import { Card } from './ui/card';
import AnimatedCurrency from './AnimatedCurrency';
import InvestmentAssetPicker from './InvestmentAssetPicker';
import InvestmentAssetIcon from './InvestmentAssetIcon';

const allocationColors = {
  Fondos: '#10b981',
  Depósitos: '#0ea5e9',
  Acciones: '#f59e0b',
  Cripto: '#8b5cf6',
  Otros: '#71717a',
};

const getAllocationCategory = (assetType) => {
  const normalizedType = String(assetType || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/crypto|cripto/.test(normalizedType)) return 'Cripto';
  if (/deposit|cash/.test(normalizedType)) return 'Depósitos';
  if (/fund|etf/.test(normalizedType)) return 'Fondos';
  if (/stock|equity|accion/.test(normalizedType)) return 'Acciones';
  return 'Otros';
};

const InvestmentsOverview = ({ isFormOpen, onFormOpenChange }) => {
  const {
    investmentRecords,
    addInvestmentRecord,
    updateInvestmentRecord,
    updateInvestmentPrice,
    deleteInvestmentRecord,
  } = useFinance();
  const [editingId, setEditingId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [date, setDate] = useState(getLocalDateString());
  const [investedAmount, setInvestedAmount] = useState('');
  const [previewQuote, setPreviewQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [marketNotice, setMarketNotice] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1D');
  const [marketHistory, setMarketHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!isFormOpen) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      document.querySelector('#investment-form input[type="search"]')?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onFormOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormOpen]);

  const [portfolioChartPeriod, setPortfolioChartPeriod] = useState('1M');
  const [portfolioHistoryByAsset, setPortfolioHistoryByAsset] = useState({});
  const [isLoadingPortfolioHistory, setIsLoadingPortfolioHistory] = useState(false);
  const [portfolioHistoryError, setPortfolioHistoryError] = useState('');
  const selectedRecord = investmentRecords.find((record) => record.id === selectedRecordId) || null;
  const selectedAssetRecords = useMemo(() => {
    if (!selectedRecord) return [];
    if (!selectedRecord.asset) return [selectedRecord];
    return investmentRecords.filter((record) => (
      record.asset?.provider === selectedRecord.asset.provider
      && record.asset?.id === selectedRecord.asset.id
    ));
  }, [investmentRecords, selectedRecord]);
  const selectedHistory = useMemo(() => {
    const historyByTimestamp = new Map();
    marketHistory.forEach((point) => {
      const timestamp = Date.parse(point.timestamp);
      const price = Number(point.price);
      if (Number.isFinite(timestamp) && Number.isFinite(price) && price > 0) {
        historyByTimestamp.set(timestamp, { timestamp: new Date(timestamp).toISOString(), price });
      }
    });
    selectedAssetRecords.forEach((record) => {
      const points = Array.isArray(record.priceHistory) ? record.priceHistory : [];
      points.forEach((point) => {
        const timestamp = Date.parse(point.timestamp);
        const price = Number(point.price);
        if (Number.isFinite(price) && price > 0 && Number.isFinite(timestamp)) {
          historyByTimestamp.set(timestamp, { timestamp: new Date(timestamp).toISOString(), price });
        }
      });
      const currentTimestamp = Date.parse(record.lastPriceUpdated);
      const currentPrice = Number(record.currentPrice);
      if (Number.isFinite(currentTimestamp) && Number.isFinite(currentPrice) && currentPrice > 0) {
        historyByTimestamp.set(currentTimestamp, {
          timestamp: new Date(currentTimestamp).toISOString(),
          price: currentPrice,
        });
      }
    });
    const history = [...historyByTimestamp.values()]
      .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));
    const periodDuration = {
      LIVE: 24 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1S': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      '1A': 365 * 24 * 60 * 60 * 1000,
    }[chartPeriod];
    if (!periodDuration || history.length === 0) return history;
    const startTime = Date.now() - periodDuration;
    const periodHistory = history.filter((point) => Date.parse(point.timestamp) >= startTime);
    return periodHistory;
  }, [selectedAssetRecords, chartPeriod, marketHistory]);
  const chartGeometry = useMemo(() => {
    if (selectedHistory.length === 0) return null;
    let chartHistory = selectedHistory;
    if (selectedHistory.length > 500) {
      const bucketSize = selectedHistory.length / 250;
      chartHistory = [selectedHistory[0]];
      for (let bucket = 0; bucket < 250; bucket += 1) {
        const start = Math.floor(bucket * bucketSize);
        const end = Math.min(Math.floor((bucket + 1) * bucketSize), selectedHistory.length);
        let minimumIndex = start;
        let maximumIndex = start;
        for (let index = start + 1; index < end; index += 1) {
          if (Number(selectedHistory[index].price) < Number(selectedHistory[minimumIndex].price)) minimumIndex = index;
          if (Number(selectedHistory[index].price) > Number(selectedHistory[maximumIndex].price)) maximumIndex = index;
        }
        [minimumIndex, maximumIndex]
          .sort((left, right) => left - right)
          .forEach((index) => {
            if (chartHistory[chartHistory.length - 1] !== selectedHistory[index]) {
              chartHistory.push(selectedHistory[index]);
            }
          });
      }
      if (chartHistory[chartHistory.length - 1] !== selectedHistory[selectedHistory.length - 1]) {
        chartHistory.push(selectedHistory[selectedHistory.length - 1]);
      }
    }
    const prices = selectedHistory.map((point) => Number(point.price));
    const minimum = Math.min(...prices);
    const maximum = Math.max(...prices);
    const padding = maximum === minimum
      ? Math.max(maximum * 0.002, Number.EPSILON)
      : (maximum - minimum) * 0.15;
    const low = minimum - padding;
    const high = maximum + padding;
    const firstTime = Date.parse(chartHistory[0].timestamp);
    const lastTime = Date.parse(chartHistory[chartHistory.length - 1].timestamp);
    const timeSpan = lastTime - firstTime;
    const points = chartHistory.map((point) => {
      const x = timeSpan > 0 ? ((Date.parse(point.timestamp) - firstTime) / timeSpan) * 1000 : 500;
      const y = 16 + ((high - Number(point.price)) / (high - low)) * 218;
      return { x, y };
    });
    const firstPrice = prices[0];
    const currentPrice = prices[prices.length - 1];
    return {
      polyline: points.length > 1 ? points.map((point) => `${point.x},${point.y}`).join(' ') : '',
      lastPoint: points[points.length - 1],
      hasTrend: points.length > 1,
      difference: currentPrice - firstPrice,
      differencePercent: firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0,
    };
  }, [selectedHistory]);
  const trackedAssetKey = investmentRecords
    .filter((record) => record.asset && Number.isFinite(Number(record.units)))
    .map((record) => `${record.id}:${record.asset.provider}:${record.asset.id}`)
    .sort()
    .join('|');
  const totals = useMemo(() => investmentRecords.reduce((result, record) => {
    const invested = Number(record.investedAmount) || 0;
    const current = Number(record.currentValue) || 0;
    result.invested += invested;
    result.currentValue += current;
    return result;
  }, { invested: 0, currentValue: 0 }), [investmentRecords]);
  const performance = totals.currentValue - totals.invested;
  const performancePercent = totals.invested > 0 ? (performance / totals.invested) * 100 : 0;
  const selectedAssetKey = selectedRecord?.asset
    ? `${selectedRecord.asset.provider}:${selectedRecord.asset.id}`
    : '';
  const portfolioAssetGroups = useMemo(() => {
    const groups = new Map();
    investmentRecords.forEach((record) => {
      if (!record.asset?.provider || !record.asset?.id) return;
      const units = Number(record.units);
      if (!Number.isFinite(units) || units <= 0) return;

      const key = `${record.asset.provider}:${record.asset.id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          asset: record.asset,
          lots: [],
          localHistory: [],
          currentPrice: Number(record.currentPrice) || 0,
        });
      }
      const group = groups.get(key);
      group.lots.push({ date: record.date, units });
      if (Array.isArray(record.priceHistory)) group.localHistory.push(...record.priceHistory);
      const updatedAt = Date.parse(record.lastPriceUpdated);
      const currentPrice = Number(record.currentPrice);
      if (Number.isFinite(updatedAt) && Number.isFinite(currentPrice) && currentPrice > 0) {
        group.localHistory.push({ timestamp: new Date(updatedAt).toISOString(), price: currentPrice });
      }
      if (currentPrice > 0) group.currentPrice = currentPrice;
    });

    return [...groups.values()].map((group) => ({
      ...group,
      lots: group.lots.sort((left, right) => left.date.localeCompare(right.date)),
    }));
  }, [investmentRecords]);
  const portfolioAssetKey = portfolioAssetGroups
    .map(({ key, lots }) => `${key}:${lots.map((lot) => `${lot.date}-${lot.units}`).join(',')}`)
    .join('|');

  useEffect(() => {
    if (portfolioAssetGroups.length === 0) {
      setPortfolioHistoryByAsset({});
      setPortfolioHistoryError('');
      setIsLoadingPortfolioHistory(false);
      return undefined;
    }

    const controller = new AbortController();
    let isCancelled = false;
    setIsLoadingPortfolioHistory(true);
    setPortfolioHistoryError('');
    Promise.all(portfolioAssetGroups.map(async (group) => {
      try {
        const remoteHistory = await getInvestmentHistory(group.asset, portfolioChartPeriod, controller.signal);
        return { key: group.key, points: [...group.localHistory, ...remoteHistory], error: '' };
      } catch (error) {
        if (controller.signal.aborted) return { key: group.key, points: [], error: '' };
        return { key: group.key, points: group.localHistory, error: error.message };
      }
    })).then((results) => {
      if (isCancelled) return;
      setPortfolioHistoryByAsset(Object.fromEntries(results.map(({ key, points }) => [key, points])));
      const failures = results.filter(({ error }) => error);
      setPortfolioHistoryError(failures.length > 0
        ? 'Algunos históricos no están disponibles; se muestran las cotizaciones guardadas.'
        : '');
    }).finally(() => {
      if (!isCancelled) setIsLoadingPortfolioHistory(false);
    });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [portfolioAssetKey, portfolioChartPeriod]);

  const portfolioChartValues = useMemo(() => {
    const groups = portfolioAssetGroups.map((group) => {
      const pointsByTimestamp = new Map();
      (portfolioHistoryByAsset[group.key] || []).forEach((point) => {
        const timestamp = Date.parse(point.timestamp);
        const price = Number(point.price);
        if (Number.isFinite(timestamp) && Number.isFinite(price) && price > 0) {
          pointsByTimestamp.set(timestamp, price);
        }
      });
      return {
        points: [...pointsByTimestamp.entries()]
          .sort(([left], [right]) => left - right)
          .map(([timestamp, price]) => ({ timestamp, price })),
        pointIndex: 0,
        latestPoint: null,
        lots: group.lots.map((lot) => ({
          timestamp: Date.parse(`${lot.date}T00:00:00`),
          units: lot.units,
        })).filter((lot) => Number.isFinite(lot.timestamp))
          .sort((left, right) => left.timestamp - right.timestamp),
        lotIndex: 0,
        acquiredUnits: 0,
        currentPrice: group.currentPrice,
      };
    }).filter((group) => group.points.length > 0 || group.currentPrice > 0);
    if (groups.length === 0) return [];

    const now = Date.now();
    const timestamps = new Set(groups.flatMap((group) => group.points.map(({ timestamp }) => timestamp)));
    if (groups.some((group) => group.currentPrice > 0)) timestamps.add(now);

    return [...timestamps].sort((left, right) => left - right).flatMap((timestamp) => {
      let value = 0;
      groups.forEach((group) => {
        while (group.pointIndex < group.points.length && group.points[group.pointIndex].timestamp <= timestamp) {
          group.latestPoint = group.points[group.pointIndex];
          group.pointIndex += 1;
        }
        while (group.lotIndex < group.lots.length && group.lots[group.lotIndex].timestamp <= timestamp) {
          group.acquiredUnits += group.lots[group.lotIndex].units;
          group.lotIndex += 1;
        }
        if (group.acquiredUnits <= 0) return;
        const price = timestamp === now && group.currentPrice > 0
          ? group.currentPrice
          : group.latestPoint?.price;
        if (Number.isFinite(price) && price > 0) value += group.acquiredUnits * price;
      });
      return value > 0 ? [{ timestamp, value }] : [];
    });
  }, [portfolioAssetGroups, portfolioHistoryByAsset]);

  const portfolioChartGeometry = useMemo(() => {
    if (portfolioChartValues.length === 0) return null;
    const values = portfolioChartValues.map(({ value }) => value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum;
    const padding = range > 0 ? range * 0.12 : Math.max(maximum * 0.002, 0.01);
    const low = Math.max(0, minimum - padding);
    const high = maximum + padding;
    const points = portfolioChartValues.map(({ value }, index) => ({
      x: portfolioChartValues.length > 1 ? (index / (portfolioChartValues.length - 1)) * 1000 : 1000,
      y: 12 + ((high - value) / (high - low)) * 152,
    }));
    const currentValue = values[values.length - 1];
    const firstValue = values[0];

    return {
      points,
      line: points.map(({ x, y }) => `${x},${y}`).join(' '),
      area: [`0,180`, points.map(({ x, y }) => `${x},${y}`).join(' '), `1000,180`].join(' '),
      lastPoint: points[points.length - 1],
      difference: currentValue - firstValue,
      differencePercent: firstValue > 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0,
    };
  }, [portfolioChartValues]);

  const portfolioAllocation = useMemo(() => {
    const amounts = new Map();
    investmentRecords.forEach((record) => {
      const value = Number(record.currentValue) || 0;
      if (value <= 0) return;
      const category = getAllocationCategory(record.asset?.type);
      amounts.set(category, (amounts.get(category) || 0) + value);
    });
    return [...amounts.entries()]
      .map(([category, value]) => ({ category, value, color: allocationColors[category] }))
      .sort((left, right) => right.value - left.value);
  }, [investmentRecords]);

  const portfolioAssetCount = new Set(investmentRecords.map((record) => (
    record.asset ? `${record.asset.provider}:${record.asset.id}` : `manual:${record.id}`
  ))).size;

  useEffect(() => {
    if (!selectedRecord?.asset) {
      setMarketHistory([]);
      setHistoryError('');
      setIsLoadingHistory(false);
      return undefined;
    }

    const controller = new AbortController();
    setMarketHistory([]);
    setIsLoadingHistory(true);
    setHistoryError('');
    getInvestmentHistory(selectedRecord.asset, chartPeriod, controller.signal)
      .then((points) => setMarketHistory(points))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMarketHistory([]);
          setHistoryError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingHistory(false);
      });

    return () => controller.abort();
  }, [selectedAssetKey, chartPeriod, selectedRecordId]);

  useEffect(() => {
    let isCancelled = false;
    const refreshPrices = async () => {
      const trackedRecords = investmentRecords.filter(
        (record) => record.asset && Number.isFinite(Number(record.units)),
      );
      if (trackedRecords.length === 0) {
        setIsRefreshing(false);
        setMarketNotice('');
        return;
      }

      setIsRefreshing(true);
      try {
        const { quotes, failures } = await getInvestmentQuotes(trackedRecords.map((record) => record.asset));
        trackedRecords.forEach((record) => {
          const quote = quotes.get(`${record.asset.provider}:${record.asset.id}`);
          if (quote) updateInvestmentPrice(record.id, quote);
        });
        if (isCancelled) return;

        setMarketNotice(failures.length > 0
          ? `No se pudieron actualizar algunas cotizaciones. ${failures[0].message}`
          : `Cotizaciones actualizadas a las ${new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date())}.`);
      } catch (error) {
        if (!isCancelled) setMarketNotice(`No se pudieron actualizar las cotizaciones. ${error.message}`);
      } finally {
        if (!isCancelled) setIsRefreshing(false);
      }
    };

    refreshPrices();
    const intervalId = window.setInterval(refreshPrices, 60 * 1000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [trackedAssetKey, refreshKey, updateInvestmentPrice]);

  useEffect(() => {
    if (!selectedAsset) {
      setPreviewQuote(null);
      setIsLoadingQuote(false);
      return undefined;
    }

    let isCancelled = false;
    setPreviewQuote(null);
    setIsLoadingQuote(true);
    getInvestmentQuote(selectedAsset)
      .then((quote) => {
        if (!isCancelled) setPreviewQuote(quote);
      })
      .catch((error) => {
        if (!isCancelled) setErrorMessage(`No se pudo consultar el precio. ${error.message}`);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingQuote(false);
      });

    return () => { isCancelled = true; };
  }, [selectedAsset]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (!selectedAsset) {
      setErrorMessage('Busca y selecciona el activo en el que has invertido.');
      return;
    }

    const invested = Number(investedAmount);
    if (!Number.isFinite(invested) || invested <= 0) {
      setErrorMessage('El capital aportado debe ser mayor que cero.');
      return;
    }

    setIsSaving(true);
    try {
      const quote = await getInvestmentQuote(selectedAsset);
      const existingRecord = investmentRecords.find((record) => record.id === editingId);
      const sameAsset = existingRecord?.asset?.provider === selectedAsset.provider
        && existingRecord?.asset?.id === selectedAsset.id;
      const units = sameAsset
        && Number(existingRecord.units) > 0
        && invested === Number(existingRecord.investedAmount)
        ? Number(existingRecord.units)
        : invested / quote.priceEur;
      const investment = {
        name: selectedAsset.name,
        date,
        investedAmount: invested,
        asset: selectedAsset,
        units,
        currentPrice: quote.priceEur,
        currentValue: units * quote.priceEur,
        lastPriceUpdated: quote.updatedAt,
      };
      if (editingId) updateInvestmentRecord(editingId, investment);
      else addInvestmentRecord(investment);
      setSelectedAsset(null);
      setDate(getLocalDateString());
      setInvestedAmount('');
      setEditingId(null);
      setPreviewQuote(null);
      onFormOpenChange(false);
      onFormOpenChange(false);
    } catch (error) {
      setErrorMessage(`No se pudo consultar el precio o guardar la inversión. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (recordId) => {
    const investment = investmentRecords.find((record) => record.id === recordId);
    if (!investment || !window.confirm(`¿Eliminar la inversión "${investment.name}"?`)) return;
    try {
      deleteInvestmentRecord(recordId);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const startEditing = (record) => {
    setEditingId(record.id);
    onFormOpenChange(true);
    onFormOpenChange(true);
    setSelectedAsset(record.asset || null);
    setDate(record.date);
    setInvestedAmount(String(record.investedAmount));
    setErrorMessage('');
  };
  const cancelEditing = () => {
    setEditingId(null);
    onFormOpenChange(false);
    setSelectedAsset(null);
    setDate(getLocalDateString());
    setInvestedAmount('');
    setPreviewQuote(null);
    setErrorMessage('');
  };
  const openInvestmentDetails = (recordId) => {
    setChartPeriod('1D');
    setSelectedRecordId(recordId);
  };
  const closeInvestmentDetails = () => setSelectedRecordId(null);
  const portfolioAllocationTotal = portfolioAllocation.reduce((total, item) => total + item.value, 0);
  const hasUnlinkedInvestments = investmentRecords.some((record) => !record.asset);

  useEffect(() => {
    if (!selectedRecord) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeInvestmentDetails();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  return (
    <div className="mx-auto mt-4 w-full max-w-5xl min-w-0 space-y-4">
      <section aria-label="Resumen de inversiones" className="border-0 bg-transparent px-1 py-3 text-white shadow-none sm:px-2">
        <p className="text-sm font-medium text-zinc-400">Valor de cartera</p>
        <p className="privacy-sensitive mt-1 break-words text-5xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          <AnimatedCurrency value={totals.currentValue} />
        </p>
        <div className="mt-2 flex max-w-full flex-wrap items-center gap-2">
          <span data-preserve-colors className={`privacy-sensitive text-base font-semibold sm:text-lg ${performance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {performance > 0 ? '+' : ''}{formatCurrency(performance)}
          </span>
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-bold ${
            performance >= 0 ? 'bg-emerald-400 text-zinc-950' : 'bg-rose-400 text-zinc-950'
          }`} data-preserve-colors>
            {performance >= 0
              ? <ArrowUpRight size={14} aria-hidden="true" />
              : <ArrowDownLeft size={14} aria-hidden="true" />}
            {performancePercent > 0 ? '+' : ''}{performancePercent.toFixed(2)}%
          </span>
        </div>
        <p className="privacy-sensitive mt-4 text-sm text-zinc-500">
          Capital aportado {formatCurrency(totals.invested)}
        </p>
      </section>

      <Card as="section" data-phantom-surface aria-label="Evolución y distribución de la cartera" className="relative left-1/2 w-[calc(100vw-3rem)] max-w-7xl -translate-x-1/2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Evolución</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Valor de los activos vinculados</p>
          </div>
          {portfolioChartGeometry && (
            <span
              data-preserve-colors
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${
                portfolioChartGeometry.difference >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
              }`}
            >
              {portfolioChartGeometry.difference > 0 ? '+' : ''}{portfolioChartGeometry.differencePercent.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="mt-3 h-40 sm:h-48">
          {portfolioChartGeometry ? (
            <svg
              viewBox="0 0 1000 180"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Evolución de la cartera durante ${portfolioChartPeriod}`}
              className="size-full overflow-visible"
            >
              <defs>
                <linearGradient id="portfolio-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={portfolioChartGeometry.area} fill="url(#portfolio-chart-fill)" />
              {portfolioChartGeometry.points.length > 1 && (
                <polyline
                  points={portfolioChartGeometry.line}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <circle
                cx={portfolioChartGeometry.lastPoint.x}
                cy={portfolioChartGeometry.lastPoint.y}
                r="5"
                fill="#c4b5fd"
              />
            </svg>
          ) : isLoadingPortfolioHistory ? (
            <div role="status" className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              <TrendingUp size={18} className="mr-2 animate-pulse" aria-hidden="true" />
              Cargando evolución…
            </div>
          ) : (
            <p className="flex h-full items-center justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
              {portfolioAssetGroups.length > 0
                ? 'Aún no hay histórico disponible para este periodo.'
                : 'Vincula un activo para ver su evolución.'}
            </p>
          )}
        </div>

        <div className="mt-2 grid grid-cols-5 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-[#1C1C1C]" role="group" aria-label="Periodo del gráfico de cartera">
          {[
            ['1S', '1S', '1 semana'],
            ['1M', '1M', '1 mes'],
            ['3M', '3M', '3 meses'],
            ['1A', '1A', '1 año'],
            ['TODO', 'Todo', 'Todo el histórico'],
          ].map(([period, label, title]) => (
            <button
              key={period}
              type="button"
              onClick={() => setPortfolioChartPeriod(period)}
              aria-label={title}
              aria-pressed={portfolioChartPeriod === period}
              className={`min-w-0 rounded-lg px-1 py-2 text-xs font-medium transition-colors ${
                portfolioChartPeriod === period
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-[#28282C] dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {portfolioHistoryError && (
          <p role="status" className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{portfolioHistoryError}</p>
        )}

        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-white/10">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Distribución</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {portfolioAssetCount} {portfolioAssetCount === 1 ? 'activo' : 'activos'}
            </span>
          </div>
          {portfolioAllocation.length > 0 ? (
            <>
              <div
                role="img"
                aria-label={`Distribución de la cartera: ${portfolioAllocation.map(({ category, value }) => `${category} ${Math.round((value / portfolioAllocationTotal) * 100)}%`).join(', ')}`}
                className="flex h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
              >
                {portfolioAllocation.map(({ category, value, color }) => (
                  <span
                    key={category}
                    className="h-full"
                    style={{ width: `${(value / portfolioAllocationTotal) * 100}%`, backgroundColor: color }}
                  />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {portfolioAllocation.map(({ category, value, color }) => (
                  <li key={category} className="flex min-w-0 items-center gap-1.5 text-xs">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{category}</span>
                    <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                      {Math.round((value / portfolioAllocationTotal) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aún no hay inversiones para distribuir.</p>
          )}
          {hasUnlinkedInvestments && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Las inversiones sin activo vinculado se incluyen en “Otros” y no en el histórico.
            </p>
          )}
        </div>
      </Card>

      {isFormOpen && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onFormOpenChange(false);
        }}
      >
      <section
        id="investment-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="investment-form-title"
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#FFFDF8] p-5 text-zinc-900 shadow-xl dark:bg-[#28282C] dark:text-white sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="investment-form-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? 'Editar inversión' : 'Registrar inversión'}
          </h2>
          <button
            type="button"
            onClick={() => onFormOpenChange(false)}
            aria-label="Cerrar formulario de inversión"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Busca el activo: el valor de mercado y las ganancias se calcularán con su cotización y las unidades estimadas.
        </p>
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 max-w-full sm:col-span-2 lg:col-span-4">
            <InvestmentAssetPicker
              value={selectedAsset}
              onChange={(asset) => {
                setSelectedAsset(asset);
                setErrorMessage('');
              }}
            />
            <p role="status" className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {isLoadingQuote
                ? 'Consultando precio de mercado…'
                : previewQuote
                  ? `Precio actual: ${formatCurrency(previewQuote.priceEur)} por unidad · ${investedAmount && Number(investedAmount) > 0 ? `${(Number(investedAmount) / previewQuote.priceEur).toFixed(6)} unidades estimadas` : 'Elige el capital para estimar las unidades'}`
                  : 'El valor de la cartera se calculará automáticamente con la cotización del activo.'}
            </p>
          </div>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha de registro</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="box-border block h-11 min-w-0 w-full max-w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700 sm:text-sm"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Capital aportado (€)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={investedAmount}
              onChange={(event) => setInvestedAmount(event.target.value)}
              required
              className="box-border block h-11 min-w-0 w-full max-w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700 sm:text-sm"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={isLoadingQuote || isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#AB9FF2] px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#9A8BE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AB9FF2] disabled:cursor-wait disabled:opacity-60 dark:bg-[#AB9FF2] dark:text-zinc-950 dark:hover:bg-[#9A8BE8]"
            >
              {isSaving ? 'Consultando precio…' : editingId ? 'Guardar cambios' : <><Plus size={17} aria-hidden="true" />Guardar inversión</>}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEditing}
                className="ml-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <X size={16} aria-hidden="true" />
                Cancelar
              </button>
            )}
          </div>
        </form>
        {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>}
        {marketNotice && <p role="status" className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{marketNotice}</p>}
      </section>
      </div>
      )}

      <Card as="section" data-phantom-surface className="min-w-0 overflow-hidden border border-white/10 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center justify-between gap-3 border-zinc-100 px-4 py-4 dark:border-white/10 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Cartera</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {investmentRecords.length} {investmentRecords.length === 1 ? 'inversión' : 'inversiones'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={isRefreshing || !trackedAssetKey}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
            Actualizar precios
          </button>
        </div>
        {investmentRecords.length > 0 ? (
          <ul className="min-w-0 p-2 sm:p-3">
            {investmentRecords.map((record) => {
              const difference = Number(record.currentValue) - Number(record.investedAmount);
              return (
                <li key={record.id} className="flex min-w-0 items-center gap-1 rounded-2xl px-1 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.035] sm:gap-2 sm:px-2">
                  <button
                    type="button"
                    onClick={() => openInvestmentDetails(record.id)}
                    aria-label={`Ver gráfico de ${record.name}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:gap-3"
                  >
                    <InvestmentAssetIcon asset={record.asset || { name: record.name }} className="size-10 shrink-0 sm:size-11" />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{record.name}</span>
                      <span className="mt-0.5 block max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {record.asset?.symbol ? `${record.asset.symbol} · ` : ''}{formatDate(record.date)}
                      </span>
                      {record.asset && (
                        <span className="mt-0.5 block max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {Number(record.units).toFixed(6)} unidades · {record.currentPrice
                            ? `${formatUnitPrice(Number(record.currentPrice))} / unidad`
                            : 'cotización pendiente'}
                        </span>
                      )}
                      {!record.asset && (
                        <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-300">
                          Sin cotización automática · edita para vincular un activo
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 max-w-[38%] shrink-0 text-right sm:max-w-none">
                      <span className="privacy-sensitive block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(Number(record.currentValue))}
                      </span>
                      <span data-preserve-colors className={`privacy-sensitive mt-0.5 block truncate text-xs ${difference >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(record)}
                      aria-label={`Editar inversión ${record.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 sm:size-9"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      aria-label={`Eliminar inversión ${record.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 dark:!bg-[#28282C] text-white focus-visible:ring-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 sm:size-9"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aún no has registrado inversiones.
          </p>
        )}
      </Card>
      {selectedRecord && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInvestmentDetails();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="investment-chart-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4 text-zinc-950 dark:bg-black dark:text-white sm:rounded-3xl sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <InvestmentAssetIcon asset={selectedRecord.asset || { name: selectedRecord.name }} className="size-11 shrink-0" />
                <h2 id="investment-chart-title" className="truncate text-xl font-semibold">{selectedRecord.name}</h2>
              </div>
              <button
                type="button"
                onClick={closeInvestmentDetails}
                aria-label="Cerrar gráfico"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">Precio actual</p>
            <p className="privacy-sensitive mt-1 text-4xl font-semibold tracking-tight">
              {selectedRecord.currentPrice
                ? formatUnitPrice(Number(selectedRecord.currentPrice))
                : formatCurrency(Number(selectedRecord.currentValue))}
            </p>
            {chartGeometry?.hasTrend ? (
              <p
                data-preserve-colors
                className={`mt-2 text-sm font-semibold ${
                  chartGeometry.difference >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {chartGeometry.difference > 0 ? '+' : ''}
                {formatUnitPrice(Math.abs(chartGeometry.difference))}
                {' '}({chartGeometry.differencePercent > 0 ? '+' : ''}
                {chartGeometry.differencePercent.toFixed(2)}%) · {chartPeriod}
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {chartGeometry
                  ? 'La variación aparecerá al acumular más cotizaciones.'
                  : selectedRecord.asset
                    ? 'Aún no hay cotizaciones guardadas para este periodo.'
                    : 'Vincula este registro con un activo para consultar y graficar su cotización.'}
              </p>
            )}

            <div className="relative mt-6 h-56 w-full sm:h-72">
              {isLoadingHistory ? (
                <div className="flex size-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
                  <TrendingUp size={28} className="animate-pulse text-zinc-300 dark:text-zinc-700" aria-hidden="true" />
                </div>
              ) : chartGeometry ? (
                <>
                  <svg
                    viewBox="0 0 1000 250"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`Gráfico del precio de ${selectedRecord.name} durante ${chartPeriod}`}
                    className="size-full overflow-visible"
                  >
                    <polyline
                      points={chartGeometry.polyline}
                      fill="none"
                      stroke={chartGeometry.difference >= 0 ? '#22c55e' : '#f43f5e'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={chartGeometry.lastPoint.x}
                      cy={chartGeometry.lastPoint.y}
                      r="5"
                      fill={chartGeometry.difference >= 0 ? '#22c55e' : '#f43f5e'}
                    />
                  </svg>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${chartGeometry.lastPoint.x / 10}%`,
                      top: `${chartGeometry.lastPoint.y / 2.5}%`,
                    }}
                  >
                    <InvestmentAssetIcon
                      asset={selectedRecord.asset || { name: selectedRecord.name }}
                      className="size-8 border-2 border-white shadow-lg dark:border-black"
                    />
                  </span>
                </>
              ) : (
                <div className="flex size-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
                  <TrendingUp size={28} className="text-zinc-300 dark:text-zinc-700" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-6 gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
              {[
                ['LIVE', 'En vivo'],
                ['1D', '1D'],
                ['1S', '1S'],
                ['1M', '1M'],
                ['1A', '1A'],
                ['TODO', 'Todo'],
              ].map(([period, label]) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setChartPeriod(period)}
                  aria-pressed={chartPeriod === period}
                  className={`min-w-0 rounded-full px-1 py-2 text-xs font-medium transition-colors ${
                    chartPeriod === period
                      ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {isLoadingHistory
                ? 'Cargando histórico del mercado…'
                : historyError
                  ? historyError
                  : chartGeometry?.hasTrend
                ? `Historial del mercado · ${selectedHistory.length} cotizaciones`
                : selectedRecord.asset
                  ? 'Se muestra la última cotización; la curva aparecerá al acumular más datos.'
                  : `Capital aportado ${formatCurrency(Number(selectedRecord.investedAmount))}`}
            </p>

            <section aria-labelledby="asset-operations-title" className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="asset-operations-title" className="text-base font-semibold">Operaciones</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedAssetRecords.length} {selectedAssetRecords.length === 1 ? 'operación' : 'operaciones'}
                </span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {selectedAssetRecords
                  .slice()
                  .sort((left, right) => right.date.localeCompare(left.date))
                  .map((record) => (
                    <li key={record.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <InvestmentAssetIcon
                          asset={record.asset || { name: record.name }}
                          className="size-9"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{record.asset?.symbol || record.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(record.date)}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="privacy-sensitive text-sm font-semibold">
                          {formatCurrency(Number(record.investedAmount))}
                        </p>
                        {Number.isFinite(Number(record.units)) && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {Number(record.units).toFixed(6)} unidades
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Capital aportado total</span>
                <span className="privacy-sensitive font-semibold">
                  {formatCurrency(selectedAssetRecords.reduce(
                    (total, record) => total + (Number(record.investedAmount) || 0),
                    0,
                  ))}
                </span>
              </div>
            </section>
          </section>
        </div>
      )}
    </div>
  );
};

export default InvestmentsOverview;

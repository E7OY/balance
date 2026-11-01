import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, RefreshCw, TrendingUp, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, formatUnitPrice, getLocalDateString } from '../utils/helpers';
import { getInvestmentQuote, getInvestmentQuotes } from '../utils/investmentMarketData';
import { Card } from './ui/card';
import InvestmentAssetPicker from './InvestmentAssetPicker';
import InvestmentAssetIcon from './InvestmentAssetIcon';

const InvestmentsOverview = () => {
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
    setSelectedAsset(record.asset || null);
    setDate(record.date);
    setInvestedAmount(String(record.investedAmount));
    setErrorMessage('');
  };
  const cancelEditing = () => {
    setEditingId(null);
    setSelectedAsset(null);
    setDate(getLocalDateString());
    setInvestedAmount('');
    setPreviewQuote(null);
    setErrorMessage('');
  };

  return (
    <div className="mx-auto mt-4 w-full max-w-5xl min-w-0 space-y-4">
      <section aria-label="Resumen de inversiones" className="border-0 bg-transparent px-1 py-3 text-white shadow-none sm:px-2">
        <p className="text-sm font-medium text-zinc-400">Valor de cartera</p>
        <p className="privacy-sensitive mt-1 break-words text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          {formatCurrency(totals.currentValue)}
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

      <Card as="section" className="border border-white/10 p-5 dark:bg-zinc-900 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? 'Editar inversión' : 'Registrar inversión'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Busca el activo: el valor de mercado y las ganancias se calcularán con su cotización y las unidades estimadas.
          </p>
        </div>
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
          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha de registro</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Capital aportado (€)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={investedAmount}
              onChange={(event) => setInvestedAmount(event.target.value)}
              required
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={isLoadingQuote || isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
      </Card>

      <Card as="section" data-phantom-surface className="min-w-0 overflow-hidden border border-white/10 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 dark:border-white/10 sm:px-5">
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
          <ul className="min-w-0 divide-y divide-zinc-100 p-2 dark:divide-white/[0.06] sm:p-3">
            {investmentRecords.map((record) => {
              const difference = Number(record.currentValue) - Number(record.investedAmount);
              return (
                <li key={record.id} className="flex min-w-0 items-center gap-2.5 rounded-2xl px-2.5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.035] sm:gap-3 sm:px-3">
                  <InvestmentAssetIcon asset={record.asset || { name: record.name }} className="size-10 sm:size-11" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="max-w-full truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{record.name}</p>
                    <p className="mt-0.5 max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {record.asset?.symbol ? `${record.asset.symbol} · ` : ''}{formatDate(record.date)}
                    </p>
                    {record.asset && (
                      <p className="mt-0.5 max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {Number(record.units).toFixed(6)} unidades · {record.currentPrice
                          ? `${formatUnitPrice(Number(record.currentPrice))} / unidad`
                          : 'cotización pendiente'}
                      </p>
                    )}
                    {!record.asset && (
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                        Sin cotización automática · edita para vincular un activo
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 max-w-[38%] shrink-0 text-right sm:max-w-none">
                    <p className="privacy-sensitive truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(Number(record.currentValue))}
                    </p>
                    <p data-preserve-colors className={`privacy-sensitive mt-0.5 truncate text-xs ${difference >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                      {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                    </p>
                  </div>
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
                      className="inline-flex size-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 sm:size-9"
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
    </div>
  );
};

export default InvestmentsOverview;

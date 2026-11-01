import React, { useEffect, useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchInvestmentAssets } from '../utils/investmentMarketData';
import InvestmentAssetIcon from './InvestmentAssetIcon';

const InvestmentAssetPicker = ({ value, onChange }) => {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [warning, setWarning] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2 || value) {
      setAssets([]);
      setWarning('');
      setErrorMessage('');
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage('');
      try {
        const result = await searchInvestmentAssets(normalizedQuery, controller.signal);
        setAssets(result.assets);
        setWarning(result.warning);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAssets([]);
          setWarning('');
          setErrorMessage(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, value]);

  const clearSelection = () => {
    onChange(null);
    setQuery('');
    setAssets([]);
    setWarning('');
    setErrorMessage('');
  };

  return (
    <div className="min-w-0 w-full max-w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Buscar activo
      </label>
      {value ? (
        <div className="flex min-h-14 min-w-0 w-full max-w-full items-center gap-3 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-4 dark:border-white/10 dark:bg-zinc-900">
          <InvestmentAssetIcon asset={value} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{value.name}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{value.symbol} · {value.type}</p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Cambiar activo"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative min-w-0 w-full max-w-full">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bitcoin, MSCI World, AAPL…"
              autoComplete="off"
              minLength={2}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          {(isSearching || errorMessage || warning || (query.trim().length >= 2 && !assets.length)) && (
            <div className="mt-2 space-y-1">
              {isSearching && <p role="status" className="text-xs text-zinc-500 dark:text-zinc-400">Buscando activos…</p>}
              {errorMessage && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>}
              {warning && <p className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>}
              {!isSearching && !errorMessage && !assets.length && query.trim().length >= 2 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No se encontraron activos.</p>
              )}
            </div>
          )}
          {assets.length > 0 && (
            <ul className="mt-2 box-border max-h-56 w-full max-w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
              {assets.map((asset) => (
                <li key={`${asset.provider}:${asset.id}`} className="min-w-0 max-w-full">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(asset);
                      setAssets([]);
                      setWarning('');
                      setErrorMessage('');
                    }}
                    className="flex min-w-0 w-full max-w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-white/5"
                  >
                    <InvestmentAssetIcon asset={asset} className="size-9" />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">{asset.name}</span>
                      <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">{asset.symbol} · {asset.type}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentAssetPicker;

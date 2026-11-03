import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetPicker from './InvestmentAssetPicker';
import { getInvestmentQuote } from '../utils/investmentMarketData';


const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMoney = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
}).format(value);

const InvestmentForm = ({ onClose }) => {
  const { addInvestmentRecord } = useFinance();
  const [mode, setMode] = useState('market');
  const [asset, setAsset] = useState(null);
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(getToday);
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (mode !== 'market' || !asset) {
      setQuote(null);
      setQuoteError('');
      setIsLoadingQuote(false);
      return undefined;
    }

    const controller = new AbortController();
    setQuote(null);
    setQuoteError('');
    setIsLoadingQuote(true);

    getInvestmentQuote(asset, controller.signal)
      .then(setQuote)
      .catch((error) => {
        if (error.name !== 'AbortError') setQuoteError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingQuote(false);
      });

    return () => controller.abort();
  }, [asset, mode]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    try {
      const invested = Number(investedAmount);
      const record = mode === 'market'
        ? {
          name: asset?.name || '',
          date,
          investedAmount: invested,
          currentValue: quote && invested > 0
            ? Number(((invested / quote.priceEur) * quote.priceEur).toFixed(2))
            : 0,
          asset: quote?.image ? { ...asset, image: quote.image } : asset,
          units: quote && invested > 0 ? invested / quote.priceEur : 0,
          currentPrice: quote?.priceEur,
          lastPriceUpdated: quote?.updatedAt,
        }
        : {
          name,
          date,
          investedAmount: invested,
          currentValue: Number(currentValue),
        };

      addInvestmentRecord(record);
      onClose();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const parsedInvested = Number(investedAmount);
  const parsedCurrentValue = Number(currentValue);
  const canSubmit = mode === 'market'
    ? Boolean(asset && quote && parsedInvested > 0 && date && !isLoadingQuote)
    : Boolean(name.trim() && parsedInvested > 0 && Number.isFinite(parsedCurrentValue) && parsedCurrentValue >= 0 && date);

  return (
    <div className="sheet-layer" style={{ zIndex: 90 }} onMouseDown={onClose}>
      <section
        className="bottom-sheet investment-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="investment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="record-tabs" aria-label="Tipo de inversión">
          <button
            type="button"
            className={mode === 'market' ? 'active' : ''}
            onClick={() => setMode('market')}
          >
            Activo de mercado
          </button>
          <button
            type="button"
            className={mode === 'manual' ? 'active' : ''}
            onClick={() => setMode('manual')}
          >
            Manual
          </button>
        </div>

        <h2 id="investment-title">Añadir inversión</h2>
        <p>Registra una posición en tu cartera.</p>

        <form onSubmit={handleSubmit}>
          {mode === 'market' ? (
            <>
              <InvestmentAssetPicker value={asset} onChange={setAsset} />
              {isLoadingQuote && <p className="investment-status" role="status">Consultando cotización…</p>}
              {quoteError && <p className="investment-error" role="alert">{quoteError} Puedes registrarla en modo manual.</p>}
              {quote && (
                <p className="investment-status" aria-live="polite">
                  Precio actual: {formatMoney(quote.priceEur)} por unidad
                </p>
              )}
            </>
          ) : (
            <label>
              Nombre de la inversión
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="Ej.: Fondo indexado"
                required
              />
            </label>
          )}

          <label>
            Capital invertido (€)
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={investedAmount}
              onChange={(event) => setInvestedAmount(event.target.value)}
              placeholder="0,00"
              required
            />
          </label>

          {mode === 'manual' && (
            <label>
              Valor actual (€)
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={currentValue}
                onChange={(event) => setCurrentValue(event.target.value)}
                placeholder="0,00"
                required
              />
            </label>
          )}

          {mode === 'market' && quote && parsedInvested > 0 && (
            <p className="investment-preview">
              Valor actual estimado: {formatMoney(parsedInvested)}
            </p>
          )}

          <label>
            Fecha de compra
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          {formError && <p className="investment-error" role="alert">{formError}</p>}

          <button className="sheet-submit limits-submit investment-submit" type="submit" disabled={!canSubmit}>
            Comprar
            <svg className="ml-8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
};

export default InvestmentForm;

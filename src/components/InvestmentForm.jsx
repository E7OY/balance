import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import InvestmentAssetPicker from './InvestmentAssetPicker';
import { getInvestmentQuote } from '../utils/investmentMarketData';
import { triggerHaptic } from '../utils/haptics';

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
      .then((q) => {
        if (q.priceEur > 0) setQuote(q);
        else setQuoteError('Cotización no disponible ahora. Usa el modo manual.');
      })
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
          currentValue: invested,
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
      triggerHaptic();
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
    <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="investment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Cerrar">
          <X size={17} />
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

        <h2 id="investment-title">Nueva inversión</h2>
        <p>Añade una posición en tiempo real o manual a tu cartera.</p>

        <form onSubmit={handleSubmit}>
          {mode === 'market' ? (
            <div style={{ marginBottom: '12px' }}>
              <InvestmentAssetPicker value={asset} onChange={setAsset} />
              {isLoadingQuote && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Consultando cotización...
                </p>
              )}
              {quoteError && (
                <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 600, marginTop: '8px' }}>
                  {quoteError}
                </p>
              )}
              {quote && (
                <div style={{
                  marginTop: '10px', padding: '10px 14px', borderRadius: '14px',
                  background: 'rgba(0, 117, 235, 0.1)', color: 'var(--accent-blue)',
                  fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums'
                }}>
                  Precio actual: {formatMoney(quote.priceEur)} / ud
                </div>
              )}
            </div>
          ) : (
            <label>
              Nombre de la inversión
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="Ej. Fondo indexado MSCI World"
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
              style={{ fontVariantNumeric: 'tabular-nums' }}
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
                style={{ fontVariantNumeric: 'tabular-nums' }}
                required
              />
            </label>
          )}

          {mode === 'market' && quote && parsedInvested > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Recibirás aprox. {(parsedInvested / quote.priceEur).toFixed(6)} unidades
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

          {formError && (
            <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 700, marginBottom: '10px' }}>
              {formError}
            </p>
          )}

          <button className="sheet-submit" style={{ marginTop: '6px' }} type="submit" disabled={!canSubmit}>
            Confirmar inversión <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default InvestmentForm;
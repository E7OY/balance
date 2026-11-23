import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Bus,
  CreditCard,
  Download,
  Eye,
  Gamepad2,
  Heart,
  Home,
  Pencil,
  Plane,
  Scissors,
  ShoppingBag,
  ShoppingBasket,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { triggerHaptic } from '../utils/haptics';

const CUSTOM_STYLES_KEY = 'nexo-custom-category-styles';

const MoneyBagIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9.2 4.5H14.8L13.5 7H10.5L9.2 4.5Z"
      fill="currentColor"
    />
    <path
      d="M10.2 8.2H13.8C16.4 9.5 17.5 12.2 17.2 14.8C16.9 17.3 15 19 12 19C9 19 7.1 17.3 6.8 14.8C6.5 12.2 7.6 9.5 10.2 8.2Z"
      fill="currentColor"
    />
    <ellipse cx="17.8" cy="14.2" rx="2.7" ry="1.3" fill="currentColor" />
    <path d="M15.1 16.2C15.1 16.9 16.3 17.5 17.8 17.5C19.3 17.5 20.5 16.9 20.5 16.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15.1 18.2C15.1 18.9 16.3 19.5 17.8 19.5C19.3 19.5 20.5 18.9 20.5 18.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const REVOLUT_CATEGORY_PRESETS = [
  { id: 'topups', label: 'Recargas', bg: '#4B89DC', renderIcon: (s) => <MoneyBagIcon size={s} /> },
  { id: 'entertainment', label: 'Ocio', bg: '#DE5448', renderIcon: (s) => <Gamepad2 size={s} strokeWidth={2.1} /> },
  { id: 'travel', label: 'Viajes', bg: '#4B89DC', renderIcon: (s) => <Plane size={s} strokeWidth={2.1} /> },
  { id: 'donation', label: 'Donación', bg: '#DE5448', renderIcon: (s) => <Heart size={s} fill="currentColor" strokeWidth={1.8} /> },
  { id: 'groceries', label: 'Supermercado', bg: '#8CC152', renderIcon: (s) => <ShoppingBasket size={s} strokeWidth={2.1} /> },
  { id: 'health', label: 'Salud', bg: '#73CEDB', renderIcon: (s) => <Heart size={s} fill="currentColor" strokeWidth={1.8} /> },
  { id: 'restaurants', label: 'Restaurantes', bg: '#D47A47', renderIcon: (s) => <Utensils size={s} strokeWidth={2.1} /> },
  { id: 'shopping', label: 'Compras', bg: '#C94FA0', renderIcon: (s) => <ShoppingBag size={s} strokeWidth={2.1} /> },
  { id: 'services', label: 'Servicios', bg: '#6E74D8', renderIcon: (s) => <Briefcase size={s} strokeWidth={2.1} /> },
  { id: 'netsales', label: 'Ingresos', bg: '#65BC89', renderIcon: (s) => <Banknote size={s} strokeWidth={2.1} /> },
  { id: 'transport', label: 'Transporte', bg: '#7B5FF7', renderIcon: (s) => <Bus size={s} strokeWidth={2.1} /> },
  { id: 'utilities', label: 'Hogar', bg: '#967B6E', renderIcon: (s) => <Home size={s} strokeWidth={2.1} /> },
  { id: 'transfers', label: 'Transferencias', bg: '#7B5FF7', renderIcon: (s) => <ArrowLeftRight size={s} strokeWidth={2.2} /> },
];

export const getCustomCategoryPresetId = (category = '') => {
  try {
    const map = JSON.parse(localStorage.getItem(CUSTOM_STYLES_KEY) || '{}') || {};
    return map[category] || null;
  } catch {
    return null;
  }
};

export const setCustomCategoryPresetId = (category, presetId) => {
  try {
    const map = JSON.parse(localStorage.getItem(CUSTOM_STYLES_KEY) || '{}') || {};
    if (presetId) map[category] = presetId;
    else delete map[category];
    localStorage.setItem(CUSTOM_STYLES_KEY, JSON.stringify(map));
  } catch {}
};

const buildVisualsFromPreset = (preset, size) => ({
  presetId: preset.id,
  icon: preset.renderIcon(size),
  bg: preset.bg,
  softBg: `${preset.bg}24`,
  fg: preset.bg,
});

export const getCategoryVisuals = (category = '', type = 'Gasto', size = 17) => {
  const customPresetId = getCustomCategoryPresetId(category);
  if (customPresetId) {
    const found = REVOLUT_CATEGORY_PRESETS.find((p) => p.id === customPresetId);
    if (found) return buildVisualsFromPreset(found, size);
  }

  const norm = category.toLowerCase().trim();

  if (norm.includes('viaje') || norm.includes('vuelo') || norm.includes('hotel') || norm.includes('travel')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[2], size); // #4B89DC Plane
  }
  if (norm.includes('donaci') || norm.includes('regalo') || norm.includes('donation')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[3], size); // #DE5448 Heart
  }
  if (norm.includes('recarga') || norm.includes('top up') || norm.includes('ahorro')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[0], size); // #4B89DC MoneyBag
  }
  if (norm.includes('ocio') || norm.includes('entretenimiento') || norm.includes('juego') || norm.includes('cine') || norm.includes('entertainment')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[1], size); // #DE5448 Gamepad
  }
  if (norm.includes('comida') || norm.includes('supermercado') || norm.includes('grocer') || norm.includes('aliment')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[4], size); // #8CC152 ShoppingBasket
  }
  if (norm.includes('salud') || norm.includes('farmacia') || norm.includes('médico') || norm.includes('medico') || norm.includes('health')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[5], size); // #73CEDB Heart
  }
  if (norm.includes('restaurante') || norm.includes('bar') || norm.includes('café') || norm.includes('cafe') || norm.includes('cena')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[6], size); // #D47A47 Utensils
  }
  if (norm.includes('compra') || norm.includes('ropa') || norm.includes('tienda') || norm.includes('shopping')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[7], size); // #C94FA0 ShoppingBag
  }
  if (norm.includes('servicio') || norm.includes('suscrip') || norm.includes('trabajo') || norm.includes('nómina') || norm.includes('nomina') || norm.includes('sueldo')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[8], size); // #6E74D8 Briefcase
  }
  if (norm.includes('venta') || norm.includes('ingreso') || norm.includes('inversion') || norm.includes('net sales')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[9], size); // #65BC89 Banknote
  }
  if (norm.includes('transporte') || norm.includes('bus') || norm.includes('metro') || norm.includes('coche') || norm.includes('gasolina') || norm.includes('peaje')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[10], size); // #7B5FF7 Bus
  }
  if (norm.includes('hogar') || norm.includes('casa') || norm.includes('alquiler') || norm.includes('hipoteca') || norm.includes('luz') || norm.includes('agua') || norm.includes('utilit')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[11], size); // #967B6E Home
  }
  if (norm.includes('transfer') || norm.includes('bizum')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[12], size); // #7B5FF7 ArrowLeftRight
  }

  return type === 'Ingreso'
    ? buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[9], size)
    : buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[7], size);
};

const formatSmartDate = (isoDate = '', time = '') => {
  if (!isoDate) return '';
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let label = isoDate;
  if (isoDate === todayStr) {
    label = 'Hoy';
  } else if (isoDate === yesterdayStr) {
    label = 'Ayer';
  } else {
    const ts = Date.parse(`${isoDate}T00:00:00`);
    if (Number.isFinite(ts)) {
      label = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(ts);
    }
  }
  return time ? `${label}, ${time}` : label;
};

const TransactionItem = ({ transaction }) => {
  const {
    deleteTransaction,
    setEditingTransaction,
    updateTransaction,
    splitTransaction,
    previewInvoice,
    downloadInvoice,
    isAmountsHidden,
  } = useFinance();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(transaction.description || '');
  const [detailError, setDetailError] = useState('');
  const [phoneNode, setPhoneNode] = useState(null);

  const isExpense = transaction.type === 'Gasto';
  const visuals = getCategoryVisuals(transaction.category, transaction.type, 18);

  useEffect(() => {
    setPhoneNode(document.querySelector('.phone') || document.body);
  }, []);

  const numericAmount = Number(transaction.amount) || 0;
  const isWholeNumber = Number.isInteger(numericAmount);
  const formatted = isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: isWholeNumber ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);

  const titleText = transaction.description || transaction.category;
  const dateLabel = formatSmartDate(transaction.date, transaction.time);
  const subtitleParts = [dateLabel];
  if (transaction.description && transaction.category) {
    subtitleParts.push(transaction.category);
  }
  if (transaction.installment) {
    subtitleParts.push(`Cuota ${transaction.installment.current}/${transaction.installment.total}`);
  }

  const handleSaveNote = async () => {
    try {
      await updateTransaction(transaction.id, { description: noteText.trim() });
      setIsEditingNote(false);
      triggerHaptic();
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const handleUploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetailError('');
    try {
      await updateTransaction(transaction.id, { invoiceFile: file });
      triggerHaptic();
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const detailCardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--rounded-lg)',
    padding: 'var(--sp-xs) var(--sp-xl)',
    marginBottom: 'var(--sp-md)',
  };

  const detailRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-md) 0',
    fontSize: '14px',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDetailError('');
          setIsSplitting(false);
          setIsEditingNote(false);
          setNoteText(transaction.description || '');
          setIsDetailOpen(true);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '11px 0',
          background: 'transparent',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          gap: '14px',
        }}
      >
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--rounded-full)',
            backgroundColor: visuals.bg,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {visuals.icon}
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {titleText}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 400,
              color: 'var(--text-mute)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitleParts.filter(Boolean).join(' · ')}
          </span>
        </span>

        <span
          className="privacy-sensitive"
          style={{
            alignSelf: 'flex-start',
            marginTop: '2px',
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            color: isExpense ? 'var(--text-main)' : 'var(--accent-teal)',
            flexShrink: 0,
          }}
        >
          {isExpense ? '-' : '+'}{formatted}
        </span>
      </button>

      {isDetailOpen && phoneNode && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsDetailOpen(false)}>
          <section
            className="bottom-sheet"
            style={{ minHeight: '86dvh' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--sp-lg)' }}>
              <button
                type="button"
                className="sheet-close"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-xl)' }}>
              <div>
                <span
                  className="nx-display privacy-sensitive"
                  style={{
                    display: 'block',
                    fontSize: '36px',
                    color: isExpense ? 'var(--text-main)' : 'var(--accent-teal)',
                  }}
                >
                  {isExpense ? '−' : '+'}{formatted}
                </span>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--primary)', marginTop: 'var(--sp-xs)' }}>
                  {titleText}
                </span>
                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginTop: 'var(--sp-xxs)' }}>
                  {transaction.date}
                </span>
              </div>

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--rounded-full)',
                background: visuals.bg,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {getCategoryVisuals(transaction.category, transaction.type, 22).icon}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-xl)' }}>
              {isExpense && !transaction.installment && splitTransaction && (
                <button
                  type="button"
                  className="nx-btn-pill-sm"
                  style={{ flex: 1, color: 'var(--primary)' }}
                  onClick={() => setIsSplitting((v) => !v)}
                >
                  <Scissors size={14} /> Dividir gasto
                </button>
              )}

              <button
                type="button"
                className="nx-btn-pill-sm"
                style={{ flex: 1, color: 'var(--primary)' }}
                onClick={() => {
                  setIsDetailOpen(false);
                  setEditingTransaction(transaction);
                }}
              >
                <Pencil size={14} /> Editar movimiento
              </button>
            </div>

            {isSplitting && (
              <div style={{ ...detailCardStyle, padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                  Dividir en cuotas ({new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numericAmount / splitCount)}/mes)
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-xs)', marginBottom: 'var(--sp-md)' }}>
                  {[2, 3, 4, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitCount(n)}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: 'var(--rounded-full)',
                        border: 0,
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        background: splitCount === n ? 'var(--primary)' : 'var(--bg-card-alt)',
                        color: splitCount === n ? '#FFFFFF' : 'var(--text-main)',
                      }}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="nx-btn-dark"
                  style={{ width: '100%' }}
                  onClick={() => {
                    try {
                      splitTransaction(transaction.id, splitCount);
                      triggerHaptic();
                      setIsDetailOpen(false);
                    } catch (err) {
                      setDetailError(err.message);
                    }
                  }}
                >
                  Confirmar {splitCount} cuotas
                </button>
              </div>
            )}

            <div style={detailCardStyle}>
              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--border-hairline)' }}>
                <span style={{ color: 'var(--text-mute)' }}>Estado</span>
                <span style={{ fontWeight: 500 }}>Completado</span>
              </div>

              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--border-hairline)' }}>
                <span style={{ color: 'var(--text-mute)' }}>Método</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 500 }}>
                  <CreditCard size={15} /> {transaction.paymentMethod || 'Tarjeta'}
                </span>
              </div>

              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-mute)' }}>Justificante</span>
                {transaction.invoice ? (
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await previewInvoice(transaction.id);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (err) {
                          setDetailError(err.message);
                        }
                      }}
                      style={{ background: 'transparent', border: 0, color: 'var(--primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Eye size={14} /> Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadInvoice(transaction.id, transaction.invoice.name).catch((err) => setDetailError(err.message))}
                      style={{ background: 'transparent', border: 0, color: 'var(--primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Download size={14} /> Descargar
                    </button>
                  </div>
                ) : (
                  <label style={{ color: 'var(--primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Subir
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleUploadReceipt} />
                  </label>
                )}
              </div>
            </div>

            <div style={detailCardStyle}>
              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--border-hairline)' }}>
                <span style={{ color: 'var(--text-mute)' }}>Categoría</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 500 }}>
                  {getCategoryVisuals(transaction.category, transaction.type, 15).icon}
                  {transaction.category}
                </span>
              </div>

              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-mute)' }}>Importe en análisis</span>
                <span style={{ color: 'var(--primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {formatted}
                </span>
              </div>
            </div>

            <div style={detailCardStyle}>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-mute)' }}>Nota</span>
                {!isEditingNote ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    style={{ background: 'transparent', border: 0, color: 'var(--primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Pencil size={13} /> {transaction.description || 'Añadir nota'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flex: 1, marginLeft: '16px' }}>
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      style={{ margin: 0, height: '40px', fontSize: '14px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="nx-btn-pill-sm"
                      style={{ background: 'var(--primary)', color: '#FFFFFF' }}
                      onClick={handleSaveNote}
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>

            {detailError && (
              <p style={{ color: 'var(--danger-red)', fontSize: '12px', fontWeight: 500, marginBottom: 'var(--sp-md)' }}>
                {detailError}
              </p>
            )}

            <div style={detailCardStyle}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsDetailOpen(false);
                  deleteTransaction(transaction.id);
                }}
                style={{
                  ...detailRowStyle,
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  color: 'var(--danger-red)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <span>Eliminar movimiento</span>
                <Trash2 size={16} />
              </button>
            </div>
          </section>
        </div>,
        phoneNode,
      )}
    </>
  );
};

export default TransactionItem;
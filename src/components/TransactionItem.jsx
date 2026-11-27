import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Bus,
  Check,
  ChevronRight,
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
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[2], size);
  }
  if (norm.includes('donaci') || norm.includes('regalo') || norm.includes('donation')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[3], size);
  }
  if (norm.includes('recarga') || norm.includes('top up') || norm.includes('ahorro')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[0], size);
  }
  if (norm.includes('ocio') || norm.includes('entretenimiento') || norm.includes('juego') || norm.includes('cine') || norm.includes('entertainment')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[1], size);
  }
  if (norm.includes('comida') || norm.includes('supermercado') || norm.includes('grocer') || norm.includes('aliment')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[4], size);
  }
  if (norm.includes('salud') || norm.includes('farmacia') || norm.includes('médico') || norm.includes('medico') || norm.includes('health')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[5], size);
  }
  if (norm.includes('restaurante') || norm.includes('bar') || norm.includes('café') || norm.includes('cafe') || norm.includes('cena')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[6], size);
  }
  if (norm.includes('compra') || norm.includes('ropa') || norm.includes('tienda') || norm.includes('shopping')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[7], size);
  }
  if (norm.includes('servicio') || norm.includes('suscrip') || norm.includes('trabajo') || norm.includes('nómina') || norm.includes('nomina') || norm.includes('sueldo')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[8], size);
  }
  if (norm.includes('venta') || norm.includes('ingreso') || norm.includes('inversion') || norm.includes('net sales')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[9], size);
  }
  if (norm.includes('transporte') || norm.includes('bus') || norm.includes('metro') || norm.includes('coche') || norm.includes('gasolina') || norm.includes('peaje')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[10], size);
  }
  if (norm.includes('hogar') || norm.includes('casa') || norm.includes('alquiler') || norm.includes('hipoteca') || norm.includes('luz') || norm.includes('agua') || norm.includes('utilit')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[11], size);
  }
  if (norm.includes('transfer') || norm.includes('bizum')) {
    return buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[12], size);
  }

  return type === 'Ingreso'
    ? buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[9], size)
    : buildVisualsFromPreset(REVOLUT_CATEGORY_PRESETS[7], size);
};

const formatEuroAmount = (val) => {
  const num = Math.abs(Number(val) || 0);
  const formatted = new Intl.NumberFormat('es-ES', {
    useGrouping: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `€${formatted}`;
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
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      label = `${parts[2]}/${parts[1]}`;
    }
  }
  return time ? `${time} · ${label}` : label;
};

const formatFullDate = (isoDate = '', time = '') => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  const formatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
  return time ? `${formatted} · ${time}` : formatted;
};

const TX_DETAIL_STYLES = `
  .nx-txd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10050;
    background: rgba(10, 12, 20, 0.46);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .nx-txd-sheet {
    width: 100%;
    max-width: 460px;
    max-height: 90dvh;
    overflow-y: auto;
    border-radius: 30px 30px 0 0;
    background: #FAFAFB;
    color: #111827;
    padding: 10px 18px calc(24px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -16px 44px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    animation: nxTxdSheetUp 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .dark .nx-txd-sheet {
    background: #13151C;
    color: #FFFFFF;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }
  @keyframes nxTxdSheetUp {
    from { transform: translateY(100%); opacity: 0.7; }
    to { transform: translateY(0); opacity: 1; }
  }
  .nx-txd-grabber {
    width: 38px;
    height: 5px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.18);
    margin: 0 auto 12px;
  }
  .dark .nx-txd-grabber {
    background: rgba(255, 255, 255, 0.25);
  }
  .nx-txd-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .nx-txd-close {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .dark .nx-txd-close {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .nx-txd-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4px 8px 18px;
  }
  .nx-txd-avatar {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    margin-bottom: 12px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  }
  .nx-txd-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: #111827;
  }
  .dark .nx-txd-title {
    color: #FFFFFF;
  }
  .nx-txd-date {
    margin: 4px 0 0;
    font-size: 12.5px;
    font-weight: 500;
    color: #9CA3AF;
  }
  .nx-txd-amount {
    margin-top: 12px;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .nx-txd-amount.expense {
    color: #D93829;
  }
  .nx-txd-amount.income {
    color: #111827;
  }
  .dark .nx-txd-amount.income {
    color: #FFFFFF;
  }
  .nx-txd-status-pill {
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }
  .dark .nx-txd-status-pill {
    background: rgba(16, 185, 129, 0.18);
    color: #34D399;
  }
  .nx-txd-actions {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin: 2px 0 20px;
  }
  .nx-txd-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    min-width: 72px;
  }
  .nx-txd-action-circle {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .nx-txd-action-btn:active .nx-txd-action-circle {
    transform: scale(0.92);
  }
  .dark .nx-txd-action-circle {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .nx-txd-action-circle.active {
    background: #111827;
    border-color: #111827;
    color: #FFFFFF;
  }
  .dark .nx-txd-action-circle.active {
    background: #FFFFFF;
    border-color: #FFFFFF;
    color: #111827;
  }
  .nx-txd-action-circle.danger {
    color: #D93829;
  }
  .nx-txd-action-lbl {
    font-size: 11.5px;
    font-weight: 500;
    color: #6B7280;
  }
  .dark .nx-txd-action-lbl {
    color: rgba(255, 255, 255, 0.72);
  }
  .nx-txd-card {
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .dark .nx-txd-card {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.09);
  }
  .nx-txd-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 16px;
    font-size: 13.5px;
  }
  .nx-txd-row + .nx-txd-row {
    border-top: 1px solid #F1F3F5;
  }
  .dark .nx-txd-row + .nx-txd-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
  .nx-txd-row-lbl {
    color: #9CA3AF;
    font-weight: 500;
    flex-shrink: 0;
  }
  .nx-txd-row-val {
    font-weight: 600;
    color: #111827;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-align: right;
    min-width: 0;
  }
  .dark .nx-txd-row-val {
    color: #FFFFFF;
  }
  .nx-txd-link-btn {
    background: transparent;
    border: 0;
    padding: 0;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    color: #111827;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
  .dark .nx-txd-link-btn {
    color: #FFFFFF;
  }
  .nx-txd-split-pill {
    flex: 1;
    height: 36px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FAFAFB;
    color: #111827;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .dark .nx-txd-split-pill {
    background: #13151C;
    border-color: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }
  .nx-txd-split-pill.active {
    background: #111827;
    border-color: #111827;
    color: #FFFFFF;
  }
  .dark .nx-txd-split-pill.active {
    background: #FFFFFF;
    border-color: #FFFFFF;
    color: #111827;
  }
  .nx-txd-primary-btn {
    width: 100%;
    height: 46px;
    border-radius: 999px;
    border: 0;
    background: #111827;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .dark .nx-txd-primary-btn {
    background: #FFFFFF;
    color: #111827;
  }
`;

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

  const numericAmount = Math.abs(Number(transaction.amount) || 0);
  const formatted = isAmountsHidden ? '€••••' : formatEuroAmount(numericAmount);

  const titleText = (transaction.description || '').trim() || transaction.category || 'Movimiento';
  const dateLabel = formatSmartDate(transaction.date, transaction.time);
  const subtitleParts = [dateLabel];
  if (transaction.installment) {
    subtitleParts.push(`Cuota ${transaction.installment.current}/${transaction.installment.total}`);
  }
  const categoryLabel = transaction.category || (isExpense ? 'Gasto' : 'Ingreso');

  const handleSaveNote = async () => {
    try {
      await updateTransaction(transaction.id, { description: noteText.trim() });
      setIsEditingNote(false);
      triggerHaptic('light');
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
      triggerHaptic('success');
    } catch (err) {
      setDetailError(err.message);
    }
  };

  return (
    <>
      <button
        type="button"
        className="nx-wtx-row"
        onClick={() => {
          triggerHaptic('light');
          setDetailError('');
          setIsSplitting(false);
          setIsEditingNote(false);
          setNoteText(transaction.description || '');
          setIsDetailOpen(true);
        }}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span
          className="nx-wtx-avatar"
          style={{ backgroundColor: visuals.bg, color: '#FFFFFF' }}
        >
          {visuals.icon}
        </span>

        <span className="nx-wtx-main">
          <span className="nx-wtx-title">{titleText}</span>
          <span className="nx-wtx-sub">{subtitleParts.filter(Boolean).join(' · ')}</span>
        </span>

        <span className="nx-wtx-right">
          <span className={`nx-wtx-amount privacy-sensitive ${isExpense ? 'expense' : 'income'}`}>
            {isAmountsHidden ? '€••••' : `${isExpense ? '- ' : '+ '}${formatted}`}
          </span>
          <span className="nx-wtx-cat">{categoryLabel}</span>
        </span>

        <ChevronRight size={15} className="nx-wtx-chevron" />
      </button>

      {isDetailOpen && phoneNode && createPortal(
        <div className="nx-txd-backdrop" onMouseDown={() => setIsDetailOpen(false)}>
          <style>{TX_DETAIL_STYLES}</style>
          <section
            className="nx-txd-sheet"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="nx-txd-grabber" />

            <div className="nx-txd-topbar">
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>
                {isExpense ? 'Gasto' : 'Ingreso'}
              </span>
              <button
                type="button"
                className="nx-txd-close"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Cerrar detalle"
              >
                <X size={16} />
              </button>
            </div>

            {/* CABECERA CENTRADA ESTILO WALLET */}
            <div className="nx-txd-hero">
              <div
                className="nx-txd-avatar"
                style={{ backgroundColor: visuals.bg }}
              >
                {getCategoryVisuals(transaction.category, transaction.type, 24).icon}
              </div>

              <h3 className="nx-txd-title">{titleText}</h3>
              <p className="nx-txd-date">{formatFullDate(transaction.date, transaction.time)}</p>

              <div className={`nx-txd-amount privacy-sensitive ${isExpense ? 'expense' : 'income'}`}>
                {isAmountsHidden ? '€••••' : `${isExpense ? '- ' : '+ '}${formatted}`}
              </div>

              <span className="nx-txd-status-pill">
                <Check size={12} strokeWidth={2.8} />
                {transaction.installment
                  ? `Completado · Cuota ${transaction.installment.current}/${transaction.installment.total}`
                  : 'Completado'}
              </span>
            </div>

            {/* ACCIONES CIRCULARES ESTILO HOME / TARJETA */}
            <div className="nx-txd-actions">
              <button
                type="button"
                className="nx-txd-action-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setIsDetailOpen(false);
                  setEditingTransaction(transaction);
                }}
              >
                <span className="nx-txd-action-circle">
                  <Pencil size={17} />
                </span>
                <span className="nx-txd-action-lbl">Editar</span>
              </button>

              {isExpense && !transaction.installment && splitTransaction && (
                <button
                  type="button"
                  className="nx-txd-action-btn"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsSplitting((v) => !v);
                  }}
                >
                  <span className={`nx-txd-action-circle ${isSplitting ? 'active' : ''}`}>
                    <Scissors size={17} />
                  </span>
                  <span className="nx-txd-action-lbl">Dividir</span>
                </button>
              )}

              <button
                type="button"
                className="nx-txd-action-btn"
                onClick={() => {
                  triggerHaptic('error');
                  setIsDetailOpen(false);
                  deleteTransaction(transaction.id);
                }}
              >
                <span className="nx-txd-action-circle danger">
                  <Trash2 size={17} />
                </span>
                <span className="nx-txd-action-lbl">Eliminar</span>
              </button>
            </div>

            {/* PANEL DESPLEGABLE DIVIDIR EN CUOTAS */}
            {isSplitting && (
              <div className="nx-txd-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#9CA3AF' }}>
                    Dividir en cuotas
                  </span>
                  <strong className="privacy-sensitive" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {isAmountsHidden ? '€••••' : `${formatEuroAmount(numericAmount / splitCount)}/mes`}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {[2, 3, 4, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`nx-txd-split-pill ${splitCount === n ? 'active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSplitCount(n);
                      }}
                    >
                      {n}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="nx-txd-primary-btn"
                  onClick={() => {
                    try {
                      splitTransaction(transaction.id, splitCount);
                      triggerHaptic('success');
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

            {/* BLOQUE 1: DETALLES DE OPERACIÓN */}
            <div className="nx-txd-card">
              <div className="nx-txd-row">
                <span className="nx-txd-row-lbl">Categoría</span>
                <span className="nx-txd-row-val">
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '999px',
                      backgroundColor: visuals.bg,
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getCategoryVisuals(transaction.category, transaction.type, 12).icon}
                  </span>
                  {transaction.category || 'Sin categoría'}
                </span>
              </div>

              <div className="nx-txd-row">
                <span className="nx-txd-row-lbl">Método de pago</span>
                <span className="nx-txd-row-val">
                  <CreditCard size={15} style={{ color: '#9CA3AF' }} />
                  {transaction.paymentMethod || 'Tarjeta'}
                </span>
              </div>

              <div className="nx-txd-row">
                <span className="nx-txd-row-lbl">Importe en análisis</span>
                <span className="nx-txd-row-val privacy-sensitive" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatted}
                </span>
              </div>
            </div>

            {/* BLOQUE 2: NOTA Y JUSTIFICANTE */}
            <div className="nx-txd-card">
              <div className="nx-txd-row">
                <span className="nx-txd-row-lbl">Nota</span>
                {!isEditingNote ? (
                  <button
                    type="button"
                    className="nx-txd-link-btn"
                    onClick={() => setIsEditingNote(true)}
                  >
                    <Pencil size={13} style={{ color: '#9CA3AF' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {transaction.description || 'Añadir nota'}
                    </span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flex: 1, marginLeft: '12px' }}>
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escribe una nota..."
                      style={{
                        flex: 1,
                        margin: 0,
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: 0,
                        background: '#111827',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>

              <div className="nx-txd-row">
                <span className="nx-txd-row-lbl">Justificante</span>
                {transaction.invoice ? (
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                      type="button"
                      className="nx-txd-link-btn"
                      onClick={async () => {
                        try {
                          const url = await previewInvoice(transaction.id);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (err) {
                          setDetailError(err.message);
                        }
                      }}
                    >
                      <Eye size={14} /> Ver
                    </button>
                    <button
                      type="button"
                      className="nx-txd-link-btn"
                      onClick={() => downloadInvoice(transaction.id, transaction.invoice.name).catch((err) => setDetailError(err.message))}
                    >
                      <Download size={14} /> Descargar
                    </button>
                  </div>
                ) : (
                  <label className="nx-txd-link-btn" style={{ margin: 0 }}>
                    <Upload size={14} /> Adjuntar
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleUploadReceipt} />
                  </label>
                )}
              </div>
            </div>

            {detailError && (
              <p style={{ color: '#D93829', fontSize: '12px', fontWeight: 500, margin: '0 4px 12px' }}>
                {detailError}
              </p>
            )}
          </section>
        </div>,
        phoneNode,
      )}
    </>
  );
};

export default TransactionItem;
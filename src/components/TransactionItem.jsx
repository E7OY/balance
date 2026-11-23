import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Briefcase,
  Car,
  CreditCard,
  Download,
  Eye,
  Film,
  HeartPulse,
  Home,
  Pencil,
  Receipt,
  Scissors,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Tv,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { triggerHaptic } from '../utils/haptics';

/* Paleta oficial de 8 colores de producto:
   teal #00a87e, light-blue #007bc2, deep-pink #e61e49, light-green #428619,
   orange #ec7e00, yellow #b09000, brown #936d62, danger-red #e23b4a */
export const getCategoryVisuals = (category = '', type = 'Gasto', size = 17) => {
  const norm = category.toLowerCase().trim();
  if (norm.includes('comida') || norm.includes('supermercado')) {
    return { icon: <ShoppingBag size={size} />, bg: '#428619', softBg: 'rgba(66, 134, 25, 0.14)', fg: '#428619' };
  }
  if (norm.includes('restaurante') || norm.includes('bar')) {
    return { icon: <Utensils size={size} />, bg: '#ec7e00', softBg: 'rgba(236, 126, 0, 0.14)', fg: '#ec7e00' };
  }
  if (norm.includes('hogar') || norm.includes('alquiler') || norm.includes('hipoteca')) {
    return { icon: <Home size={size} />, bg: '#936d62', softBg: 'rgba(147, 109, 98, 0.16)', fg: '#936d62' };
  }
  if (norm.includes('transporte') || norm.includes('coche') || norm.includes('gasolina')) {
    return { icon: <Car size={size} />, bg: '#007bc2', softBg: 'rgba(0, 123, 194, 0.14)', fg: '#007bc2' };
  }
  if (norm.includes('ocio') || norm.includes('cine') || norm.includes('viajes')) {
    return { icon: <Film size={size} />, bg: '#e61e49', softBg: 'rgba(230, 30, 73, 0.14)', fg: '#e61e49' };
  }
  if (norm.includes('salud')) {
    return { icon: <HeartPulse size={size} />, bg: '#e23b4a', softBg: 'rgba(226, 59, 74, 0.14)', fg: '#e23b4a' };
  }
  if (norm.includes('suscripcion') || norm.includes('netflix') || norm.includes('spotify')) {
    return { icon: <Tv size={size} />, bg: '#494fdf', softBg: 'rgba(73, 79, 223, 0.14)', fg: '#494fdf' };
  }
  if (norm.includes('nómina') || norm.includes('nomina') || norm.includes('sueldo') || norm.includes('salario')) {
    return { icon: <Briefcase size={size} />, bg: '#00a87e', softBg: 'rgba(0, 168, 126, 0.14)', fg: '#00a87e' };
  }
  if (norm.includes('transferencia') || norm.includes('bizum')) {
    return { icon: <ArrowLeftRight size={size} />, bg: '#007bc2', softBg: 'rgba(0, 123, 194, 0.14)', fg: '#007bc2' };
  }
  if (norm.includes('inversion')) {
    return { icon: <TrendingUp size={size} />, bg: '#00a87e', softBg: 'rgba(0, 168, 126, 0.14)', fg: '#00a87e' };
  }
  if (norm.includes('venta') || norm.includes('ropa') || norm.includes('regalo')) {
    return { icon: <Tag size={size} />, bg: '#b09000', softBg: 'rgba(176, 144, 0, 0.15)', fg: '#b09000' };
  }
  return type === 'Ingreso'
    ? { icon: <TrendingUp size={size} />, bg: '#00a87e', softBg: 'rgba(0, 168, 126, 0.14)', fg: '#00a87e' }
    : { icon: <Receipt size={size} />, bg: '#936d62', softBg: 'rgba(147, 109, 98, 0.14)', fg: '#936d62' };
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
  const visuals = getCategoryVisuals(transaction.category, transaction.type, 17);

  useEffect(() => {
    setPhoneNode(document.querySelector('.phone') || document.body);
  }, []);

  const formatted = isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(transaction.amount) || 0);

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
          padding: '12px 0',
          background: 'transparent',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          gap: 'var(--sp-md)',
        }}
      >
        <span style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
          <span style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--rounded-full)',
            background: visuals.softBg,
            color: visuals.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {visuals.icon}
          </span>
          <span style={{
            position: 'absolute',
            right: '-2px',
            bottom: '-2px',
            width: '16px',
            height: '16px',
            borderRadius: 'var(--rounded-full)',
            background: isExpense ? 'var(--ink)' : 'var(--primary)',
            color: '#FFFFFF',
            border: '2px solid var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isExpense ? <ArrowUpRight size={10} strokeWidth={2.5} /> : <ArrowDownLeft size={10} strokeWidth={2.5} />}
          </span>
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {transaction.description || transaction.category}
          </span>
          <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginTop: '2px' }}>
            {transaction.date} · {transaction.category}
          </span>
          <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)' }}>
            · {transaction.installment ? `Cuota ${transaction.installment.current}/${transaction.installment.total}` : 'Completado'}
          </span>
        </span>

        <span
          className="privacy-sensitive"
          style={{
            alignSelf: 'flex-start',
            marginTop: '2px',
            fontSize: '14px',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: isExpense ? 'var(--text-main)' : 'var(--accent-teal)',
          }}
        >
          {!isExpense ? '+' : ''}{formatted}
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
                  {transaction.description || transaction.category}
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

            {/* button-pill-sm (height: 36px, padding: 8px 16px) */}
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
                  Dividir en cuotas ({new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((Number(transaction.amount) || 0) / splitCount)}/mes)
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
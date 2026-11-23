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

export const getCategoryVisuals = (category = '', type = 'Gasto', size = 18) => {
  const norm = category.toLowerCase().trim();
  if (norm.includes('comida') || norm.includes('supermercado')) {
    return { icon: <ShoppingBag size={size} />, bg: '#F59E0B', softBg: 'rgba(245, 158, 11, 0.16)', fg: '#D97706' };
  }
  if (norm.includes('restaurante') || norm.includes('bar')) {
    return { icon: <Utensils size={size} />, bg: '#F97316', softBg: 'rgba(249, 115, 22, 0.16)', fg: '#EA580C' };
  }
  if (norm.includes('hogar') || norm.includes('alquiler') || norm.includes('hipoteca')) {
    return { icon: <Home size={size} />, bg: '#8B5CF6', softBg: 'rgba(139, 92, 246, 0.16)', fg: '#7C3AED' };
  }
  if (norm.includes('transporte') || norm.includes('coche') || norm.includes('gasolina')) {
    return { icon: <Car size={size} />, bg: '#0075EB', softBg: 'rgba(0, 117, 235, 0.15)', fg: '#0075EB' };
  }
  if (norm.includes('ocio') || norm.includes('cine') || norm.includes('viajes')) {
    return { icon: <Film size={size} />, bg: '#EC4899', softBg: 'rgba(236, 72, 153, 0.16)', fg: '#DB2777' };
  }
  if (norm.includes('salud')) {
    return { icon: <HeartPulse size={size} />, bg: '#F43F5E', softBg: 'rgba(244, 63, 94, 0.16)', fg: '#E11D48' };
  }
  if (norm.includes('suscripcion') || norm.includes('netflix') || norm.includes('spotify')) {
    return { icon: <Tv size={size} />, bg: '#6366F1', softBg: 'rgba(99, 102, 241, 0.16)', fg: '#4F46E5' };
  }
  if (norm.includes('nómina') || norm.includes('nomina') || norm.includes('sueldo') || norm.includes('salario')) {
    return { icon: <Briefcase size={size} />, bg: '#4F46E5', softBg: 'rgba(79, 70, 229, 0.16)', fg: '#4338CA' };
  }
  if (norm.includes('transferencia') || norm.includes('bizum')) {
    return { icon: <ArrowLeftRight size={size} />, bg: '#0EA5E9', softBg: 'rgba(14, 165, 233, 0.16)', fg: '#0284C7' };
  }
  if (norm.includes('inversion')) {
    return { icon: <TrendingUp size={size} />, bg: '#10B981', softBg: 'rgba(16, 185, 129, 0.16)', fg: '#059669' };
  }
  if (norm.includes('venta') || norm.includes('ropa')) {
    return { icon: <Tag size={size} />, bg: '#A855F7', softBg: 'rgba(168, 85, 247, 0.16)', fg: '#9333EA' };
  }
  return type === 'Ingreso'
    ? { icon: <TrendingUp size={size} />, bg: '#00A859', softBg: 'rgba(0, 168, 89, 0.16)', fg: '#00A859' }
    : { icon: <Receipt size={size} />, bg: '#64748B', softBg: 'rgba(100, 116, 139, 0.15)', fg: '#475569' };
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
    background: 'var(--rev-card)',
    borderRadius: '16px',
    padding: '4px 16px',
    border: '1px solid var(--rev-border)',
    boxShadow: 'var(--rev-shadow)',
    marginBottom: '12px',
  };

  const detailRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 0',
    fontSize: '14px',
  };

  return (
    <>
      {/* FILA DE TRANSACCIÓN ESTILO REVOLUT CON MINI-BADGE EN EL ICONO */}
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
          gap: '12px',
        }}
      >
        {/* AVATAR CIRCULAR CON BADGE INFERIOR DERECHO */}
        <span style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
          <span style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
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
            borderRadius: '50%',
            background: isExpense ? '#64748B' : '#0075EB',
            color: '#FFFFFF',
            border: '2px solid var(--rev-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isExpense ? <ArrowUpRight size={10} strokeWidth={2.8} /> : <ArrowDownLeft size={10} strokeWidth={2.8} />}
          </span>
        </span>

        {/* 3 LÍNEAS COMO EN REVOLUT */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--rev-text)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {transaction.description || transaction.category}
          </strong>
          <small style={{
            display: 'block',
            fontSize: '11.5px',
            fontWeight: 500,
            color: 'var(--rev-muted)',
            marginTop: '1px',
          }}>
            {transaction.date} · {transaction.category}
          </small>
          <small style={{
            display: 'block',
            fontSize: '11.5px',
            fontWeight: 500,
            color: 'var(--rev-muted)',
          }}>
            · {transaction.installment ? `Cuota ${transaction.installment.current}/${transaction.installment.total}` : 'Completado'}
          </small>
        </span>

        {/* IMPORTE ALINEADO ARRIBA A LA DERECHA */}
        <strong
          className="privacy-sensitive"
          style={{
            alignSelf: 'flex-start',
            marginTop: '2px',
            fontSize: '14px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: isExpense ? 'var(--rev-text)' : 'var(--rev-green)',
          }}
        >
          {!isExpense ? '+' : ''}{formatted}
        </strong>
      </button>

      {/* DETALLE DE TRANSACCIÓN ESTILO REVOLUT */}
      {isDetailOpen && phoneNode && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsDetailOpen(false)}>
          <section
            className="bottom-sheet"
            style={{ minHeight: '86dvh', background: 'var(--rev-bg)' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
              <button
                type="button"
                className="sheet-close"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <strong
                  className="privacy-sensitive"
                  style={{
                    display: 'block',
                    fontSize: '34px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                    color: isExpense ? 'var(--rev-text)' : 'var(--rev-green)',
                  }}
                >
                  {isExpense ? '−' : '+'}{formatted}
                </strong>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--rev-blue)', marginTop: '2px' }}>
                  {transaction.description || transaction.category}
                </span>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--rev-muted)', marginTop: '2px' }}>
                  {transaction.date}
                </small>
              </div>

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
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

            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              {isExpense && !transaction.installment && splitTransaction && (
                <button
                  type="button"
                  onClick={() => setIsSplitting((v) => !v)}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '999px',
                    border: 0,
                    background: 'var(--rev-blue-soft)',
                    color: 'var(--rev-blue)',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Scissors size={14} /> Dividir gasto
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setEditingTransaction(transaction);
                }}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '999px',
                  border: 0,
                  background: 'var(--rev-blue-soft)',
                  color: 'var(--rev-blue)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Pencil size={14} /> Editar movimiento
              </button>
            </div>

            {isSplitting && (
              <div style={{ ...detailCardStyle, padding: '14px' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '10px' }}>
                  Dividir en cuotas ({new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((Number(transaction.amount) || 0) / splitCount)}/mes)
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {[2, 3, 4, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitCount(n)}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: '10px',
                        border: 0,
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        background: splitCount === n ? 'var(--rev-blue)' : 'var(--rev-subtle)',
                        color: splitCount === n ? '#fff' : 'var(--rev-text)',
                      }}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="sheet-submit"
                  style={{ height: '42px', fontSize: '13px' }}
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
              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--rev-border)' }}>
                <span style={{ color: 'var(--rev-muted)' }}>Estado</span>
                <strong style={{ fontWeight: 600 }}>Completado</strong>
              </div>

              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--rev-border)' }}>
                <span style={{ color: 'var(--rev-muted)' }}>Método</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--rev-blue)', fontWeight: 700 }}>
                  <CreditCard size={15} /> {transaction.paymentMethod || 'Tarjeta'}
                </span>
              </div>

              <div style={detailRowStyle}>
                <span style={{ color: 'var(--rev-muted)' }}>Justificante</span>
                {transaction.invoice ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
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
                      style={{ background: 'transparent', border: 0, color: 'var(--rev-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Eye size={14} /> Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadInvoice(transaction.id, transaction.invoice.name).catch((err) => setDetailError(err.message))}
                      style={{ background: 'transparent', border: 0, color: 'var(--rev-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Download size={14} /> Descargar
                    </button>
                  </div>
                ) : (
                  <label style={{ color: 'var(--rev-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Subir
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleUploadReceipt} />
                  </label>
                )}
              </div>
            </div>

            <div style={detailCardStyle}>
              <div style={{ ...detailRowStyle, borderBottom: '1px solid var(--rev-border)' }}>
                <span style={{ color: 'var(--rev-muted)' }}>Categoría</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--rev-blue)', fontWeight: 700 }}>
                  {getCategoryVisuals(transaction.category, transaction.type, 15).icon}
                  {transaction.category}
                </span>
              </div>

              <div style={detailRowStyle}>
                <span style={{ color: 'var(--rev-muted)' }}>Importe en análisis</span>
                <span style={{ color: 'var(--rev-blue)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {formatted}
                </span>
              </div>
            </div>

            <div style={detailCardStyle}>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--rev-muted)' }}>Nota</span>
                {!isEditingNote ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    style={{ background: 'transparent', border: 0, color: 'var(--rev-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                  >
                    <Pencil size={13} /> {transaction.description || 'Añadir nota'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flex: 1, marginLeft: '16px' }}>
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      style={{ margin: 0, height: '36px', fontSize: '13px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      style={{ padding: '0 12px', borderRadius: '10px', border: 0, background: 'var(--rev-blue)', color: '#fff', fontWeight: 700, fontSize: '12px' }}
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>

            {detailError && (
              <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
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
                  color: 'var(--rev-red)',
                  fontWeight: 700,
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
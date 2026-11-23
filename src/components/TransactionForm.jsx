import React, { useState, useMemo } from 'react';
import {
  Camera,
  Check,
  ChevronDown,
  CreditCard,
  Pencil,
  Plus,
  Snowflake,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { expenseCategories, incomeCategories } from '../utils/categories';
import { getCategoryVisuals } from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const formatReadableDate = (isoDate) => {
  const ts = Date.parse(`${isoDate}T00:00:00`);
  if (!Number.isFinite(ts)) return isoDate;
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(ts);
};

const getMaskedDigits = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 9000;
  }
  return String(1000 + hash);
};

const PAYMENT_METHODS = ['Tarjeta', 'Efectivo', 'Bizum', 'Transferencia', 'Domiciliación', 'Otros'];

const KEYPAD_GRID = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: ',', sub: '' },
  { key: '0', sub: '' },
  { key: 'backspace', sub: '' },
];

const REV_FORM_CSS = `
  .rev-kp-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    background: var(--rev-bg);
    color: var(--rev-text);
    animation: rev-slide 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .rev-kp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 8px;
  }
  .rev-kp-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
  }
  .rev-kp-confirm-wrap {
    padding: 0 18px 14px;
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
  }
  .rev-kp-confirm {
    width: 100%;
    height: 50px;
    border-radius: 999px;
    border: 0;
    background: var(--rev-blue);
    color: #FFFFFF;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.12s ease;
  }
  .rev-kp-confirm:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .rev-kp-confirm:active:not(:disabled) {
    transform: scale(0.98);
  }
  .rev-kp-dock {
    background: var(--rev-subtle);
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--rev-border);
  }
  .rev-kp-ops {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: var(--rev-card);
    border-bottom: 1px solid var(--rev-border);
  }
  .rev-kp-ops button {
    height: 40px;
    border: 0;
    background: transparent;
    color: var(--rev-text);
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
  }
  .rev-kp-ops button:active {
    background: var(--rev-subtle);
  }
  .rev-kp-keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 6px;
    max-width: 460px;
    margin: 0 auto;
  }
  .rev-kp-btn {
    height: 52px;
    border-radius: 8px;
    border: 0;
    background: var(--rev-card);
    color: var(--rev-text);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
  }
  .rev-kp-btn.ghost {
    background: transparent;
    box-shadow: none;
  }
  .rev-kp-btn:active {
    opacity: 0.7;
  }
  .rev-kp-num {
    font-size: 23px;
    font-weight: 500;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .rev-kp-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--rev-muted);
    margin-top: 1px;
    height: 10px;
  }

  /* PASO 2: ESTRUCTURA DE TARJETAS REVOLUT */
  .rev-detail-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: var(--rev-bg);
    color: var(--rev-text);
    overflow-y: auto;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px));
    animation: rev-slide 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .rev-detail-inner {
    max-width: 440px;
    margin: 0 auto;
  }
  .rev-group-card {
    background: var(--rev-card);
    border-radius: 16px;
    padding: 2px 16px;
    border: 1px solid var(--rev-border);
    box-shadow: var(--rev-shadow);
    margin-bottom: 12px;
  }
  .rev-group-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 11px 0;
    font-size: 14px;
  }
  .rev-group-row + .rev-group-row {
    border-top: 1px solid var(--rev-border);
  }
  .rev-row-label {
    color: var(--rev-muted);
    font-weight: 500;
    flex-shrink: 0;
  }
  .rev-row-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--rev-blue);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: right;
  }
  .rev-soft-pill {
    height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: 0;
    background: var(--rev-blue-soft);
    color: var(--rev-blue);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .rev-soft-pill:active {
    transform: scale(0.96);
  }
  .rev-inline-drawer {
    padding: 10px 0 14px;
    border-top: 1px solid var(--rev-border);
  }
  .rev-note-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--rev-blue);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    outline: none;
  }
  .rev-note-input::placeholder {
    color: var(--rev-blue);
    opacity: 0.85;
  }
  .rev-date-input {
    border: 0;
    background: transparent;
    color: var(--rev-blue);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    outline: none;
    cursor: pointer;
  }
`;

const TransactionForm = ({ transaction, defaultType = 'expense', onClose }) => {
  const {
    profiles,
    activeProfileId,
    allCategories,
    addTransaction,
    updateTransaction,
    addCategory,
    getTransactionsForProfile,
  } = useFinance();

  const initialType = transaction?.type || (defaultType === 'income' ? 'Ingreso' : 'Gasto');
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(() => (
    transaction?.amount ? String(transaction.amount).replace('.', ',') : '0'
  ));
  const [pendingOp, setPendingOp] = useState(null);
  const [storedOperand, setStoredOperand] = useState(null);
  const [resetNextDigit, setResetNextDigit] = useState(false);

  const [type, setType] = useState(initialType);
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);

  // Control de secciones desplegables dentro de las tarjetas Revolut
  const [openDrawer, setOpenDrawer] = useState(null); // 'account' | 'category' | 'method' | null

  const frozenAccounts = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('balance-frozen-accounts') || '{}') || {};
    } catch {
      return {};
    }
  }, []);

  const categoriesForType = useMemo(() => {
    const base = type === 'Ingreso' ? incomeCategories : expenseCategories;
    const extra = allCategories?.[type] || [];
    return Array.from(new Set([...base, ...extra]));
  }, [type, allCategories]);

  const [category, setCategory] = useState(() => transaction?.category || categoriesForType[0] || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || 'Tarjeta');
  const [date, setDate] = useState(transaction?.date || getToday());
  const [installments, setInstallments] = useState(transaction?.installmentTotal || 1);

  const [invoiceFile, setInvoiceFile] = useState(null);
  const [removeExistingInvoice, setRemoveExistingInvoice] = useState(false);

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [formError, setFormError] = useState('');

  const isIncome = type === 'Ingreso';
  const numAmount = parseFloat(amount.replace(',', '.'));
  const isValidAmount = !isNaN(numAmount) && numAmount > 0;

  const selectedAccountObj = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const selectedAccountDigits = getMaskedDigits(selectedAccountObj?.id || '');
  const selectedAccountBalance = useMemo(() => {
    const list = getTransactionsForProfile ? getTransactionsForProfile(selectedProfileId) : [];
    return list.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      return tx.type === 'Ingreso' ? acc + amt : tx.type === 'Gasto' ? acc - amt : acc;
    }, 0);
  }, [getTransactionsForProfile, selectedProfileId]);

  const cycleTargetAccount = () => {
    if (profiles.length <= 1) return;
    triggerHaptic();
    const idx = profiles.findIndex((p) => p.id === selectedProfileId);
    const next = profiles[(idx + 1) % profiles.length];
    setSelectedProfileId(next.id);
  };

  const switchTransactionType = (nextType) => {
    if (nextType === type) return;
    triggerHaptic();
    setType(nextType);
    const nextList = Array.from(new Set([
      ...(nextType === 'Ingreso' ? incomeCategories : expenseCategories),
      ...(allCategories?.[nextType] || []),
    ]));
    if (!nextList.includes(category)) {
      setCategory(nextList[0] || '');
    }
  };

  const evaluateMath = (a, b, op) => {
    if (op === '+') return a + b;
    if (op === '−') return Math.max(0, a - b);
    if (op === '×') return a * b;
    if (op === '÷') return b !== 0 ? a / b : a;
    return b;
  };

  const handleOperator = (op) => {
    triggerHaptic();
    const currentVal = parseFloat(amount.replace(',', '.')) || 0;
    if (op === '=') {
      if (pendingOp && storedOperand !== null) {
        const res = Number(evaluateMath(storedOperand, currentVal, pendingOp).toFixed(2));
        setAmount(String(res).replace('.', ','));
        setPendingOp(null);
        setStoredOperand(null);
        setResetNextDigit(true);
      }
      return;
    }
    if (pendingOp && storedOperand !== null && !resetNextDigit) {
      const res = Number(evaluateMath(storedOperand, currentVal, pendingOp).toFixed(2));
      setStoredOperand(res);
      setAmount(String(res).replace('.', ','));
    } else {
      setStoredOperand(currentVal);
    }
    setPendingOp(op);
    setResetNextDigit(true);
  };

  const handleKey = (key) => {
    triggerHaptic();
    setAmount((prev) => {
      const base = resetNextDigit ? '0' : prev;
      if (resetNextDigit) setResetNextDigit(false);

      if (key === 'backspace') return base.length > 1 ? base.slice(0, -1) : '0';
      if (key === ',') return base.includes(',') ? base : `${base},`;
      if (base === '0') return key;
      if (base.includes(',')) {
        const [, dec] = base.split(',');
        if (dec && dec.length >= 2) return base;
      }
      if (base.replace(',', '').length >= 7) return base;
      return base + key;
    });
  };

  const goToDetails = () => {
    if (!isValidAmount) return;
    if (!categoriesForType.includes(category)) {
      setCategory(categoriesForType[0] || '');
    }
    setOpenDrawer(null);
    setStep(2);
  };

  const handleCreateInlineCategory = () => {
    setFormError('');
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    try {
      const created = addCategory(type, trimmed);
      setCategory(created);
      setNewCatName('');
      setIsAddingCat(false);
      setOpenDrawer(null);
      triggerHaptic();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!isValidAmount || !category) return;

    const txData = {
      amount: numAmount,
      type,
      description: description.trim(),
      category,
      paymentMethod,
      date,
      targetProfileId: selectedProfileId,
      isInstallment: !isIncome && Number(installments) > 1,
      installmentTotal: !isIncome ? Number(installments) : 1,
      ...(invoiceFile ? { invoiceFile } : {}),
      ...(removeExistingInvoice && !invoiceFile ? { removeInvoice: true } : {}),
    };

    try {
      if (transaction) {
        await updateTransaction(transaction.id, txData);
      } else {
        await addTransaction(txData);
      }
      triggerHaptic();
      onClose();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const formattedAccountBalance = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(selectedAccountBalance);

  const existingInvoiceName = !removeExistingInvoice ? transaction?.invoice?.name : null;
  const categoryVisuals = getCategoryVisuals(category, type, 15);
  const isInstallmentEnabled = !isIncome && Number(installments) > 1;

  return (
    <>
      <style>{REV_FORM_CSS}</style>

      {/* PASO 1: TECLADO NUMÉRICO REVOLUT */}
      {step === 1 && (
        <div className="rev-kp-screen">
          <div className="rev-kp-header">
            <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>

            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              {transaction ? `Editar ${type.toLowerCase()}` : isIncome ? 'Añadir ingreso' : 'Añadir gasto'}
            </span>

            <span style={{ width: '32px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
            <div className="record-tabs">
              <button type="button" className={type === 'Gasto' ? 'active' : ''} onClick={() => switchTransactionType('Gasto')}>
                Gasto
              </button>
              <button type="button" className={type === 'Ingreso' ? 'active' : ''} onClick={() => switchTransactionType('Ingreso')}>
                Ingreso
              </button>
            </div>
          </div>

          <div className="rev-kp-display">
            <div style={{ display: 'flex', alignItems: 'baseline', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: '50px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {isIncome && isValidAmount ? '+' : ''}€{amount}
              </span>
            </div>

            <button
              type="button"
              onClick={cycleTargetAccount}
              style={{
                marginTop: '10px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--rev-border)',
                background: 'var(--rev-card)',
                color: 'var(--rev-text)',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: profiles.length > 1 ? 'pointer' : 'default',
              }}
            >
              <CreditCard size={13} style={{ color: 'var(--rev-blue)' }} />
              <span>{selectedAccountObj?.name} **{selectedAccountDigits} · {formattedAccountBalance}</span>
              {frozenAccounts[selectedProfileId] && <Snowflake size={12} style={{ color: 'var(--rev-blue)' }} />}
            </button>
          </div>

          <div className="rev-kp-confirm-wrap">
            <button
              type="button"
              className="rev-kp-confirm"
              disabled={!isValidAmount}
              onClick={goToDetails}
            >
              Continuar
            </button>
          </div>

          <div className="rev-kp-dock">
            <div className="rev-kp-ops">
              {['+', '−', '×', '÷', '='].map((op) => (
                <button key={op} type="button" onClick={() => handleOperator(op)}>
                  {op}
                </button>
              ))}
            </div>

            <div className="rev-kp-keys">
              {KEYPAD_GRID.map(({ key, sub }) => (
                <button
                  key={key}
                  type="button"
                  className={`rev-kp-btn ${key === ',' || key === 'backspace' ? 'ghost' : ''}`}
                  onClick={() => handleKey(key)}
                >
                  <span className="rev-kp-num">{key === 'backspace' ? '⌫' : key}</span>
                  <span className="rev-kp-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: ESTRUCTURA DE TARJETAS AGRUPADAS ESTILO REVOLUT */}
      {step === 2 && (
        <div className="rev-detail-modal">
          <div className="rev-detail-inner">
            {/* BOTÓN X ARRIBA A LA IZQUIERDA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--rev-blue)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cambiar importe
              </button>
            </div>

            {/* BLOQUE HERO IZQUIERDO: IMPORTE + TÍTULO AZUL + FECHA */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    fontSize: '36px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                    color: isIncome ? 'var(--rev-green)' : 'var(--rev-text)',
                  }}
                >
                  {isIncome ? '+' : '−'}€{amount}
                </strong>
              </button>

              <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--rev-blue)', marginTop: '2px' }}>
                {description.trim() || selectedAccountObj?.name || category}
              </span>

              <small style={{ display: 'block', fontSize: '12.5px', color: 'var(--rev-muted)', marginTop: '2px', fontWeight: 500 }}>
                {formatReadableDate(date)}
              </small>
            </div>

            {/* DOS PÍLDORAS AZULES SUPERIORES (GASTO / INGRESO) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                className="rev-soft-pill"
                onClick={() => switchTransactionType('Gasto')}
                style={{
                  flex: 1,
                  background: !isIncome ? 'var(--rev-blue)' : 'var(--rev-blue-soft)',
                  color: !isIncome ? '#FFFFFF' : 'var(--rev-blue)',
                }}
              >
                − Gasto
              </button>

              <button
                type="button"
                className="rev-soft-pill"
                onClick={() => switchTransactionType('Ingreso')}
                style={{
                  flex: 1,
                  background: isIncome ? 'var(--rev-green)' : 'var(--rev-blue-soft)',
                  color: isIncome ? '#FFFFFF' : 'var(--rev-blue)',
                }}
              >
                + Ingreso
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TARJETA 1: ESTADO, TARJETA/CUENTA DESTINO Y FECHA */}
              <div className="rev-group-card">
                <div className="rev-group-row">
                  <span className="rev-row-label">Estado</span>
                  <strong style={{ fontSize: '14px', fontWeight: 600 }}>
                    {transaction ? 'Editando' : 'Listo para guardar'}
                  </strong>
                </div>

                {/* FILA TARJETA / CUENTA DONDE SE GUARDA EL MOVIMIENTO */}
                <div className="rev-group-row">
                  <span className="rev-row-label">Tarjeta / Cuenta</span>
                  <button
                    type="button"
                    className="rev-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'account' ? null : 'account')}
                  >
                    <CreditCard size={15} />
                    <span>{selectedAccountObj?.name.toUpperCase()} **{selectedAccountDigits}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'account' && (
                  <div className="rev-inline-drawer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {profiles.map((p) => {
                        const isSel = selectedProfileId === p.id;
                        const digits = getMaskedDigits(p.id);
                        const isFrozen = Boolean(frozenAccounts[p.id]);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic();
                              setSelectedProfileId(p.id);
                              setOpenDrawer(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: isSel ? '1.5px solid var(--rev-blue)' : '1px solid var(--rev-border)',
                              background: isSel ? 'var(--rev-blue-soft)' : 'var(--rev-bg)',
                              color: 'var(--rev-text)',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <CreditCard size={15} style={{ color: 'var(--rev-blue)' }} />
                              <span>{p.name} · **{digits}</span>
                              {isFrozen && <Snowflake size={12} style={{ color: 'var(--rev-blue)' }} />}
                            </span>
                            {isSel && <Check size={15} style={{ color: 'var(--rev-blue)' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rev-group-row">
                  <span className="rev-row-label">Fecha</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rev-date-input"
                    required
                  />
                </div>
              </div>

              {/* TARJETA 2: CATEGORÍA, MÉTODO DE PAGO E IMPORTE */}
              <div className="rev-group-card">
                <div className="rev-group-row">
                  <span className="rev-row-label">Categoría</span>
                  <button
                    type="button"
                    className="rev-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'category' ? null : 'category')}
                  >
                    {categoryVisuals.icon}
                    <span>{category}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'category' && (
                  <div className="rev-inline-drawer">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {categoriesForType.map((c) => {
                        const selected = category === c;
                        const vis = getCategoryVisuals(c, type, 13);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              triggerHaptic();
                              setCategory(c);
                              setOpenDrawer(null);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 11px 6px 6px',
                              borderRadius: '999px',
                              border: selected ? '1.5px solid var(--rev-blue)' : '1px solid var(--rev-border)',
                              background: selected ? 'var(--rev-blue-soft)' : 'var(--rev-bg)',
                              color: selected ? 'var(--rev-blue)' : 'var(--rev-text)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: vis.bg,
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {vis.icon}
                            </span>
                            {c}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsAddingCat((v) => !v)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: '1px dashed var(--rev-blue)',
                          background: 'transparent',
                          color: 'var(--rev-blue)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} /> Nueva
                      </button>
                    </div>

                    {isAddingCat && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Nombre categoría..."
                          style={{
                            flex: 1,
                            height: '38px',
                            padding: '0 12px',
                            borderRadius: '12px',
                            border: '1px solid var(--rev-border)',
                            background: 'var(--rev-bg)',
                            color: 'var(--rev-text)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateInlineCategory}
                          style={{
                            height: '38px',
                            padding: '0 14px',
                            borderRadius: '12px',
                            border: 0,
                            background: 'var(--rev-blue)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Añadir
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="rev-group-row">
                  <span className="rev-row-label">{isIncome ? 'Recepción' : 'Método'}</span>
                  <button
                    type="button"
                    className="rev-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'method' ? null : 'method')}
                  >
                    <span>{paymentMethod}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'method' && (
                  <div className="rev-inline-drawer">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            setPaymentMethod(m);
                            setOpenDrawer(null);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            border: 0,
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: paymentMethod === m ? 'var(--rev-blue)' : 'var(--rev-bg)',
                            color: paymentMethod === m ? '#fff' : 'var(--rev-text)',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rev-group-row">
                  <span className="rev-row-label">Importe en análisis</span>
                  <button type="button" className="rev-row-action" onClick={() => setStep(1)}>
                    <Pencil size={13} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>€{amount}</span>
                  </button>
                </div>
              </div>

              {/* TARJETA 3: JUSTIFICANTE / TICKET */}
              <div className="rev-group-card">
                <div className="rev-group-row">
                  <span className="rev-row-label">Justificante</span>

                  {invoiceFile || existingInvoiceName ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rev-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {invoiceFile ? invoiceFile.name : existingInvoiceName}
                      </span>
                      <button
                        type="button"
                        onClick={() => (invoiceFile ? setInvoiceFile(null) : setRemoveExistingInvoice(true))}
                        style={{ background: 'transparent', border: 0, color: 'var(--rev-red)', display: 'flex', padding: 0, cursor: 'pointer' }}
                        aria-label="Quitar justificante"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
                      <label className="rev-row-action" style={{ margin: 0 }}>
                        <Camera size={15} />
                        <span>Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) { setInvoiceFile(f); setRemoveExistingInvoice(false); }
                          }}
                        />
                      </label>

                      <label className="rev-row-action" style={{ margin: 0 }}>
                        <Upload size={15} />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) { setInvoiceFile(f); setRemoveExistingInvoice(false); }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* TARJETA 4: NOTA / COMERCIO */}
              <div className="rev-group-card">
                <div className="rev-group-row">
                  <span className="rev-row-label">Nota</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                    <Pencil size={13} style={{ color: 'var(--rev-blue)', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Añadir nota"
                      className="rev-note-input"
                    />
                  </div>
                </div>
              </div>

              {/* TARJETA 5: PAGO FRACCIONADO (INTERRUPTOR ESTILO REVOLUT) */}
              {!isIncome && !transaction && (
                <div className="rev-group-card">
                  <div className="rev-group-row">
                    <span className="rev-row-label">Pago a plazos</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isInstallmentEnabled}
                      className={`rev-switch ${isInstallmentEnabled ? 'on' : ''}`}
                      onClick={() => {
                        triggerHaptic();
                        setInstallments(isInstallmentEnabled ? 1 : 3);
                      }}
                    >
                      <span className="rev-switch-thumb" />
                    </button>
                  </div>

                  {isInstallmentEnabled && (
                    <div className="rev-inline-drawer">
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[2, 3, 4, 6, 12, 24].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setInstallments(n)}
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              borderRadius: '10px',
                              border: 0,
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: Number(installments) === n ? 'var(--rev-blue)' : 'var(--rev-bg)',
                              color: Number(installments) === n ? '#fff' : 'var(--rev-text)',
                            }}
                          >
                            {n}x
                          </button>
                        ))}
                      </div>
                      <small style={{ display: 'block', fontSize: '11px', color: 'var(--rev-muted)', marginTop: '8px' }}>
                        {installments} cuotas de {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numAmount / Number(installments))} / mes
                      </small>
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="sheet-submit"
                style={{
                  marginTop: '8px',
                  background: isIncome ? 'var(--rev-green)' : 'var(--rev-blue)',
                }}
              >
                {transaction ? 'Guardar cambios' : isIncome ? 'Guardar ingreso' : 'Guardar gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;
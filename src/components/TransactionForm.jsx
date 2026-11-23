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

const NX_FORM_CSS = `
  .nx-kp-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    background-color: var(--canvas-dark);
    color: var(--on-dark);
    animation: nx-slide 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .nx-kp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) var(--sp-sm);
  }
  .nx-kp-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 var(--sp-xl);
  }
  .nx-kp-cta-wrap {
    padding: 0 var(--sp-xl) var(--sp-lg);
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
  }
  .nx-kp-dock {
    background-color: var(--surface-elevated);
    padding-bottom: calc(var(--sp-md) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .nx-kp-ops {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background-color: var(--canvas-dark);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .nx-kp-ops button {
    height: 40px;
    border: 0;
    background: transparent;
    color: var(--on-dark);
    font-size: 18px;
    font-weight: 400;
    cursor: pointer;
  }
  .nx-kp-ops button:active {
    background: var(--surface-elevated);
  }
  .nx-kp-keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-xs);
    padding: var(--sp-xs);
    max-width: 460px;
    margin: 0 auto;
  }
  .nx-kp-btn {
    height: 54px;
    border-radius: var(--rounded-md);
    border: 0;
    background-color: #242428;
    color: var(--on-dark);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
  }
  .nx-kp-btn.ghost {
    background: transparent;
  }
  .nx-kp-btn:active {
    background-color: #323238;
  }
  .nx-kp-num {
    font-size: 24px;
    font-weight: 500;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .nx-kp-sub {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.24px;
    color: var(--on-dark-mute);
    margin-top: 2px;
    height: 10px;
  }

  /* PASO 2: ESTRUCTURA DE TARJETAS AGRUPADAS */
  .nx-detail-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background-color: var(--bg-page);
    color: var(--text-main);
    overflow-y: auto;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) calc(var(--sp-xxl) + env(safe-area-inset-bottom, 0px));
    animation: nx-slide 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .nx-detail-inner {
    max-width: 440px;
    margin: 0 auto;
  }
  .nx-group-card {
    background-color: var(--bg-card);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xs) var(--sp-xl);
    margin-bottom: var(--sp-md);
  }
  .nx-group-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-md);
    min-height: 48px;
    padding: var(--sp-md) 0;
    font-size: 14px;
  }
  .nx-group-row + .nx-group-row {
    border-top: 1px solid var(--border-hairline);
  }
  .nx-row-label {
    color: var(--text-mute);
    font-weight: 400;
    flex-shrink: 0;
  }
  .nx-row-action {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-xs);
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--primary);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: right;
  }
  .nx-inline-drawer {
    padding: var(--sp-md) 0 var(--sp-lg);
    border-top: 1px solid var(--border-hairline);
  }
  .nx-note-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--primary);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    outline: none;
  }
  .nx-note-input::placeholder {
    color: var(--primary);
    opacity: 0.85;
  }
  .nx-date-input {
    border: 0;
    background: transparent;
    color: var(--primary);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    outline: none;
    cursor: pointer;
  }
  .nx-switch {
    width: 46px;
    height: 26px;
    border-radius: var(--rounded-full);
    border: 0;
    padding: 3px;
    background: var(--faint);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .dark .nx-switch {
    background: #2C2C32;
  }
  .nx-switch.on {
    background: var(--primary);
  }
  .nx-switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: var(--rounded-full);
    background: #FFFFFF;
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    transform: translateX(0);
  }
  .nx-switch.on .nx-switch-thumb {
    transform: translateX(20px);
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
  const [openDrawer, setOpenDrawer] = useState(null);

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
      <style>{NX_FORM_CSS}</style>

      {/* PASO 1: TECLADO SOBRE CANVAS DARK (#000000) CON PÍLDORA BLANCA */}
      {step === 1 && (
        <div className="nx-kp-screen">
          <div className="nx-kp-header">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--rounded-full)',
                border: 0,
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--on-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <span className="nx-label" style={{ color: 'var(--on-dark)' }}>
              {transaction ? `Editar ${type.toLowerCase()}` : isIncome ? 'Añadir ingreso' : 'Añadir gasto'}
            </span>

            <span style={{ width: '36px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--sp-sm)' }}>
            <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--surface-elevated)' }}>
              <button
                type="button"
                onClick={() => switchTransactionType('Gasto')}
                style={{
                  border: 0,
                  padding: '6px 16px',
                  borderRadius: 'var(--rounded-full)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: type === 'Gasto' ? 'var(--canvas-light)' : 'transparent',
                  color: type === 'Gasto' ? 'var(--canvas-dark)' : 'var(--on-dark-mute)',
                }}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => switchTransactionType('Ingreso')}
                style={{
                  border: 0,
                  padding: '6px 16px',
                  borderRadius: 'var(--rounded-full)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: type === 'Ingreso' ? 'var(--canvas-light)' : 'transparent',
                  color: type === 'Ingreso' ? 'var(--canvas-dark)' : 'var(--on-dark-mute)',
                }}
              >
                Ingreso
              </button>
            </div>
          </div>

          <div className="nx-kp-display">
            <div className="nx-display" style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '56px', color: isIncome && isValidAmount ? 'var(--accent-teal)' : 'var(--on-dark)' }}>
                {isIncome && isValidAmount ? '+' : ''}€{amount}
              </span>
            </div>

            <button
              type="button"
              className="nx-sub-nav-pill"
              onClick={cycleTargetAccount}
              style={{ marginTop: 'var(--sp-md)' }}
            >
              <CreditCard size={13} style={{ color: 'var(--primary)' }} />
              <span>{selectedAccountObj?.name} **{selectedAccountDigits} · {formattedAccountBalance}</span>
              {frozenAccounts[selectedProfileId] && <Snowflake size={12} style={{ color: 'var(--accent-light-blue)' }} />}
            </button>
          </div>

          <div className="nx-kp-cta-wrap">
            <button
              type="button"
              className="nx-btn-primary"
              style={{ width: '100%' }}
              disabled={!isValidAmount}
              onClick={goToDetails}
            >
              Continuar
            </button>
          </div>

          <div className="nx-kp-dock">
            <div className="nx-kp-ops">
              {['+', '−', '×', '÷', '='].map((op) => (
                <button key={op} type="button" onClick={() => handleOperator(op)}>
                  {op}
                </button>
              ))}
            </div>

            <div className="nx-kp-keys">
              {KEYPAD_GRID.map(({ key, sub }) => (
                <button
                  key={key}
                  type="button"
                  className={`nx-kp-btn ${key === ',' || key === 'backspace' ? 'ghost' : ''}`}
                  onClick={() => handleKey(key)}
                >
                  <span className="nx-kp-num">{key === 'backspace' ? '⌫' : key}</span>
                  <span className="nx-kp-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: ESTRUCTURA DE TARJETAS AGRUPADAS (rounded: 20px, inputs: 12px/56px) */}
      {step === 2 && (
        <div className="nx-detail-modal">
          <div className="nx-detail-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
              <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>

              <button
                type="button"
                className="nx-btn-pill-sm"
                style={{ color: 'var(--primary)' }}
                onClick={() => setStep(1)}
              >
                Cambiar importe
              </button>
            </div>

            <div style={{ marginBottom: 'var(--sp-lg)' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', display: 'block' }}
              >
                <span
                  className="nx-display"
                  style={{
                    display: 'block',
                    fontSize: '40px',
                    color: isIncome ? 'var(--accent-teal)' : 'var(--text-main)',
                  }}
                >
                  {isIncome ? '+' : '−'}€{amount}
                </span>
              </button>

              <span style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--primary)', marginTop: 'var(--sp-xs)' }}>
                {description.trim() || selectedAccountObj?.name || category}
              </span>

              <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginTop: 'var(--sp-xxs)' }}>
                {formatReadableDate(date)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-xl)' }}>
              <button
                type="button"
                className="nx-btn-pill-sm"
                onClick={() => switchTransactionType('Gasto')}
                style={{
                  flex: 1,
                  backgroundColor: !isIncome ? 'var(--primary)' : undefined,
                  color: !isIncome ? 'var(--on-primary)' : 'var(--primary)',
                }}
              >
                − Gasto
              </button>

              <button
                type="button"
                className="nx-btn-pill-sm"
                onClick={() => switchTransactionType('Ingreso')}
                style={{
                  flex: 1,
                  backgroundColor: isIncome ? 'var(--accent-teal)' : undefined,
                  color: isIncome ? '#FFFFFF' : 'var(--primary)',
                }}
              >
                + Ingreso
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TARJETA 1: ESTADO, TARJETA/CUENTA Y FECHA */}
              <div className="nx-group-card">
                <div className="nx-group-row">
                  <span className="nx-row-label">Estado</span>
                  <span style={{ fontWeight: 500 }}>{transaction ? 'Editando' : 'Completado'}</span>
                </div>

                <div className="nx-group-row">
                  <span className="nx-row-label">Tarjeta / Cuenta</span>
                  <button
                    type="button"
                    className="nx-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'account' ? null : 'account')}
                  >
                    <CreditCard size={15} />
                    <span>{selectedAccountObj?.name.toUpperCase()} **{selectedAccountDigits}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'account' && (
                  <div className="nx-inline-drawer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
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
                              padding: '12px 14px',
                              borderRadius: 'var(--rounded-md)',
                              border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                              backgroundColor: 'var(--bg-card-alt)',
                              color: isSel ? 'var(--primary)' : 'var(--text-main)',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <CreditCard size={15} style={{ color: 'var(--primary)' }} />
                              <span>{p.name} · **{digits}</span>
                              {isFrozen && <Snowflake size={12} style={{ color: 'var(--accent-light-blue)' }} />}
                            </span>
                            {isSel && <Check size={15} style={{ color: 'var(--primary)' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="nx-group-row">
                  <span className="nx-row-label">Fecha</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="nx-date-input"
                    required
                  />
                </div>
              </div>

              {/* TARJETA 2: CATEGORÍA, MÉTODO E IMPORTE */}
              <div className="nx-group-card">
                <div className="nx-group-row">
                  <span className="nx-row-label">Categoría</span>
                  <button
                    type="button"
                    className="nx-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'category' ? null : 'category')}
                  >
                    {categoryVisuals.icon}
                    <span>{category}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'category' && (
                  <div className="nx-inline-drawer">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
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
                              height: '36px',
                              padding: '0 14px 0 8px',
                              borderRadius: 'var(--rounded-full)',
                              border: selected ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                              backgroundColor: 'var(--bg-card-alt)',
                              color: selected ? 'var(--primary)' : 'var(--text-main)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: 'var(--rounded-full)',
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
                        className="nx-btn-pill-sm"
                        style={{ color: 'var(--primary)', border: '1px dashed var(--primary)' }}
                      >
                        <Plus size={13} /> Nueva
                      </button>
                    </div>

                    {isAddingCat && (
                      <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-md)' }}>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Nombre de categoría..."
                          className="nx-input"
                          style={{ margin: 0, flex: 1 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateInlineCategory}
                          className="nx-btn-dark"
                          style={{ height: '56px', padding: '0 20px' }}
                        >
                          Añadir
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="nx-group-row">
                  <span className="nx-row-label">{isIncome ? 'Recepción' : 'Método'}</span>
                  <button
                    type="button"
                    className="nx-row-action"
                    onClick={() => setOpenDrawer(openDrawer === 'method' ? null : 'method')}
                  >
                    <span>{paymentMethod}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {openDrawer === 'method' && (
                  <div className="nx-inline-drawer">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xs)' }}>
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
                            height: '36px',
                            padding: '0 16px',
                            borderRadius: 'var(--rounded-full)',
                            border: 0,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            backgroundColor: paymentMethod === m ? 'var(--primary)' : 'var(--bg-card-alt)',
                            color: paymentMethod === m ? '#FFFFFF' : 'var(--text-main)',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nx-group-row">
                  <span className="nx-row-label">Importe en análisis</span>
                  <button type="button" className="nx-row-action" onClick={() => setStep(1)}>
                    <Pencil size={13} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>€{amount}</span>
                  </button>
                </div>
              </div>

              {/* TARJETA 3: JUSTIFICANTE */}
              <div className="nx-group-card">
                <div className="nx-group-row">
                  <span className="nx-row-label">Justificante</span>

                  {invoiceFile || existingInvoiceName ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {invoiceFile ? invoiceFile.name : existingInvoiceName}
                      </span>
                      <button
                        type="button"
                        onClick={() => (invoiceFile ? setInvoiceFile(null) : setRemoveExistingInvoice(true))}
                        style={{ background: 'transparent', border: 0, color: 'var(--danger-red)', display: 'flex', padding: 0, cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
                      <label className="nx-row-action" style={{ margin: 0 }}>
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

                      <label className="nx-row-action" style={{ margin: 0 }}>
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

              {/* TARJETA 4: NOTA */}
              <div className="nx-group-card">
                <div className="nx-group-row">
                  <span className="nx-row-label">Nota</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                    <Pencil size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Añadir nota"
                      className="nx-note-input"
                    />
                  </div>
                </div>
              </div>

              {/* TARJETA 5: PAGO A PLAZOS */}
              {!isIncome && !transaction && (
                <div className="nx-group-card">
                  <div className="nx-group-row">
                    <span className="nx-row-label">Pago a plazos</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isInstallmentEnabled}
                      className={`nx-switch ${isInstallmentEnabled ? 'on' : ''}`}
                      onClick={() => {
                        triggerHaptic();
                        setInstallments(isInstallmentEnabled ? 1 : 3);
                      }}
                    >
                      <span className="nx-switch-thumb" />
                    </button>
                  </div>

                  {isInstallmentEnabled && (
                    <div className="nx-inline-drawer">
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[2, 3, 4, 6, 12, 24].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setInstallments(n)}
                            style={{
                              flex: 1,
                              height: '36px',
                              borderRadius: 'var(--rounded-full)',
                              border: 0,
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              backgroundColor: Number(installments) === n ? 'var(--primary)' : 'var(--bg-card-alt)',
                              color: Number(installments) === n ? '#FFFFFF' : 'var(--text-main)',
                            }}
                          >
                            {n}x
                          </button>
                        ))}
                      </div>
                      <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginTop: 'var(--sp-sm)' }}>
                        {installments} cuotas de {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numAmount / Number(installments))} / mes
                      </span>
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <p style={{ color: 'var(--danger-red)', fontSize: '12px', fontWeight: 500, marginBottom: 'var(--sp-md)' }}>
                  {formError}
                </p>
              )}

              <button type="submit" className="nx-btn-dark" style={{ width: '100%', marginTop: 'var(--sp-sm)' }}>
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
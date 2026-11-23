import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, Paperclip, Camera, Plus, Trash2, CreditCard, Snowflake } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { expenseCategories, incomeCategories } from '../utils/categories';
import { getCategoryVisuals } from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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

const REV_KEYPAD_CSS = `
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

  return (
    <>
      <style>{REV_KEYPAD_CSS}</style>

      {/* PASO 1: TECLADO REVOLUT CON SELECTOR DE CUENTA */}
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

            {/* PÍLDORA PARA CAMBIAR DE CUENTA DIRECTAMENTE EN EL TECLADO */}
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
              <span>{selectedAccountObj?.name}: {formattedAccountBalance}</span>
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

      {/* PASO 2: DETALLES + SELECTOR DE CUENTA */}
      {step === 2 && (
        <div className="sheet-layer" style={{ zIndex: 10000 }} onMouseDown={onClose}>
          <section
            className="bottom-sheet"
            style={{ background: 'var(--rev-bg)' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <button type="button" className="sheet-close" onClick={() => setStep(1)} aria-label="Volver">
                <ChevronLeft size={19} />
              </button>

              <div className="record-tabs">
                <button type="button" className={type === 'Gasto' ? 'active' : ''} onClick={() => switchTransactionType('Gasto')}>
                  Gasto
                </button>
                <button type="button" className={type === 'Ingreso' ? 'active' : ''} onClick={() => switchTransactionType('Ingreso')}>
                  Ingreso
                </button>
              </div>

              <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            {/* IMPORTE DESTACADO */}
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                border: '1px solid var(--rev-border)',
                background: 'var(--rev-card)',
                borderRadius: '18px',
                padding: '14px',
                marginBottom: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <strong style={{
                display: 'block',
                fontSize: '30px',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: isIncome ? 'var(--rev-green)' : 'var(--rev-text)',
              }}>
                {isIncome ? '+' : '−'}{amount} €
              </strong>
              <small style={{ fontSize: '11px', color: 'var(--rev-blue)', fontWeight: 700 }}>
                Toca para editar importe
              </small>
            </button>

            <form onSubmit={handleSubmit}>
              {/* SELECTOR DE CUENTA DESTINO */}
              <div style={{
                background: 'var(--rev-card)',
                borderRadius: '18px',
                padding: '14px',
                border: '1px solid var(--rev-border)',
                marginBottom: '12px',
              }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '8px' }}>
                  {isIncome ? 'Cuenta donde entra el ingreso' : 'Cuenta desde la que pagas'}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profiles.map((p) => {
                    const isSel = selectedProfileId === p.id;
                    const isFrozen = Boolean(frozenAccounts[p.id]);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          setSelectedProfileId(p.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 13px',
                          borderRadius: '999px',
                          border: isSel ? '1.5px solid var(--rev-blue)' : '1px solid var(--rev-border)',
                          background: isSel ? 'var(--rev-blue-soft)' : 'var(--rev-bg)',
                          color: isSel ? 'var(--rev-blue)' : 'var(--rev-text)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <CreditCard size={14} />
                        <span>{p.name}</span>
                        {isFrozen && <Snowflake size={12} style={{ color: 'var(--rev-blue)' }} />}
                      </button>
                    );
                  })}
                </div>
                {frozenAccounts[selectedProfileId] && (
                  <p style={{ fontSize: '11px', color: 'var(--rev-blue)', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>
                    Aviso: esta cuenta está congelada actualmente.
                  </p>
                )}
              </div>

              {/* CATEGORÍAS CON ICONOS DE COLORES REVOLUT */}
              <div style={{
                background: 'var(--rev-card)',
                borderRadius: '18px',
                padding: '14px',
                border: '1px solid var(--rev-border)',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)' }}>
                    Categoría de {type.toLowerCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCat((v) => !v)}
                    style={{ background: 'transparent', border: 0, color: 'var(--rev-blue)', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Nueva
                  </button>
                </div>

                {isAddingCat && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nombre categoría..."
                      style={{ margin: 0, height: '40px', flex: 1, background: 'var(--rev-bg)' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineCategory}
                      style={{ height: '40px', padding: '0 14px', borderRadius: '12px', border: 0, background: 'var(--rev-blue)', color: '#fff', fontWeight: 700, fontSize: '12px' }}
                    >
                      Añadir
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categoriesForType.map((c) => {
                    const selected = category === c;
                    const vis = getCategoryVisuals(c, type, 13);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px 6px 6px',
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
                          width: '22px',
                          height: '22px',
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
                </div>
              </div>

              {/* CONCEPTO, MÉTODO DE PAGO, FECHA Y CUOTAS */}
              <div style={{
                background: 'var(--rev-card)',
                borderRadius: '18px',
                padding: '14px',
                border: '1px solid var(--rev-border)',
                marginBottom: '12px',
              }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '12px' }}>
                  {isIncome ? 'Origen / Concepto' : 'Comercio / Concepto'}
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isIncome ? 'Ej. Nómina, Bizum, Reembolso...' : 'Ej. Eroski, Gasolina, Cena...'}
                    style={{ background: 'var(--rev-bg)' }}
                  />
                </label>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '6px' }}>
                    {isIncome ? 'Método de recepción' : 'Método de pago'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: 0,
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: paymentMethod === m ? 'var(--rev-blue)' : 'var(--rev-bg)',
                          color: paymentMethod === m ? '#fff' : 'var(--rev-muted)',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: !isIncome && !transaction ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: 0 }}>
                    Fecha
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ background: 'var(--rev-bg)' }} required />
                  </label>

                  {!isIncome && !transaction && (
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: 0 }}>
                      Plazos
                      <select value={installments} onChange={(e) => setInstallments(e.target.value)} style={{ background: 'var(--rev-bg)' }}>
                        <option value={1}>Pago único</option>
                        {[2, 3, 4, 6, 9, 12, 18, 24].map((n) => (
                          <option key={n} value={n}>{n} cuotas</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>

              {/* JUSTIFICANTE / RECIBO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '11px', borderRadius: '14px', border: '1px solid var(--rev-border)',
                  background: 'var(--rev-card)', color: 'var(--rev-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: 0,
                }}>
                  <Camera size={15} /> Foto ticket
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

                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '11px', borderRadius: '14px', border: '1px solid var(--rev-border)',
                  background: 'var(--rev-card)', color: 'var(--rev-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: 0,
                }}>
                  <Paperclip size={15} /> Adjuntar archivo
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

              {(invoiceFile || existingInvoiceName) && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '14px', background: 'var(--rev-card)',
                  border: '1px solid var(--rev-border)', fontSize: '12px', fontWeight: 700, marginBottom: '12px',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Paperclip size={13} style={{ color: 'var(--rev-blue)' }} />
                    {invoiceFile ? invoiceFile.name : existingInvoiceName}
                  </span>
                  <button
                    type="button"
                    onClick={() => (invoiceFile ? setInvoiceFile(null) : setRemoveExistingInvoice(true))}
                    style={{ background: 'transparent', border: 0, color: 'var(--rev-red)', cursor: 'pointer', display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {formError && (
                <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                  {formError}
                </p>
              )}

              <button type="submit" className="sheet-submit">
                {transaction ? 'Guardar cambios' : isIncome ? 'Guardar ingreso' : 'Guardar gasto'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
};

export default TransactionForm;
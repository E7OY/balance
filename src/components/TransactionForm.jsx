import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  /* =========================================================
     ANIMACIONES FLUIDAS ESTILO APPLE iOS / REVOLUT SHEET
     ========================================================= */
  @keyframes nx-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes nx-backdrop-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes nx-apple-sheet-in {
    0% {
      opacity: 0.55;
      transform: translate3d(0, 104%, 0) scale(0.965);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes nx-apple-sheet-out {
    0% {
      opacity: 1;
      transform: translate3d(0, var(--drag-y, 0px), 0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate3d(0, 105%, 0) scale(0.975);
    }
  }

  @keyframes nx-step-fade {
    from {
      opacity: 0;
      transform: translate3d(0, 10px, 0) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  /* =========================================================
     BACKDROP OSCURECIDO CON BLUR PROGRESIVO
     ========================================================= */
  .nx-sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(8, 10, 18, 0.46);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: nx-backdrop-in 0.36s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .nx-sheet-backdrop.closing {
    animation: nx-backdrop-out 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    pointer-events: none;
  }

  /* =========================================================
     POPUP SHEET PRINCIPAL — LIQUID GLASS + BARRITA APPLE
     ========================================================= */
  .nx-apple-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    max-width: 460px;
    margin: 0 auto;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    border-radius: 34px 34px 0 0;
    overflow: hidden;
    background:
      radial-gradient(120% 70% at 15% 0%, rgba(255, 255, 255, 0.88) 0%, transparent 58%),
      radial-gradient(100% 60% at 88% 10%, rgba(180, 198, 255, 0.34) 0%, transparent 55%),
      rgba(245, 247, 252, 0.84);
    backdrop-filter: blur(38px) saturate(200%);
    -webkit-backdrop-filter: blur(38px) saturate(200%);
    border-top: 1px solid rgba(255, 255, 255, 0.94);
    box-shadow:
      0 -20px 54px rgba(15, 23, 42, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.96);
    color: var(--ink);
    will-change: transform, opacity;
    transform-origin: bottom center;
    animation: nx-apple-sheet-in 0.46s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .dark .nx-apple-sheet {
    background:
      radial-gradient(120% 70% at 15% 0%, rgba(120, 130, 255, 0.18) 0%, transparent 58%),
      radial-gradient(100% 60% at 88% 12%, rgba(255, 255, 255, 0.07) 0%, transparent 55%),
      rgba(16, 18, 25, 0.86);
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow:
      0 -22px 60px rgba(0, 0, 0, 0.65),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    color: var(--on-dark);
  }

  .nx-apple-sheet.step-keypad {
    height: min(88dvh, 750px);
  }
  .nx-apple-sheet.step-details {
    max-height: 90dvh;
  }
  .nx-apple-sheet.dragging {
    animation: none !important;
    transition: none !important;
  }
  .nx-apple-sheet.snapping {
    animation: none !important;
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1) !important;
  }
  .nx-apple-sheet.closing {
    animation: nx-apple-sheet-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
    pointer-events: none;
  }

  /* ZONA DE AGARRE CON LA BARRITA ESTILO iOS */
  .nx-sheet-grabber-zone {
    width: 100%;
    padding: 10px 0 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    touch-action: none;
    flex-shrink: 0;
    user-select: none;
  }
  .nx-sheet-grabber-zone:active {
    cursor: grabbing;
  }
  .nx-sheet-grabber-pill {
    width: 40px;
    height: 5px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.2);
    transition: width 0.18s ease, background-color 0.18s ease;
  }
  .nx-sheet-grabber-zone:active .nx-sheet-grabber-pill {
    width: 48px;
    background: rgba(15, 23, 42, 0.34);
  }
  .dark .nx-sheet-grabber-pill {
    background: rgba(255, 255, 255, 0.28);
  }
  .dark .nx-sheet-grabber-zone:active .nx-sheet-grabber-pill {
    background: rgba(255, 255, 255, 0.45);
  }

  .nx-step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    animation: nx-step-fade 0.26s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .nx-kp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px var(--sp-lg) var(--sp-xs);
    touch-action: none;
  }

  .nx-kp-close {
    width: 36px;
    height: 36px;
    border-radius: var(--rounded-full);
    border: 1px solid rgba(255, 255, 255, 0.78);
    background: rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .nx-kp-close:active {
    transform: scale(0.92);
  }
  .dark .nx-kp-close {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.1);
    color: var(--on-dark);
  }

  .nx-kp-seg {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: var(--rounded-full);
    background: rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
  .dark .nx-kp-seg {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .nx-kp-seg button {
    border: 0;
    padding: 6px 16px;
    border-radius: var(--rounded-full);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background-color: transparent;
    color: var(--text-mute);
    transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }
  .nx-kp-seg button.active {
    background: #FFFFFF;
    color: var(--ink);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  }
  .dark .nx-kp-seg button {
    color: var(--on-dark-mute);
  }
  .dark .nx-kp-seg button.active {
    background: rgba(255, 255, 255, 0.92);
    color: var(--canvas-dark);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
  }

  .nx-kp-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 var(--sp-xl);
    min-height: 120px;
  }

  .nx-apple-sheet .nx-sub-nav-pill {
    background: rgba(255, 255, 255, 0.64);
    color: var(--ink);
    border: 1px solid rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  }
  .dark .nx-apple-sheet .nx-sub-nav-pill {
    background: rgba(255, 255, 255, 0.1);
    color: var(--on-dark);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  }

  .nx-kp-cta-wrap {
    padding: 0 var(--sp-xl) var(--sp-md);
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
  }
  .nx-kp-cta {
    width: 100%;
    height: 50px;
    border-radius: var(--rounded-full);
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(11, 11, 13, 0.9);
    color: #FFFFFF;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(11, 11, 13, 0.16);
    transition: opacity 0.15s ease, transform 0.12s ease;
  }
  .dark .nx-kp-cta {
    background: rgba(255, 255, 255, 0.94);
    color: var(--canvas-dark);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }
  .nx-kp-cta:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .nx-kp-cta:active:not(:disabled) {
    transform: scale(0.98);
  }

  .nx-kp-dock {
    background: rgba(255, 255, 255, 0.44);
    backdrop-filter: blur(28px) saturate(190%);
    -webkit-backdrop-filter: blur(28px) saturate(190%);
    padding-bottom: calc(var(--sp-sm) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(255, 255, 255, 0.75);
  }
  .dark .nx-kp-dock {
    background: rgba(22, 24, 32, 0.62);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .nx-kp-keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
    padding: 8px;
    max-width: 460px;
    margin: 0 auto;
  }
  .nx-kp-btn {
    height: 50px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.84);
    background: rgba(255, 255, 255, 0.72);
    color: var(--ink);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 0.08s ease, background-color 0.1s ease;
  }
  .dark .nx-kp-btn {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    color: var(--on-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }
  .nx-kp-btn.ghost {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }
  .nx-kp-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.94);
  }
  .dark .nx-kp-btn:active {
    background: rgba(255, 255, 255, 0.18);
  }
  .nx-kp-num {
    font-size: 23px;
    font-weight: 500;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .nx-kp-sub {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.24px;
    color: var(--text-mute);
    margin-top: 1px;
    height: 10px;
  }
  .dark .nx-kp-sub {
    color: var(--on-dark-mute);
  }

  /* =========================================================
     PASO 2: DETALLES DENTRO DEL MISMO SHEET
     ========================================================= */
  .nx-detail-scroll {
    overflow-y: auto;
    padding: 4px var(--sp-lg) calc(var(--sp-xxl) + env(safe-area-inset-bottom, 0px));
    -webkit-overflow-scrolling: touch;
  }
  .nx-detail-inner {
    max-width: 440px;
    margin: 0 auto;
  }
  .nx-group-card {
    background: rgba(255, 255, 255, 0.66);
    border: 1px solid rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.92);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xs) var(--sp-xl);
    margin-bottom: var(--sp-md);
  }
  .dark .nx-group-card {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.13);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.14);
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
    background: rgba(255, 255, 255, 0.16);
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
  const [resetNextDigit, setResetNextDigit] = useState(false);

  const [type, setType] = useState(initialType);
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);
  const [openDrawer, setOpenDrawer] = useState(null);

  // Estados para cierre animado y arrastre de la barrita estilo iOS
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragStartYRef = useRef(0);

  const requestClose = () => {
    if (isClosing) return;
    triggerHaptic();
    setIsClosing(true);
    window.setTimeout(() => {
      onClose?.();
    }, 270);
  };

  const handleDragPointerDown = (e) => {
    if (isClosing) return;
    dragStartYRef.current = e.clientY;
    setIsDragging(true);
    setIsSnapping(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleDragPointerMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartYRef.current;
    if (delta > 0) {
      setDragY(delta);
    } else {
      // Ligera resistencia elástica si tira hacia arriba
      setDragY(delta * 0.18);
    }
  };

  const handleDragPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 115) {
      requestClose();
    } else {
      setIsSnapping(true);
      setDragY(0);
      window.setTimeout(() => setIsSnapping(false), 360);
    }
  };

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
    triggerHaptic();
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
      requestClose();
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

  const sheetClasses = [
    'nx-apple-sheet',
    step === 1 ? 'step-keypad' : 'step-details',
    isDragging ? 'dragging' : '',
    isSnapping ? 'snapping' : '',
    isClosing ? 'closing' : '',
  ].filter(Boolean).join(' ');

  return createPortal(
    <>
      <style>{NX_FORM_CSS}</style>

      <div
        className={`nx-sheet-backdrop ${isClosing ? 'closing' : ''}`}
        onClick={requestClose}
        aria-hidden="true"
      />

      <div
        className={sheetClasses}
        role="dialog"
        aria-modal="true"
        style={{
          '--drag-y': `${Math.max(0, dragY)}px`,
          transform: isDragging || isSnapping ? `translate3d(0, ${dragY}px, 0)` : undefined,
        }}
      >
        {/* BARRITA SUPERIOR ESTILO APPLE CON GESTO DRAG-TO-DISMISS */}
        <div
          className="nx-sheet-grabber-zone"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
        >
          <span className="nx-sheet-grabber-pill" />
        </div>

        {/* PASO 1: TECLADO */}
        {step === 1 && (
          <div key="step-1" className="nx-step-body">
            <div className="nx-kp-header">
              <button
                type="button"
                className="nx-kp-close"
                onClick={requestClose}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>

              <span className="nx-label" style={{ color: 'inherit' }}>
                {transaction ? `Editar ${type.toLowerCase()}` : isIncome ? 'Añadir ingreso' : 'Añadir gasto'}
              </span>

              <span style={{ width: '36px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--sp-xs)' }}>
              <div className="nx-kp-seg">
                <button
                  type="button"
                  className={type === 'Gasto' ? 'active' : ''}
                  onClick={() => switchTransactionType('Gasto')}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  className={type === 'Ingreso' ? 'active' : ''}
                  onClick={() => switchTransactionType('Ingreso')}
                >
                  Ingreso
                </button>
              </div>
            </div>

            <div className="nx-kp-display">
              <div className="nx-display" style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: '56px', color: isIncome && isValidAmount ? 'var(--accent-teal)' : 'inherit' }}>
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
                className="nx-kp-cta"
                disabled={!isValidAmount}
                onClick={goToDetails}
              >
                Continuar
              </button>
            </div>

            <div className="nx-kp-dock">
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

        {/* PASO 2: DETALLES */}
        {step === 2 && (
          <div key="step-2" className="nx-step-body nx-detail-scroll">
            <div className="nx-detail-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
                <button type="button" className="nx-kp-close" onClick={requestClose} aria-label="Cerrar">
                  <X size={18} />
                </button>

                <button
                  type="button"
                  className="nx-btn-pill-sm"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    triggerHaptic();
                    setStep(1);
                  }}
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
                      color: isIncome ? 'var(--accent-teal)' : 'inherit',
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
                    <span className="nx-row-label">Descripción</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                      <Pencil size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Añadir descripción"
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

                <button type="submit" className="nx-kp-cta" style={{ marginTop: 'var(--sp-sm)' }}>
                  {transaction ? 'Guardar cambios' : isIncome ? 'Guardar ingreso' : 'Guardar gasto'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
};

export default TransactionForm;
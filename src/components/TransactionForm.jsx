import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
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

// Temas de tarjeta (sin degradados rosas por defecto)
const FORM_CARD_THEME_BGS = {
  'revolut-standard': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 52%, #1E3A8A 100%)',
  'metal-black': 'linear-gradient(145deg, #2C2D32 0%, #16171A 52%, #09090B 100%)',
  'metal-space-grey': 'linear-gradient(145deg, #5C606B 0%, #3A3D45 50%, #23252A 100%)',
  'metal-gold': 'linear-gradient(135deg, #C8A45D 0%, #9E7B38 48%, #735723 100%)',
  'metal-rose-gold': 'linear-gradient(135deg, #B8867E 0%, #8F5D56 50%, #633B36 100%)',
  'metal-lavender': 'linear-gradient(135deg, #8B7AD9 0%, #6353B5 52%, #44368A 100%)',
  'ultra-platinum': 'linear-gradient(135deg, #9EA4B0 0%, #6C727F 48%, #464B56 100%)',
  chromatic: 'linear-gradient(125deg, #3B82F6 0%, #6366F1 45%, #10B981 100%)',
  disposable: 'linear-gradient(135deg, #E11D48 0%, #BE123C 55%, #881337 100%)',
  cobalt: 'linear-gradient(145deg, #494FDF 0%, #2D32B8 55%, #1A1E7A 100%)',
  emerald: 'linear-gradient(145deg, #00A87E 0%, #007558 55%, #024B39 100%)',
  'midnight-aurora': 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0EA5E9 100%)',
  'sunset-amber': 'linear-gradient(135deg, #F97316 0%, #C2410C 52%, #7C2D12 100%)',
  bronze: 'linear-gradient(145deg, #936D62 0%, #63473F 55%, #3E2C27 100%)',
};

const DEFAULT_FALLBACK_KEYS = [
  'cobalt',
  'metal-black',
  'metal-gold',
  'emerald',
  'metal-space-grey',
  'midnight-aurora',
];

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

const formatEuro = (val, { minDecimals = 2, maxDecimals = 2 } = {}) => {
  const num = Number(val) || 0;
  const sign = num < 0 ? '-' : '';
  const formatted = new Intl.NumberFormat('es-ES', {
    useGrouping: 'always',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(Math.abs(num));
  return `${sign}€${formatted}`;
};

const formatKeypadDisplay = (rawAmount = '0') => {
  const [intPart = '0', decPart] = String(rawAmount).split(',');
  const cleanInt = intPart.replace(/\D/g, '') || '0';
  const groupedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${groupedInt},${decPart}` : groupedInt;
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

const MiniCardNetworkBadge = ({ net, small = false }) => {
  if (net === 'none') return null;
  if (net === 'visa') {
    return (
      <span style={{ fontSize: small ? '8.5px' : '10px', fontWeight: 800, fontStyle: 'italic', letterSpacing: '-0.03em', opacity: 0.95 }}>
        VISA
      </span>
    );
  }
  if (net === 'amex') {
    return (
      <span style={{ fontSize: small ? '7px' : '8px', fontWeight: 800, letterSpacing: '0.03em', opacity: 0.95 }}>
        AMEX
      </span>
    );
  }
  const dotSize = small ? '9px' : '11px';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <i style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: '#EB001B', display: 'inline-block' }} />
      <i style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: '#F79E1B', marginLeft: small ? '-3.5px' : '-4px', opacity: 0.92, display: 'inline-block' }} />
    </span>
  );
};

const WalletAccountSelectorRow = ({
  selectedCard,
  backCard,
  isFrozen,
  onClick,
  isExpanded = false,
}) => (
  <button
    type="button"
    className="nx-wallet-sel-bar"
    onClick={onClick}
    aria-expanded={isExpanded}
  >
    <div className="nx-wallet-sel-left">
      <div className="nx-wallet-sel-title-row">
        <span className="nx-wallet-sel-name">{selectedCard?.name || 'Personal'}</span>
        {isFrozen && <Snowflake size={13} style={{ color: '#38BDF8', flexShrink: 0 }} />}
      </div>
      <span className="nx-wallet-sel-sub">
        Disponible · {formatEuro(selectedCard?.balance ?? 0)}
      </span>
    </div>

    <div className="nx-wallet-sel-right">
      <div className="nx-mini-wallet" aria-hidden="true">
        <div className="nx-mini-wallet-back" />

        <div
          className="nx-mini-wallet-card back"
          style={{
            background:
              backCard && backCard.id !== selectedCard?.id
                ? backCard.bg
                : 'linear-gradient(145deg, #3F434C 0%, #23252A 100%)',
          }}
        />

        <div
          key={selectedCard?.id}
          className="nx-mini-wallet-card front"
          style={{ background: selectedCard?.bg || FORM_CARD_THEME_BGS.cobalt }}
        >
          <span className="nx-mini-wallet-card-title">
            {selectedCard?.name || 'Card'}
          </span>
          <MiniCardNetworkBadge net={selectedCard?.net} small />
        </div>

        <img
          src="/wallet_pouch.png"
          alt=""
          className="nx-mini-wallet-pouch"
          draggable={false}
        />
      </div>

    </div>
  </button>
);

const NX_FORM_CSS = `
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
      opacity: 0.6;
      transform: translate3d(0, 104%, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  @keyframes nx-apple-sheet-out {
    0% {
      opacity: 1;
      transform: translate3d(0, var(--drag-y, 0px), 0);
    }
    100% {
      opacity: 0;
      transform: translate3d(0, 105%, 0);
    }
  }
  @keyframes nx-step-fade {
    from {
      opacity: 0;
      transform: translate3d(0, 8px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  @keyframes nx-mini-card-pop {
    0% {
      transform: translate3d(0, -8px, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  /* BACKDROP LIMPIO */
  .nx-sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(10, 12, 20, 0.44);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: nx-backdrop-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .nx-sheet-backdrop.closing {
    animation: nx-backdrop-out 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    pointer-events: none;
  }

  /* SHEET PRINCIPAL — SIN DEGRADADOS ROSAS NI BRILLOS DE COLOR */
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
    border-radius: 30px 30px 0 0;
    overflow: hidden;
    background: #FAFAFB;
    border-top: 1px solid #EAECEF;
    box-shadow: 0 -16px 44px rgba(15, 23, 42, 0.16);
    color: #111827;
    will-change: transform, opacity;
    transform-origin: bottom center;
    animation: nx-apple-sheet-in 0.42s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .dark .nx-apple-sheet {
    background: #13151C;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 -20px 52px rgba(0, 0, 0, 0.6);
    color: #FFFFFF;
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
    transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1) !important;
  }
  .nx-apple-sheet.closing {
    animation: nx-apple-sheet-out 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
    pointer-events: none;
  }

  /* BARRITA DE AGARRE */
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
  .nx-sheet-grabber-pill {
    width: 38px;
    height: 5px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.16);
    transition: width 0.18s ease, background-color 0.18s ease;
  }
  .dark .nx-sheet-grabber-pill {
    background: rgba(255, 255, 255, 0.24);
  }

  .nx-step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    animation: nx-step-fade 0.24s cubic-bezier(0.32, 0.72, 0, 1);
  }

  /* CABECERA Y BOTÓN CERRAR */
  .nx-kp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 18px 8px;
    touch-action: none;
  }
  .nx-kp-close {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
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
    border-color: rgba(255, 255, 255, 0.12);
    background: #1B1E27;
    color: #FFFFFF;
  }

  /* TABS GASTO / INGRESO */
  .nx-kp-seg {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: 999px;
    background: #ECEEF2;
    border: 1px solid #EAECEF;
  }
  .dark .nx-kp-seg {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.09);
  }
  .nx-kp-seg button {
    border: 0;
    padding: 6px 18px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background-color: transparent;
    color: #6B7280;
    transition: background-color 0.16s ease, color 0.16s ease;
  }
  .nx-kp-seg button.active {
    background: #FFFFFF;
    color: #111827;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  }
  .dark .nx-kp-seg button {
    color: rgba(255, 255, 255, 0.6);
  }
  .dark .nx-kp-seg button.active {
    background: #FFFFFF;
    color: #111827;
  }

  /* DISPLAY DE IMPORTE */
  .nx-kp-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    min-height: 130px;
  }

  /* =========================================================
     SELECTOR DE CUENTA CON MINI CARTERA DE PIEL (COMO EN LA IMAGEN)
     ========================================================= */
/* =========================================================
     SELECTOR DE CUENTA CON MINI CARTERA DE PIEL PULIDA
     ========================================================= */
  .nx-wallet-sel-bar {
    width: 100%;
    max-width: 380px;
    height: 66px;
    padding: 0 16px 0 20px;
    border-radius: 18px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #111827;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    font-family: inherit;
    overflow: hidden;
    box-sizing: border-box;
    transition: background-color 0.14s ease, transform 0.12s ease, border-color 0.14s ease;
  }
  .nx-wallet-sel-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    flex: 1;
    text-align: left;
  }
  .nx-wallet-sel-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
  }
  .nx-wallet-sel-name {
    font-size: 15.5px;
    font-weight: 600;
    letter-spacing: -0.015em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nx-wallet-sel-sub {
    font-size: 12px;
    font-weight: 500;
    color: #9CA3AF;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* MINI CARTERA PROPORCIÓN ANCHA Y BAJA (CALCADA A LA REFERENCIA) */
  .nx-mini-wallet {
    position: relative;
    width: 146px;
    height: 58px;
    align-self: flex-end;
    overflow: hidden;
    flex-shrink: 0;
    pointer-events: none;
  }

  /* Reborde trasero de cuero que asoma a los lados de las tarjetas */
  .nx-mini-wallet-back {
    position: absolute;
    left: 2px;
    right: 2px;
    top: 11px;
    bottom: -10px;
    border-radius: 11px 11px 0 0;
    background: linear-gradient(180deg, #5A3822 0%, #382011 100%);
    box-shadow: inset 0 1px 0 rgba(255, 214, 175, 0.22);
    z-index: 0;
  }

  .nx-mini-wallet-card {
    position: absolute;
    left: 9px;
    right: 9px;
    height: 44px;
    border-radius: 7px 7px 2px 2px;
    box-sizing: border-box;
  }
  .nx-mini-wallet-card.back {
    top: 3px;
    left: 11px;
    right: 11px;
    z-index: 1;
    box-shadow:
      0 -1px 4px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  /* Detalle de muescas sutiles en la tarjeta trasera como en la foto */
  .nx-mini-wallet-card.back::after {
    content: "";
    position: absolute;
    top: 0;
    right: 16px;
    width: 36px;
    height: 5px;
    background: repeating-linear-gradient(
      105deg,
      rgba(255, 255, 255, 0.28) 0px,
      rgba(255, 255, 255, 0.28) 1px,
      transparent 1px,
      transparent 6px
    );
  }

  .nx-mini-wallet-card.front {
    top: 7px;
    z-index: 2;
    padding: 5px 9px;
    color: #FFFFFF;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    box-shadow:
      0 -1px 5px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.36);
    animation: nx-mini-card-pop 0.26s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .nx-mini-wallet-card-title {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: -0.01em;
    max-width: 82px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }

  /* Bolsillo frontal más bajo para despejar por completo texto y red de la tarjeta */
  .nx-mini-wallet-pouch {
    position: absolute;
    width: 119%;
    max-width: none;
    height: auto;
    left: -10.5%;
    bottom: -52px;
    z-index: 3;
    pointer-events: none;
    filter: drop-shadow(0 -2px 4px rgba(24, 12, 5, 0.22));
  }

  /* BOTÓN PRINCIPAL (CTA) */
  .nx-kp-cta-wrap {
    padding: 0 18px 12px;
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .nx-kp-cta {
    width: 100%;
    height: 50px;
    border-radius: 999px;
    border: 0;
    background: #111827;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.12s ease;
  }
  .dark .nx-kp-cta {
    background: #FFFFFF;
    color: #111827;
  }
  .nx-kp-cta:disabled {
    opacity: 0.32;
    cursor: not-allowed;
  }
  .nx-kp-cta:active:not(:disabled) {
    transform: scale(0.985);
  }

  /* TECLADO NUMÉRICO PLANO Y LIMPIO */
  .nx-kp-dock {
    background: #F3F4F6;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid #EAECEF;
  }
  .dark .nx-kp-dock {
    background: #16171C;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .nx-kp-keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
    padding: 8px 10px;
    max-width: 460px;
    margin: 0 auto;
  }
  .nx-kp-btn {
    height: 50px;
    border-radius: 14px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 0.08s ease, background-color 0.1s ease;
  }
  .dark .nx-kp-btn {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #1E2028;
    color: #FFFFFF;
  }
  .nx-kp-btn.ghost {
    background: transparent;
    border-color: transparent;
  }
  .nx-kp-btn:active {
    transform: scale(0.95);
    background: #EAECEF;
  }
  .dark .nx-kp-btn:active {
    background: rgba(255, 255, 255, 0.14);
  }
  .nx-kp-num {
    font-size: 22px;
    font-weight: 500;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .nx-kp-sub {
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.25px;
    color: #9CA3AF;
    margin-top: 1px;
    height: 10px;
  }

  /* =========================================================
     PASO 2: DETALLES — CAJAS CON BORDE #EAECEF IGUAL QUE HOME
     ========================================================= */
  .nx-detail-scroll {
    overflow-y: auto;
    padding: 4px 18px calc(28px + env(safe-area-inset-bottom, 0px));
    -webkit-overflow-scrolling: touch;
  }
  .nx-detail-inner {
    max-width: 440px;
    margin: 0 auto;
  }

  .nx-account-picker-wrap {
    margin-bottom: 12px;
  }
  .nx-account-picker-wrap .nx-wallet-sel-bar {
    max-width: none;
  }

  .nx-account-drawer-card {
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 8px;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .dark .nx-account-drawer-card {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
  }

  .nx-account-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 13px;
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.14s ease;
  }
  .nx-account-option:hover,
  .nx-account-option:active {
    background: #F9FAFB;
  }
  .dark .nx-account-option:hover,
  .dark .nx-account-option:active {
    background: rgba(255, 255, 255, 0.04);
  }
  .nx-account-option.selected {
    background: #F3F4F6;
    border-color: #E5E7EB;
  }
  .dark .nx-account-option.selected {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.12);
  }
  .nx-account-swatch {
    width: 42px;
    height: 28px;
    border-radius: 6px;
    padding: 4px 5px;
    box-sizing: border-box;
    color: #FFFFFF;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .nx-group-card {
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 0 16px;
    margin-bottom: 12px;
    box-shadow: none;
  }
  .dark .nx-group-card {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
  }

  .nx-group-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 50px;
    padding: 12px 0;
    font-size: 14px;
  }
  .nx-group-row + .nx-group-row {
    border-top: 1px solid #F1F3F5;
  }
  .dark .nx-group-row + .nx-group-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }

  .nx-row-label {
    color: #9CA3AF;
    font-weight: 500;
    font-size: 13.5px;
    flex-shrink: 0;
  }
  .nx-row-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    padding: 0;
    color: #111827;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: right;
  }
  .dark .nx-row-action {
    color: #FFFFFF;
  }

  .nx-inline-drawer {
    padding: 12px 0 14px;
    border-top: 1px solid #F1F3F5;
  }
  .dark .nx-inline-drawer {
    border-top-color: rgba(255, 255, 255, 0.07);
  }

  .nx-note-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: #111827;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    outline: none;
  }
  .dark .nx-note-input {
    color: #FFFFFF;
  }
  .nx-note-input::placeholder {
    color: #9CA3AF;
    font-weight: 400;
  }

  .nx-date-input {
    border: 0;
    background: transparent;
    color: #111827;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    outline: none;
    cursor: pointer;
  }
  .dark .nx-date-input {
    color: #FFFFFF;
  }

  .nx-switch {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    border: 0;
    padding: 3px;
    background: #E5E7EB;
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
    background: #111827;
  }
  .dark .nx-switch.on {
    background: var(--primary);
  }
  .nx-switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 999px;
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
    transactions,
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

  // Cierre animado y gesto drag-to-dismiss
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
    }, 260);
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
    setDragY(delta > 0 ? delta : delta * 0.18);
  };

  const handleDragPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 115) {
      requestClose();
    } else {
      setIsSnapping(true);
      setDragY(0);
      window.setTimeout(() => setIsSnapping(false), 340);
    }
  };

  const frozenAccounts = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('balance-frozen-accounts') || '{}') || {};
    } catch {
      return {};
    }
  }, []);

  // Cuentas enriquecidas con su color real, red y saldo
  const accountsWithCards = useMemo(() => {
    let savedThemes = {};
    let savedNets = {};
    try {
      savedThemes = JSON.parse(localStorage.getItem('balance-account-themes') || '{}') || {};
      savedNets = JSON.parse(localStorage.getItem('balance-account-networks') || '{}') || {};
    } catch {}

    return profiles.map((p, idx) => {
      const pTxs = p.id === activeProfileId
        ? transactions
        : (getTransactionsForProfile ? getTransactionsForProfile(p.id) : []);
      const bal = (Array.isArray(pTxs) ? pTxs : []).reduce((acc, tx) => {
        const amt = Number(tx.amount) || 0;
        return tx.type === 'Ingreso' ? acc + amt : tx.type === 'Gasto' ? acc - amt : acc;
      }, 0);

      const fallbackKey = DEFAULT_FALLBACK_KEYS[idx % DEFAULT_FALLBACK_KEYS.length];
      const themeKey = savedThemes[p.id] || fallbackKey;

      return {
        ...p,
        balance: bal,
        digits: getMaskedDigits(p.id),
        bg: FORM_CARD_THEME_BGS[themeKey] || FORM_CARD_THEME_BGS.cobalt,
        net: savedNets[p.id] || (idx % 2 === 0 ? 'mastercard' : 'visa'),
      };
    });
  }, [profiles, activeProfileId, transactions, getTransactionsForProfile]);

  const selectedCard = useMemo(
    () => accountsWithCards.find((a) => a.id === selectedProfileId) || accountsWithCards[0],
    [accountsWithCards, selectedProfileId],
  );

  const backCard = useMemo(
    () => accountsWithCards.find((a) => a.id !== selectedCard?.id) || null,
    [accountsWithCards, selectedCard],
  );

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
  const displayAmountStr = formatKeypadDisplay(amount);

  const cycleTargetAccount = () => {
    if (accountsWithCards.length <= 1) return;
    triggerHaptic();
    const idx = accountsWithCards.findIndex((p) => p.id === selectedProfileId);
    const next = accountsWithCards[(idx + 1) % accountsWithCards.length];
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
        triggerHaptic('success');
      } else {
        await addTransaction(txData);
      }
      setIsClosing(true);
      window.setTimeout(() => onClose?.(), 260);
    } catch (err) {
      setFormError(err.message);
    }
  };

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
        <div
          className="nx-sheet-grabber-zone"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
        >
          <span className="nx-sheet-grabber-pill" />
        </div>

        {/* PASO 1: TECLADO + SELECTOR CON CARTERA */}
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

              <span style={{ fontSize: '15px', fontWeight: 600 }}>
                {transaction ? `Editar ${type.toLowerCase()}` : isIncome ? 'Añadir ingreso' : 'Añadir gasto'}
              </span>

              <span style={{ width: '38px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
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
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
                <span
                  style={{
                    fontSize: '52px',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                    color: isIncome && isValidAmount ? '#10B981' : !isIncome && isValidAmount ? '#D93829' : 'inherit',
                  }}
                >
                  {isValidAmount ? (isIncome ? '+ ' : '- ') : ''}€{displayAmountStr}
                </span>
              </div>

              <WalletAccountSelectorRow
                selectedCard={selectedCard}
                backCard={backCard}
                isFrozen={Boolean(frozenAccounts[selectedProfileId])}
                onClick={cycleTargetAccount}
              />
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

        {/* PASO 2: DETALLES LIMPIOS + SELECTOR CON CARTERA DESPLEGABLE */}
        {step === 2 && (
          <div key="step-2" className="nx-step-body nx-detail-scroll">
            <div className="nx-detail-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <button type="button" className="nx-kp-close" onClick={requestClose} aria-label="Cerrar">
                  <X size={18} />
                </button>

                <div className="nx-kp-seg">
                  <button
                    type="button"
                    className={!isIncome ? 'active' : ''}
                    onClick={() => switchTransactionType('Gasto')}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    className={isIncome ? 'active' : ''}
                    onClick={() => switchTransactionType('Ingreso')}
                  >
                    Ingreso
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setStep(1);
                  }}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    border: '1px solid #EAECEF',
                    background: '#FFFFFF',
                    color: '#111827',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Importe
                </button>
              </div>

              <div style={{ marginBottom: '16px', paddingLeft: '2px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', display: 'block' }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '36px',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      fontVariantNumeric: 'tabular-nums',
                      color: isIncome ? '#10B981' : '#D93829',
                    }}
                  >
                    {isIncome ? '+ ' : '- '}€{displayAmountStr}
                  </span>
                </button>

                <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B7280', marginTop: '2px' }}>
                  {description.trim() || category} · {formatReadableDate(date)}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                {/* SELECTOR DE CUENTA CON LA MINI CARTERA Y TARJETA SELECCIONADA */}
                <div className="nx-account-picker-wrap">
                  <WalletAccountSelectorRow
                    selectedCard={selectedCard}
                    backCard={backCard}
                    isFrozen={Boolean(frozenAccounts[selectedProfileId])}
                    isExpanded={openDrawer === 'account'}
                    onClick={() => {
                      triggerHaptic();
                      setOpenDrawer(openDrawer === 'account' ? null : 'account');
                    }}
                  />

                  {openDrawer === 'account' && (
                    <div className="nx-account-drawer-card">
                      {accountsWithCards.map((acc) => {
                        const isSel = selectedProfileId === acc.id;
                        const isFrozen = Boolean(frozenAccounts[acc.id]);
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            className={`nx-account-option ${isSel ? 'selected' : ''}`}
                            onClick={() => {
                              triggerHaptic();
                              setSelectedProfileId(acc.id);
                              setOpenDrawer(null);
                            }}
                          >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <div className="nx-account-swatch" style={{ background: acc.bg }}>
                                <MiniCardNetworkBadge net={acc.net} small />
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{acc.name}</span>
                                  {isFrozen && <Snowflake size={12} style={{ color: '#38BDF8' }} />}
                                </div>
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: '12.5px',
                                    fontWeight: 500,
                                    color: '#6B7280',
                                    marginTop: '2px',
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  Disponible · {formatEuro(acc.balance)}
                                </span>
                              </div>
                            </div>

                            {isSel && <Check size={16} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CAJA 1: CATEGORÍA, MÉTODO Y FECHA */}
                <div className="nx-group-card">
                  <div className="nx-group-row">
                    <span className="nx-row-label">Categoría</span>
                    <button
                      type="button"
                      className="nx-row-action"
                      onClick={() => setOpenDrawer(openDrawer === 'category' ? null : 'category')}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '999px',
                          background: categoryVisuals.bg,
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {categoryVisuals.icon}
                      </span>
                      <span>{category}</span>
                      <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                    </button>
                  </div>

                  {openDrawer === 'category' && (
                    <div className="nx-inline-drawer">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                                padding: '0 13px 0 8px',
                                borderRadius: '999px',
                                border: selected ? '1.5px solid #111827' : '1px solid #EAECEF',
                                backgroundColor: selected ? '#F3F4F6' : 'transparent',
                                color: 'inherit',
                                fontSize: '12.5px',
                                fontWeight: selected ? 600 : 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              <span
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '999px',
                                  background: vis.bg,
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
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
                            gap: '5px',
                            height: '36px',
                            padding: '0 14px',
                            borderRadius: '999px',
                            border: '1px dashed #9CA3AF',
                            background: 'transparent',
                            color: 'inherit',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          <Plus size={13} /> Nueva
                        </button>
                      </div>

                      {isAddingCat && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Nombre de categoría..."
                            className="nx-input"
                            style={{ margin: 0, flex: 1, height: '42px' }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineCategory}
                            className="nx-kp-cta"
                            style={{ width: 'auto', height: '42px', padding: '0 18px', fontSize: '13.5px' }}
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
                      <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                    </button>
                  </div>

                  {openDrawer === 'method' && (
                    <div className="nx-inline-drawer">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {PAYMENT_METHODS.map((m) => {
                          const active = paymentMethod === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                triggerHaptic();
                                setPaymentMethod(m);
                                setOpenDrawer(null);
                              }}
                              style={{
                                height: '34px',
                                padding: '0 15px',
                                borderRadius: '999px',
                                border: active ? '1px solid #111827' : '1px solid #EAECEF',
                                fontSize: '12.5px',
                                fontWeight: active ? 600 : 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                backgroundColor: active ? '#111827' : 'transparent',
                                color: active ? '#FFFFFF' : 'inherit',
                              }}
                            >
                              {m}
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

                {/* CAJA 2: DESCRIPCIÓN Y JUSTIFICANTE */}
                <div className="nx-group-card">
                  <div className="nx-group-row">
                    <span className="nx-row-label">Descripción</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                      <Pencil size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej. Cena, Supermercado..."
                        className="nx-note-input"
                      />
                    </div>
                  </div>

                  <div className="nx-group-row">
                    <span className="nx-row-label">Justificante</span>

                    {invoiceFile || existingInvoiceName ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '165px' }}>
                          {invoiceFile ? invoiceFile.name : existingInvoiceName}
                        </span>
                        <button
                          type="button"
                          onClick={() => (invoiceFile ? setInvoiceFile(null) : setRemoveExistingInvoice(true))}
                          style={{ background: 'transparent', border: 0, color: '#D93829', display: 'flex', padding: 0, cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
                        <label className="nx-row-action" style={{ margin: 0, fontSize: '13px' }}>
                          <Camera size={15} style={{ color: '#9CA3AF' }} />
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

                        <label className="nx-row-action" style={{ margin: 0, fontSize: '13px' }}>
                          <Upload size={15} style={{ color: '#9CA3AF' }} />
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

                {/* CAJA 3: PAGO A PLAZOS */}
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
                          {[2, 3, 4, 6, 12, 24].map((n) => {
                            const active = Number(installments) === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setInstallments(n)}
                                style={{
                                  flex: 1,
                                  height: '34px',
                                  borderRadius: '999px',
                                  border: active ? '1px solid #111827' : '1px solid #EAECEF',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  backgroundColor: active ? '#111827' : 'transparent',
                                  color: active ? '#FFFFFF' : 'inherit',
                                }}
                              >
                                {n}x
                              </button>
                            );
                          })}
                        </div>
                        <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginTop: '8px', fontVariantNumeric: 'tabular-nums' }}>
                          {installments} cuotas de {formatEuro(numAmount / Number(installments))} / mes
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {formError && (
                  <p style={{ color: '#D93829', fontSize: '12px', fontWeight: 500, marginBottom: '12px' }}>
                    {formError}
                  </p>
                )}

                <button type="submit" className="nx-kp-cta" style={{ marginTop: '6px' }}>
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
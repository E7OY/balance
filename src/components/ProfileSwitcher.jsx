import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  FileText,
  Home,
  KeyRound,
  Layers,
  LogOut,
  Moon,
  Palette,
  Plus,
  Share2,
  Shield,
  Trash2,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getFromLocalStorage } from '../utils/localStorage';
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from '../utils/pushNotifications';
import { triggerHaptic } from '../utils/haptics';
import { getSavedHomeBackground, HOME_BACKGROUNDS } from '../utils/homeBackgrounds';

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

const CardNetworkMark = ({ net = 'mastercard', isLight = false, size = 'sm' }) => {
  const dot = size === 'lg' ? 18 : 13;
  const overlap = size === 'lg' ? -7 : -5;

  if (net === 'none') return <span />;
  if (net === 'visa') {
    return (
      <span
        style={{
          fontSize: size === 'lg' ? '15px' : '11.5px',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.04em',
          color: isLight ? '#1E3A8A' : '#FFFFFF',
        }}
      >
        VISA
      </span>
    );
  }
  if (net === 'amex') {
    return (
      <span
        style={{
          fontSize: size === 'lg' ? '10px' : '8.5px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          padding: '2px 5px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          color: isLight ? '#0F172A' : '#FFFFFF',
        }}
      >
        AMEX
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <i
        style={{
          width: `${dot}px`,
          height: `${dot}px`,
          borderRadius: '50%',
          background: net === 'mastercard-color' ? '#EB001B' : '#3A3B40',
          border: '1px solid rgba(255,255,255,0.35)',
          display: 'inline-block',
        }}
      />
      <i
        style={{
          width: `${dot}px`,
          height: `${dot}px`,
          borderRadius: '50%',
          background: net === 'mastercard-color' ? '#F79E1B' : '#B4B6BE',
          border: '1px solid rgba(255,255,255,0.35)',
          marginLeft: `${overlap}px`,
          opacity: 0.9,
          display: 'inline-block',
        }}
      />
    </span>
  );
};

const SETTINGS_REVOLUT_CSS = `
  .rev-settings-page {
    min-height: 100dvh;
    background-color: #FAFAFB;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 36px;
    color: #111827;
  }
  .dark .rev-settings-page {
    background-color: var(--canvas-dark);
    color: #FFFFFF;
  }
  .rev-settings-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .rev-close-circle {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .dark .rev-close-circle {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .rev-close-circle:active {
    transform: scale(0.93);
  }

  .rev-bento-duo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .rev-bento-box {
    background-color: #FFFFFF;
    color: #111827;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 15px 16px;
    min-height: 112px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.12s ease, background-color 0.14s ease;
  }
  .dark .rev-bento-box {
    background-color: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
    color: #FFFFFF;
    box-shadow: none;
  }
  .rev-bento-box:active {
    transform: scale(0.985);
    background-color: #F9FAFB;
  }
  .dark .rev-bento-box:active {
    background-color: rgba(255, 255, 255, 0.04);
  }
  .rev-bento-title {
    display: block;
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .rev-bento-sub {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: #9CA3AF;
    margin-top: 2px;
  }

  .rev-list-group {
    background-color: #FFFFFF;
    color: #111827;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 0;
    margin-bottom: 14px;
    box-shadow: none;
    overflow: hidden;
  }
  .dark .rev-list-group {
    background-color: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
    color: #FFFFFF;
    box-shadow: none;
  }
  .bottom-sheet .rev-list-group {
    background-color: #FFFFFF;
    border: 1px solid #EAECEF;
    box-shadow: none;
  }
  .dark .bottom-sheet .rev-list-group {
    background-color: #1B1E27;
    border-color: rgba(255, 255, 255, 0.09);
  }
  .rev-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    padding: 13px 16px;
    background: transparent;
    border: 0;
    color: inherit;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.14s ease;
  }
  .rev-list-row + .rev-list-row {
    border-top: 1px solid #F1F3F5;
  }
  .dark .rev-list-row + .rev-list-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
  button.rev-list-row:active {
    background-color: #F9FAFB;
  }
  .dark button.rev-list-row:active {
    background-color: rgba(255, 255, 255, 0.04);
  }
  .rev-list-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
  }
  .rev-list-icon {
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #111827;
    flex-shrink: 0;
  }
  .dark .rev-list-icon {
    color: #FFFFFF;
  }
  .rev-list-label {
    font-size: 14.5px;
    font-weight: 500;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rev-list-meta {
    font-size: 12.5px;
    font-weight: 500;
    color: #9CA3AF;
    flex-shrink: 0;
  }
  .rev-home-select {
    width: auto !important;
    margin: 0 !important;
    height: 32px !important;
    padding: 0 10px !important;
    border-radius: 999px !important;
    background-color: #FAFAFB !important;
    border: 1px solid #EAECEF !important;
    color: #111827 !important;
    font-size: 12.5px !important;
    font-weight: 500 !important;
    cursor: pointer;
  }
  .dark .rev-home-select {
    background-color: #242428 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #FFFFFF !important;
  }
  .rev-switch {
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
    transition: background 0.2s ease;
  }
  .dark .rev-switch {
    background: #2C2C32;
  }
  .rev-switch.on {
    background: var(--primary);
  }
  .rev-switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFFFFF;
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    transform: translateX(0);
  }
  .rev-switch.on .rev-switch-thumb {
    transform: translateX(20px);
  }

  @keyframes revProfileCardDrop {
    0% {
      opacity: 0;
      transform: translate3d(0, calc(var(--ty) - 145px), 0) rotate(0deg) scale(0.94);
    }
    25% {
      opacity: 1;
    }
    76% {
      opacity: 1;
      transform: translate3d(0, calc(var(--ty) + 5px), 0) rotate(var(--rot)) scale(1);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, var(--ty), 0) rotate(var(--rot)) scale(1);
    }
  }

  .rev-wallet-outer {
    width: 100%;
    padding: 7px;
    border-radius: 26px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  .dark .rev-wallet-outer {
    background: #16171C;
    border: 1px solid rgba(255, 255, 255, 0.09);
  }
  .rev-wallet-card {
    position: relative;
    width: 100%;
    height: 224px;
    border-radius: 20px;
    background: linear-gradient(180deg, #1E1F24 0%, #141519 100%);
    overflow: hidden;
    border: 0;
    padding: 0;
    cursor: pointer;
    display: block;
    text-align: center;
    font-family: inherit;
    box-shadow: none;
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dark .rev-wallet-card {
    background: linear-gradient(180deg, #1A1B20 0%, #101115 100%);
    box-shadow: none;
  }
  .rev-wallet-card:active {
    transform: scale(0.985);
  }
  .rev-wallet-card:hover .rev-wallet-mini-card {
    transform: translate3d(0, calc(var(--ty) - 6px), 0) rotate(var(--rot));
  }
  .rev-wallet-title {
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(255, 255, 255, 0.56);
    z-index: 1;
    pointer-events: none;
  }
  .rev-wallet-stack {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .rev-wallet-mini-card {
    position: absolute;
    left: 50%;
    width: 78%;
    height: 124px;
    margin-left: -39%;
    border-radius: 18px;
    border: 2px solid rgba(255, 255, 255, 0.92);
    padding: 12px 15px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    color: #FFFFFF;
    box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.28);
    transform: translate3d(0, var(--ty), 0) rotate(var(--rot));
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    animation: revProfileCardDrop 0.95s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms) backwards;
    will-change: transform, opacity;
  }
  .rev-wallet-pocket {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    height: 126px;
    border-radius: 16px;
    z-index: 4;
    background: linear-gradient(
      180deg,
      rgba(120, 125, 138, 0.46) 0%,
      rgba(56, 59, 68, 0.68) 55%,
      rgba(28, 30, 36, 0.88) 100%
    );
    backdrop-filter: blur(22px) saturate(185%);
    -webkit-backdrop-filter: blur(22px) saturate(185%);
    border-top: 1px solid rgba(255, 255, 255, 0.38);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.34),
      inset 0 -10px 22px rgba(0, 0, 0, 0.42),
      0 -8px 24px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
  }
  .rev-wallet-balance-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.72);
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .rev-wallet-balance-val {
    font-size: 31px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #FFFFFF;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .rev-wallet-balance-dec {
    color: rgba(255, 255, 255, 0.48);
    font-weight: 600;
  }

  /* =========================================================
     SISTEMA UNIFICADO DE CABECERAS DE MODAL (ESTILO WALLET PLANO)
     ========================================================= */
  @keyframes revHeroRise {
    0% {
      opacity: 0;
      transform: translate3d(var(--hx, 0px), calc(var(--hy, 0px) + 16px), 0) rotate(0deg) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translate3d(var(--hx, 0px), var(--hy, 0px), 0) rotate(var(--hrot, 0deg)) scale(1);
    }
  }

  .rev-sheet-hero {
    position: relative;
    width: 100%;
    height: 148px;
    border-radius: 18px;
    margin: 2px 0 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    pointer-events: none;
    box-sizing: border-box;
  }
  /* Misma mini-tarjeta que .rev-wallet-mini-card */
  .rev-hero-card {
    position: absolute;
    width: 176px;
    height: 108px;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.92);
    padding: 11px 13px;
    box-sizing: border-box;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    transform: translate3d(var(--hx, 0px), var(--hy, 0px), 0) rotate(var(--hrot, 0deg));
    animation: revHeroRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) var(--hdelay, 0ms) backwards;
  }
  .dark .rev-hero-card {
    border-color: rgba(255, 255, 255, 0.85);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.38);
  }

  .rev-hero-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .rev-hero-card-title {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rev-hero-card-sub {
    font-size: 10.5px;
    font-weight: 500;
    opacity: 0.78;
    letter-spacing: -0.01em;
  }

  /* Nodo circular minimalista (1px #EAECEF, igual a .rev-close-circle) */
  .rev-hero-node {
    position: relative;
    z-index: 5;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }
  .dark .rev-hero-node {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
  }
  .rev-hero-node-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #9CA3AF;
    border: 2px solid #FFFFFF;
  }
  .rev-hero-node-dot.active {
    background: #10B981;
  }
  .dark .rev-hero-node-dot {
    border-color: #1B1E27;
  }

  /* Láminas de extracto limpias para Exportar */
  .rev-hero-sheet-slip {
    position: absolute;
    width: 132px;
    height: 82px;
    border-radius: 14px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    padding: 10px 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #111827;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    transform: translate3d(var(--hx, 0px), var(--hy, 0px), 0) rotate(var(--hrot, 0deg));
    animation: revHeroRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) var(--hdelay, 0ms) backwards;
  }
  .dark .rev-hero-sheet-slip {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.11);
    color: #FFFFFF;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  }
  .rev-hero-slip-line {
    height: 4px;
    border-radius: 999px;
    background: #EAECEF;
    width: 68%;
  }
  .dark .rev-hero-slip-line {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SHARED_FAN_PRESETS = [
  {
    id: 'fan-1',
    name: 'Cuenta común',
    sub: 'Gastos compartidos',
    bg: 'linear-gradient(145deg, #6B7280 0%, #3F434C 55%, #23252A 100%)',
    net: 'mastercard',
    hx: '-46px',
    hy: '10px',
    hrot: '-9deg',
    z: 1,
    delay: '30ms',
  },
  {
    id: 'fan-2',
    name: 'Compartida',
    sub: 'Sincronizada',
    bg: 'linear-gradient(135deg, #DFBD69 0%, #A8823A 52%, #735723 100%)',
    net: 'visa',
    hx: '46px',
    hy: '10px',
    hrot: '9deg',
    z: 2,
    delay: '90ms',
  },
  {
    id: 'fan-3',
    name: 'Espacio activo',
    sub: 'Tiempo real',
    bg: 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    net: 'mastercard-color',
    hx: '0px',
    hy: '2px',
    hrot: '0deg',
    z: 3,
    delay: '150ms',
  },
];

const SharedCardsHero = ({ cards = [] }) => {
  const items = SHARED_FAN_PRESETS.map((preset, idx) => {
    const userCard = cards[idx];
    return {
      ...preset,
      name: idx === 2 && userCard?.name ? userCard.name : preset.name,
      bg: userCard?.bg || preset.bg,
      net: userCard?.net || preset.net,
    };
  });

  return (
    <div className="rev-sheet-hero" aria-hidden="true">
      {items.map((card) => {
        const isLight = card.bg.includes('#E2E8F0');
        return (
          <div
            key={card.id}
            className="rev-hero-card"
            style={{
              background: card.bg,
              zIndex: card.z,
              color: isLight ? '#0F172A' : '#FFFFFF',
              '--hx': card.hx,
              '--hy': card.hy,
              '--hrot': card.hrot,
              '--hdelay': card.delay,
            }}
          >
            <div className="rev-hero-card-top">
              <CardNetworkMark net={card.net} isLight={isLight} />
              <span className="rev-hero-card-title">{card.name}</span>
            </div>
            <span className="rev-hero-card-sub">{card.sub}</span>
          </div>
        );
      })}
    </div>
  );
};

const CloudSyncHero = ({ cards = [], isSynced = false }) => {
  const left = cards[0] || {
    name: 'Personal',
    bg: 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    net: 'mastercard-color',
  };
  const right = cards[1] || {
    name: 'Espacio Cloud',
    bg: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #1D4ED8 100%)',
    net: 'visa',
  };

  const leftLight = left.bg.includes('#E2E8F0');
  const rightLight = right.bg.includes('#E2E8F0');

  return (
    <div className="rev-sheet-hero" aria-hidden="true">
      <div
        className="rev-hero-card"
        style={{
          width: '154px',
          height: '96px',
          background: left.bg,
          color: leftLight ? '#0F172A' : '#FFFFFF',
          zIndex: 2,
          '--hx': '-62px',
          '--hy': '6px',
          '--hrot': '-7deg',
          '--hdelay': '40ms',
        }}
      >
        <div className="rev-hero-card-top">
          <CardNetworkMark net={left.net} isLight={leftLight} />
          <span className="rev-hero-card-title">{left.name}</span>
        </div>
        <span className="rev-hero-card-sub">Este dispositivo</span>
      </div>

      <div className="rev-hero-node">
        <Cloud size={19} strokeWidth={2} />
        <span className={`rev-hero-node-dot ${isSynced ? 'active' : ''}`} />
      </div>

      <div
        className="rev-hero-card"
        style={{
          width: '154px',
          height: '96px',
          background: right.bg,
          color: rightLight ? '#0F172A' : '#FFFFFF',
          zIndex: 2,
          '--hx': '62px',
          '--hy': '6px',
          '--hrot': '7deg',
          '--hdelay': '110ms',
        }}
      >
        <div className="rev-hero-card-top">
          <CardNetworkMark net={right.net} isLight={rightLight} />
          <span className="rev-hero-card-title">{right.name}</span>
        </div>
        <span className="rev-hero-card-sub">{isSynced ? 'Sincronizada' : 'En la nube'}</span>
      </div>
    </div>
  );
};

const AccountCardHero = ({ name = 'Mi perfil', primaryCard, backCard, accountsCount = 1 }) => {
  const cleanName = (name || 'Mi perfil').trim() || 'Mi perfil';
  const main = primaryCard || {
    bg: 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    net: 'mastercard-color',
    name: 'Personal',
  };
  const secondaryBg = backCard?.bg || 'linear-gradient(145deg, #6B7280 0%, #3F434C 55%, #23252A 100%)';
  const isLight = main.bg.includes('#E2E8F0');

  return (
    <div className="rev-sheet-hero" aria-hidden="true">
      <div
        className="rev-hero-card"
        style={{
          width: '188px',
          height: '104px',
          background: secondaryBg,
          opacity: 0.55,
          zIndex: 1,
          '--hx': '0px',
          '--hy': '-10px',
          '--hrot': '-5deg',
          '--hdelay': '20ms',
        }}
      />

      <div
        className="rev-hero-card"
        style={{
          width: '198px',
          height: '110px',
          background: main.bg,
          color: isLight ? '#0F172A' : '#FFFFFF',
          zIndex: 2,
          '--hx': '0px',
          '--hy': '6px',
          '--hrot': '0deg',
          '--hdelay': '90ms',
        }}
      >
        <div className="rev-hero-card-top">
          <CardNetworkMark net={main.net} isLight={isLight} />
          <span className="rev-hero-card-sub">
            {accountsCount} {accountsCount === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '10px', opacity: 0.68, marginBottom: '1px' }}>
            Titular
          </span>
          <strong
            style={{
              display: 'block',
              fontSize: '14.5px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cleanName}
          </strong>
        </div>
      </div>
    </div>
  );
};

const ExportStackHero = ({ primaryCard, txCount = 0 }) => {
  const main = primaryCard || {
    name: 'Personal',
    bg: 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    net: 'mastercard-color',
  };
  const isLight = main.bg.includes('#E2E8F0');

  return (
    <div className="rev-sheet-hero" aria-hidden="true">
      {/* Tarjeta origen a la izquierda */}
      <div
        className="rev-hero-card"
        style={{
          width: '156px',
          height: '98px',
          background: main.bg,
          color: isLight ? '#0F172A' : '#FFFFFF',
          zIndex: 2,
          '--hx': '-48px',
          '--hy': '2px',
          '--hrot': '-5deg',
          '--hdelay': '30ms',
        }}
      >
        <div className="rev-hero-card-top">
          <CardNetworkMark net={main.net} isLight={isLight} />
          <span className="rev-hero-card-title">{main.name}</span>
        </div>
        <span className="rev-hero-card-sub">
          {txCount} {txCount === 1 ? 'movimiento' : 'movimientos'}
        </span>
      </div>

      {/* Dos láminas limpias de extracto superpuestas a la derecha */}
      <div
        className="rev-hero-sheet-slip"
        style={{
          zIndex: 3,
          '--hx': '56px',
          '--hy': '-6px',
          '--hrot': '7deg',
          '--hdelay': '90ms',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>
          CSV · JSON
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span className="rev-hero-slip-line" style={{ width: '78%' }} />
          <span className="rev-hero-slip-line" style={{ width: '52%' }} />
        </div>
      </div>

      <div
        className="rev-hero-sheet-slip"
        style={{
          zIndex: 4,
          '--hx': '42px',
          '--hy': '10px',
          '--hrot': '2deg',
          '--hdelay': '150ms',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.03em' }}>
            EXTRACTO PDF
          </span>
          <Download size={13} strokeWidth={2.2} style={{ color: '#9CA3AF' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span className="rev-hero-slip-line" style={{ width: '86%' }} />
          <span className="rev-hero-slip-line" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
};

const ProfileSwitcher = ({
  theme,
  setTheme,
  colorfulHero,
  onColorfulHeroChange,
  defaultHomeTab,
  onDefaultHomeTabChange,
  investmentsEnabled,
  onInvestmentsVisibilityChange,
  profileName,
  onProfileNameChange,
  pinEnabled,
  avatar = '',
  onAvatarChange,
  onSetupPin,
  onChangePin,
  onRemovePin,
  getTransactionsForProfile,
  onClose,
}) => {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    transactions,
    investmentRecords = [],
    accountsVersion = 0,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
    createSyncAccount,
    loginToSyncAccount,
    logoutFromSyncAccount,
    exportData,
    exportCsv,
    exportPdf,
    importData,
    switchProfile,
    addProfile,
    joinProfile,
    deleteActiveProfile,
  } = useFinance();

  const [notifications, setNotifications] = useState(() => getPushNotificationsEnabled(activeProfile.id));
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const customName = profileName || activeProfile?.name || 'Mi perfil';
  const [draftProfileName, setDraftProfileName] = useState(customName);

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [bgConfig, setBgConfig] = useState(() => getSavedHomeBackground());

  const [isSpacesSheetOpen, setIsSpacesSheetOpen] = useState(false);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [isJoinPanelOpen, setIsJoinPanelOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');

  const [isNewSpaceOpen, setIsNewSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceError, setNewSpaceError] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const importInputRef = useRef(null);

  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isCreatingSyncAccount, setIsCreatingSyncAccount] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncFormError, setSyncFormError] = useState('');

  const isSharedSpace = activeProfileId.includes('___');
  const shareCode = isSharedSpace
    ? activeProfileId
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

  const WALLET_CARD_BGS = {
    'revolut-standard': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 52%, #EC4899 100%)',
    'metal-black': 'linear-gradient(145deg, #3A3C44 0%, #1B1C20 55%, #09090B 100%)',
    'metal-space-grey': 'linear-gradient(145deg, #6B7280 0%, #3F434C 55%, #23252A 100%)',
    'metal-gold': 'linear-gradient(135deg, #DFBD69 0%, #A8823A 52%, #735723 100%)',
    'metal-rose-gold': 'linear-gradient(135deg, #F4A29E 0%, #C97A74 52%, #884A45 100%)',
    'metal-lavender': 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 52%, #4C1D95 100%)',
    'ultra-platinum': 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 52%, #475569 100%)',
    chromatic: 'linear-gradient(125deg, #60A5FA 0%, #A78BFA 32%, #F472B6 65%, #FBBF24 100%)',
    disposable: 'linear-gradient(135deg, #FB7185 0%, #E11D48 55%, #9F1239 100%)',
    cobalt: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #1D4ED8 100%)',
    emerald: 'linear-gradient(135deg, #34D399 0%, #059669 55%, #064E3B 100%)',
    'midnight-aurora': 'linear-gradient(135deg, #38BDF8 0%, #2563EB 52%, #1E1B4B 100%)',
    'sunset-amber': 'linear-gradient(135deg, #FDBA74 0%, #F97316 52%, #9A3412 100%)',
    bronze: 'linear-gradient(135deg, #D6A89A 0%, #936D62 55%, #4A352F 100%)',
  };

  const [txVersion, setTxVersion] = React.useState(0);

  React.useEffect(() => {
    const onTxUpdated = () => setTxVersion((v) => v + 1);
    window.addEventListener('finance:transactions-updated', onTxUpdated);
    return () => window.removeEventListener('finance:transactions-updated', onTxUpdated);
  }, []);

  const totalWealth = React.useMemo(() => {
    const accountList = profiles.length > 0
      ? profiles
      : activeProfile
        ? [activeProfile]
        : [];

    return accountList.reduce((totalSum, profile) => {
      const storedTxs = getFromLocalStorage(`finance:${profile.id}:transactions`);
      const pTxs = Array.isArray(storedTxs)
        ? storedTxs
        : (getTransactionsForProfile ? getTransactionsForProfile(profile.id) : []);

      const accountAvailable = (Array.isArray(pTxs) ? pTxs : []).reduce((acc, tx) => {
        const amt = Number(tx?.amount) || 0;
        if (!Number.isFinite(amt)) return acc;
        if (tx?.type === 'Ingreso') return acc + amt;
        if (tx?.type === 'Gasto') return acc - amt;
        return acc;
      }, 0);

      return totalSum + accountAvailable;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, activeProfile, getTransactionsForProfile, accountsVersion, txVersion]);

  const walletCards = (() => {
    let savedThemes = {};
    let savedNets = {};
    try {
      savedThemes = JSON.parse(localStorage.getItem('balance-account-themes') || '{}') || {};
      savedNets = JSON.parse(localStorage.getItem('balance-account-networks') || '{}') || {};
    } catch {}

    const orderedProfiles = [
      ...profiles.filter((p) => p.id !== activeProfileId),
      ...profiles.filter((p) => p.id === activeProfileId),
    ].slice(-4);

    const themeKeys = Object.keys(WALLET_CARD_BGS);

    const posesByCount = {
      1: [{ ty: '60px', rot: '0deg' }],
      2: [
        { ty: '42px', rot: '-6deg' },
        { ty: '66px', rot: '0deg' },
      ],
      3: [
        { ty: '32px', rot: '10deg' },
        { ty: '48px', rot: '-5deg' },
        { ty: '68px', rot: '0deg' },
      ],
      4: [
        { ty: '26px', rot: '-9deg' },
        { ty: '38px', rot: '9deg' },
        { ty: '52px', rot: '-4deg' },
        { ty: '68px', rot: '0deg' },
      ],
    };

    const poses = posesByCount[orderedProfiles.length] || posesByCount[1];

    return orderedProfiles.map((p, idx) => {
      const origIdx = Math.max(0, profiles.findIndex((item) => item.id === p.id));
      const themeKey = savedThemes[p.id] || themeKeys[origIdx % themeKeys.length];
      return {
        id: p.id,
        name: p.name,
        bg: WALLET_CARD_BGS[themeKey] || WALLET_CARD_BGS['revolut-standard'],
        net: savedNets[p.id] || 'mastercard',
        ...poses[idx],
      };
    });
  })();

  const activeWalletCard = walletCards[walletCards.length - 1];
  const secondaryWalletCard = walletCards.length > 1 ? walletCards[walletCards.length - 2] : null;

  const formattedWealth = formatEuro(totalWealth);
  const wealthCommaIdx = formattedWealth.indexOf(',');
  const wealthInt = isAmountsHidden
    ? '€••••'
    : (wealthCommaIdx === -1 ? formattedWealth : formattedWealth.slice(0, wealthCommaIdx));
  const wealthDec = isAmountsHidden || wealthCommaIdx === -1
    ? ''
    : formattedWealth.slice(wealthCommaIdx);

  const displayMoney = (val) => (isAmountsHidden ? '€••••' : formatEuro(val));

  const currentBgName = bgConfig.customImage
    ? 'Foto propia'
    : (HOME_BACKGROUNDS.find((b) => b.id === bgConfig.id)?.shortName || 'Índigo');

  const handleClosePage = () => {
    triggerHaptic();
    if (onClose) {
      onClose();
    } else {
      onDefaultHomeTabChange?.(defaultHomeTab || 'expenses');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBackupMessage('');
    try {
      await importData(file);
      triggerHaptic();
      setBackupMessage('Copia restaurada correctamente.');
    } catch (err) {
      setBackupMessage(err.message);
    }
  };

  return (
    <section className="rev-settings-page" aria-label="Perfil y ajustes">
      <style>{SETTINGS_REVOLUT_CSS}</style>

      <div className="rev-settings-topbar">
        <button
          type="button"
          className="rev-close-circle"
          onClick={handleClosePage}
          aria-label="Cerrar ajustes"
        >
          <X size={19} strokeWidth={2.2} />
        </button>
      </div>

      <div className="rev-wallet-outer">
        <button
          type="button"
          className="rev-wallet-card"
          onClick={() => {
            triggerHaptic();
            setIsSpacesSheetOpen(true);
          }}
          aria-label="Ver cuentas y patrimonio total"
        >
          <span className="rev-wallet-title">Wallet</span>

          <div className="rev-wallet-stack" aria-hidden="true">
            {walletCards.map((card, idx) => {
              const isLightCard = card.bg.includes('#E2E8F0');
              return (
                <div
                  key={card.id}
                  className="rev-wallet-mini-card"
                  style={{
                    background: card.bg,
                    '--ty': card.ty,
                    '--rot': card.rot,
                    '--delay': `${60 + idx * 140}ms`,
                  }}
                >
                  <CardNetworkMark net={card.net} isLight={isLightCard} size="lg" />

                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: isLightCard ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    {card.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rev-wallet-pocket">
            <span className="rev-wallet-balance-label">Patrimonio total</span>
            <strong className="rev-wallet-balance-val privacy-sensitive">
              {wealthInt}
              {wealthDec && <span className="rev-wallet-balance-dec">{wealthDec}</span>}
            </strong>
          </div>
        </button>
      </div>

      <div className="rev-bento-duo">
        <button
          type="button"
          className="rev-bento-box"
          onClick={() => setIsSpacesSheetOpen(true)}
        >
          <Layers size={21} strokeWidth={2} />
          <div>
            <strong className="rev-bento-title privacy-sensitive">
              {displayMoney(totalWealth)}
            </strong>
            <span className="rev-bento-sub">
              {activeProfile?.name} · {profiles.length} {profiles.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="rev-bento-box"
          onClick={() => {
            setCopiedCode(false);
            setIsSharePanelOpen(true);
          }}
        >
          <UserPlus size={21} strokeWidth={2} />
          <div>
            <strong className="rev-bento-title">Invitar</strong>
            <span className="rev-bento-sub">Comparte gastos en grupo</span>
          </div>
        </button>
      </div>

      <div className="rev-list-group">
        <button
          type="button"
          className="rev-list-row"
          onClick={() => {
            setDraftProfileName(customName);
            setProfileEditOpen(true);
          }}
        >
          <div className="rev-list-left">
            <span className="rev-list-icon"><User size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Cuenta</span>
          </div>
          <span className="rev-list-meta">{customName}</span>
        </button>

        <button type="button" className="rev-list-row" onClick={() => setIsSpacesSheetOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Users size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Espacios compartidos</span>
          </div>
          <span className="rev-list-meta">{activeProfile?.name}</span>
        </button>

        <button type="button" className="rev-list-row" onClick={() => setIsSyncPanelOpen(true)}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Cloud size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Sincronización en la nube</span>
          </div>
          <span className="rev-list-meta">{syncUser ? 'Activa' : 'Local'}</span>
        </button>

        <button
          type="button"
          className="rev-list-row"
          onClick={() => {
            setBackupMessage('');
            setIsExportOpen(true);
          }}
        >
          <div className="rev-list-left">
            <span className="rev-list-icon"><Download size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Exportar y respaldo</span>
          </div>
          <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
        </button>
      </div>

      <div className="rev-list-group">

        {pinEnabled && (
          <button type="button" className="rev-list-row" onClick={onChangePin}>
            <div className="rev-list-left">
              <span className="rev-list-icon"><KeyRound size={19} strokeWidth={2} /></span>
              <span className="rev-list-label">Cambiar código PIN</span>
            </div>
            <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
          </button>
        )}

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><EyeOff size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Ocultar importes</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAmountsHidden}
            className={`rev-switch ${isAmountsHidden ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              setIsAmountsHidden(!isAmountsHidden);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>
      </div>

      <div className="rev-list-group">
        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Bell size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Notificaciones</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            className={`rev-switch ${notifications ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              const next = !notifications;
              setNotifications(next);
              setPushNotificationsEnabled(activeProfile.id, next);
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>

        <div className="rev-list-row" style={{ cursor: 'default' }}>
          <div className="rev-list-left">
            <span className="rev-list-icon"><Moon size={19} strokeWidth={2} /></span>
            <span className="rev-list-label">Modo oscuro</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            className={`rev-switch ${theme === 'dark' ? 'on' : ''}`}
            onClick={() => {
              triggerHaptic();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
          >
            <span className="rev-switch-thumb" />
          </button>
        </div>
      </div>

      {syncUser && (
        <div className="rev-list-group">
          <button
            type="button"
            className="rev-list-row"
            onClick={logoutFromSyncAccount}
            style={{ color: 'var(--danger-red)' }}
          >
            <div className="rev-list-left">
              <span className="rev-list-icon" style={{ color: 'var(--danger-red)' }}>
                <LogOut size={19} strokeWidth={2} />
              </span>
              <span className="rev-list-label">Cerrar sesión</span>
            </div>
          </button>
        </div>
      )}

      {isSpacesSheetOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSpacesSheetOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Cuentas y espacios</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSpacesSheetOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="rev-list-group">
              {profiles.map((p) => {
                const active = p.id === activeProfileId;
                const shared = p.id.includes('___');
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="rev-list-row"
                    onClick={() => {
                      triggerHaptic();
                      switchProfile(p.id);
                      setIsSpacesSheetOpen(false);
                    }}
                  >
                    <div className="rev-list-left">
                      <span className="rev-list-icon" style={{ color: active ? 'var(--primary)' : undefined }}>
                        {shared ? <Users size={18} /> : <User size={18} />}
                      </span>
                      <div>
                        <span className="rev-list-label" style={{ display: 'block' }}>{p.name}</span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {shared ? 'Espacio compartido' : 'Espacio personal'}
                        </span>
                      </div>
                    </div>
                    {active && <Check size={18} style={{ color: 'var(--primary)' }} />}
                  </button>
                );
              })}
            </div>

            <div className="rev-list-group">
              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setNewSpaceError('');
                  setIsNewSpaceOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><Plus size={19} /></span>
                  <span className="rev-list-label">Crear nueva cuenta</span>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setJoinError('');
                  setIsJoinPanelOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><UserPlus size={19} /></span>
                  <span className="rev-list-label">Vincular cuenta compartida</span>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button
                type="button"
                className="rev-list-row"
                onClick={() => {
                  setIsSpacesSheetOpen(false);
                  setCopiedCode(false);
                  setIsSharePanelOpen(true);
                }}
              >
                <div className="rev-list-left">
                  <span className="rev-list-icon" style={{ color: 'var(--primary)' }}><Share2 size={19} /></span>
                  <span className="rev-list-label">Invitar a {activeProfile?.name}</span>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              {profiles.length > 1 && (
                <button
                  type="button"
                  className="rev-list-row"
                  onClick={() => {
                    deleteActiveProfile()
                      .then(() => setIsSpacesSheetOpen(false))
                      .catch((err) => setBackupMessage(err.message));
                  }}
                  style={{ color: 'var(--danger-red)' }}
                >
                  <div className="rev-list-left">
                    <span className="rev-list-icon" style={{ color: 'var(--danger-red)' }}><Trash2 size={19} /></span>
                    <span className="rev-list-label">
                      {isSharedSpace ? 'Desvincular este espacio' : 'Eliminar esta cuenta'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </section>
        </div>,
        document.body,
      )}

      {isExportOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsExportOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Exportar y respaldo</h2>
              <button type="button" className="sheet-close" onClick={() => setIsExportOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <ExportStackHero
              primaryCard={activeWalletCard}
              txCount={Array.isArray(transactions) ? transactions.length : 0}
            />

            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 14px' }}>
              Descarga tus movimientos o restaura una copia de seguridad.
            </p>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />

            <div className="rev-list-group" style={{ marginBottom: '16px' }}>
              <button type="button" className="rev-list-row" onClick={exportCsv}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileSpreadsheet size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Exportar CSV</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Excel o Google Sheets</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportPdf}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileText size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Informe PDF</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Extracto listo para compartir</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={exportData}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><FileJson size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Copia completa JSON</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Movimientos, categorías, topes y facturas</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>

              <button type="button" className="rev-list-row" onClick={() => importInputRef.current?.click()}>
                <div className="rev-list-left">
                  <span className="rev-list-icon"><Upload size={19} /></span>
                  <div>
                    <span className="rev-list-label" style={{ display: 'block' }}>Restaurar copia JSON</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Importar respaldo previo</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            {backupMessage && (
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--primary)', marginBottom: '12px' }}>
                {backupMessage}
              </p>
            )}

            <button type="button" className="nx-btn-dark" style={{ width: '100%' }} onClick={() => setIsExportOpen(false)}>
              Listo
            </button>
          </section>
        </div>,
        document.body,
      )}

      {profileEditOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setProfileEditOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Datos personales</h2>
              <button type="button" className="sheet-close" onClick={() => setProfileEditOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <AccountCardHero
              name={draftProfileName}
              primaryCard={activeWalletCard}
              backCard={secondaryWalletCard}
              accountsCount={profiles.length}
            />

            <form onSubmit={(e) => {
              e.preventDefault();
              const val = draftProfileName.trim();
              if (val) {
                onProfileNameChange(val);
                triggerHaptic('success');
                setProfileEditOpen(false);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre visible
                <input
                  name="name"
                  value={draftProfileName}
                  onChange={(e) => setDraftProfileName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <button className="nx-btn-dark" style={{ width: '100%' }} type="submit">
                Guardar cambios <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {isSharePanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSharePanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Invitar a este espacio</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSharePanelOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <SharedCardsHero cards={walletCards} />

            {shareCode ? (
              <>
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 14px' }}>
                  Envía este código para que otra persona vincule <strong>{activeProfile?.name}</strong> en su móvil.
                </p>
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#FAFAFB',
                  border: '1px solid #EAECEF',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  {shareCode}
                </div>
                <button
                  type="button"
                  className="nx-btn-dark"
                  style={{ width: '100%' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(shareCode);
                    triggerHaptic();
                    setCopiedCode(true);
                  }}
                >
                  {copiedCode ? <><Check size={16} /> Código copiado</> : <><Copy size={16} /> Copiar código</>}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--danger-red)', fontWeight: 500, marginBottom: '16px' }}>
                  Activa la sincronización en la nube para generar un código de invitación.
                </p>
                <button
                  type="button"
                  className="nx-btn-dark"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsSharePanelOpen(false);
                    setIsSyncPanelOpen(true);
                  }}
                >
                  Conectar nube ahora <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>,
        document.body,
      )}

      {isJoinPanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsJoinPanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Vincular cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsJoinPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <SharedCardsHero cards={walletCards} />

            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 14px' }}>
              Pega el código de invitación y elige un nombre para este espacio.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              setJoinError('');
              try {
                joinProfile(joinCode, joinName);
                triggerHaptic();
                setJoinCode('');
                setJoinName('');
                setIsJoinPanelOpen(false);
              } catch (err) {
                setJoinError(err.message);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '12px' }}>
                Código de invitación
                <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
              </label>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre del espacio
                <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Piso" />
              </label>
              {joinError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{joinError}</p>}
              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Unirme al espacio <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {isNewSpaceOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsNewSpaceOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Crear nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsNewSpaceOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setNewSpaceError('');
              try {
                addProfile(newSpaceName);
                triggerHaptic();
                setNewSpaceName('');
                setIsNewSpaceOpen(false);
              } catch (err) {
                setNewSpaceError(err.message);
              }
            }}>
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                Nombre de la cuenta
                <input
                  required
                  autoFocus
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ej. Vacaciones, Ahorro, Trabajo..."
                />
              </label>
              {newSpaceError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{newSpaceError}</p>}
              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Crear cuenta <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {isSyncPanelOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSyncPanelOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Sincronización en la nube</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSyncPanelOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <CloudSyncHero cards={walletCards} isSynced={Boolean(syncUser)} />

            {syncUser ? (
              <>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '18px' }}>
                  Conectado como <strong>{syncUser.email}</strong>. Tus cuentas y movimientos se sincronizan en tiempo real.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logoutFromSyncAccount();
                    setIsSyncPanelOpen(false);
                  }}
                  className="nx-btn-soft"
                  style={{ width: '100%', color: 'var(--danger-red)' }}
                >
                  Cerrar sesión en la nube
                </button>
              </>
            ) : (
              <>
                <div className="record-tabs" style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    className={!isCreatingSyncAccount ? 'active' : ''}
                    onClick={() => { setIsCreatingSyncAccount(false); setSyncFormError(''); }}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className={isCreatingSyncAccount ? 'active' : ''}
                    onClick={() => { setIsCreatingSyncAccount(true); setSyncFormError(''); }}
                  >
                    Crear cuenta
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSyncFormError('');
                  try {
                    if (isCreatingSyncAccount) await createSyncAccount(syncEmail.trim(), syncPassword);
                    else await loginToSyncAccount(syncEmail.trim(), syncPassword);
                    triggerHaptic();
                    setSyncPassword('');
                    setIsSyncPanelOpen(false);
                  } catch (err) {
                    setSyncFormError(err.message || 'No se pudo autenticar.');
                  }
                }}>
                  <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '12px' }}>
                    Correo electrónico
                    <input type="email" value={syncEmail} onChange={(e) => setSyncEmail(e.target.value)} required />
                  </label>
                  <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: '16px' }}>
                    Contraseña
                    <input type="password" value={syncPassword} onChange={(e) => setSyncPassword(e.target.value)} minLength={6} required />
                  </label>
                  {syncFormError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: '10px' }}>{syncFormError}</p>}
                  <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                    {isCreatingSyncAccount ? 'Registrarme' : 'Entrar'} <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>,
        document.body,
      )}

    </section>
  );
};

export default ProfileSwitcher;
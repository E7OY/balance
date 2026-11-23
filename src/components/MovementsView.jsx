import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Settings,
  Share2,
  Snowflake,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const CARD_THEMES = [
  { id: 'standard', label: 'Negro Estándar', bg: 'linear-gradient(145deg, #2D2E32 0%, #1C1D20 100%)' },
  { id: 'cobalt', label: 'Azul Cobalto', bg: 'linear-gradient(145deg, #494fdf 0%, #2D32B8 100%)' },
  { id: 'teal', label: 'Verde Azulado', bg: 'linear-gradient(145deg, #00a87e 0%, #007558 100%)' },
  { id: 'pink', label: 'Rosa Intenso', bg: 'linear-gradient(145deg, #e61e49 0%, #A81032 100%)' },
  { id: 'brown', label: 'Bronce', bg: 'linear-gradient(145deg, #936d62 0%, #63473F 100%)' },
];

const getMaskedDigits = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 9000;
  }
  return String(1000 + hash);
};

const readMapStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
};

const writeMapStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const NX_ACCOUNTS_CSS = `
  .nx-accounts-dark-screen {
    min-height: 100dvh;
    margin-bottom: calc(-88px - env(safe-area-inset-bottom, 0px));
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) calc(150px + env(safe-area-inset-bottom, 0px));
    background-color: var(--canvas-dark);
    color: var(--on-dark);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .nx-accounts-dark-screen.colorful {
    background:
      radial-gradient(95% 50% at 50% 8%, #4721E0 0%, #2B1378 50%, transparent 88%),
      linear-gradient(180deg, #2B1378 0%, #434157 56%, #6C6B73 100%);
  }
  .nx-elevated-group {
    background-color: var(--surface-elevated);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xs) var(--sp-xl);
    margin-bottom: var(--sp-lg);
  }
  .nx-accounts-dark-screen.colorful .nx-elevated-group {
    background: rgba(255, 255, 255, 0.13);
    backdrop-filter: blur(22px) saturate(160%);
    -webkit-backdrop-filter: blur(22px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.16);
  }
  .nx-account-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--sp-md) 0;
    background: transparent;
    border: 0;
    color: var(--on-dark);
    text-align: left;
    cursor: pointer;
    gap: var(--sp-md);
  }
  .nx-mini-thumb {
    width: 44px;
    height: 28px;
    border-radius: 6px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.16);
    position: relative;
    overflow: hidden;
  }
  .nx-add-account-float {
    position: fixed;
    left: 50%;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 35;
  }

  /* DETALLE DE TARJETA: ESCENARIO GRIS OSCURO ARRIBA + HOJA CLARA REDONDEADA CON TARJETAS BLANCAS */
  .nx-card-hero-band {
    background-color: #46474A;
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-xl) 38px;
    color: var(--on-dark);
  }
  .nx-card-hero-band.colorful {
    background: linear-gradient(180deg, #2B1378 0%, #46474A 100%);
  }
  .dark .nx-card-hero-band {
    background-color: #16171A;
  }
  .dark .nx-card-hero-band.colorful {
    background: linear-gradient(180deg, #231063 0%, #16171A 100%);
  }
  .nx-physical-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1.586 / 1;
    border-radius: 18px;
    padding: var(--sp-xl);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
  }
  .nx-frost-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.42) 0%, transparent 45%),
      radial-gradient(circle at 80% 30%, rgba(210, 235, 255, 0.36) 0%, transparent 50%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(190, 225, 255, 0.16) 100%);
    backdrop-filter: blur(6px) saturate(130%);
    -webkit-backdrop-filter: blur(6px) saturate(130%);
    border-radius: 18px;
    pointer-events: none;
    z-index: 2;
  }

  /* HOJA INFERIOR REDONDEADA: FONDO GRIS SUAVE (#F3F4F6) Y TARJETAS/BOTONES EN BLANCO PURO (#FFFFFF) */
  .nx-card-detail-sheet {
    position: relative;
    z-index: 3;
    margin-top: -20px;
    border-radius: 26px 26px 0 0;
    background-color: var(--surface-soft);
    padding: 10px var(--sp-lg) var(--sp-xxl);
    min-height: calc(100dvh - 300px);
  }
  .dark .nx-card-detail-sheet {
    background-color: var(--canvas-dark);
  }
  .nx-detail-circle-btn {
    width: 48px;
    height: 48px;
    border-radius: var(--rounded-full);
    background-color: var(--canvas-light);
    color: var(--ink);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .dark .nx-detail-circle-btn {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
  .nx-detail-circle-btn.frozen {
    background-color: var(--primary);
    color: #FFFFFF;
  }
  .nx-detail-white-card {
    background-color: var(--canvas-light);
    color: var(--ink);
    border-radius: var(--rounded-lg);
    padding: var(--sp-xl);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .dark .nx-detail-white-card {
    background-color: var(--surface-elevated);
    color: var(--on-dark);
    box-shadow: none;
  }
`;

const MovementsView = ({ colorfulHero = true, onClose, onOpenLimits }) => {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    switchProfile,
    addProfile,
    joinProfile,
    renameProfile,
    deleteActiveProfile,
    getTransactionsForProfile,
    transactions,
    filters,
    monthlyCategoryCaps,
    isAmountsHidden,
    setIsAmountsHidden,
    syncUser,
  } = useFinance();

  const [viewMode, setViewMode] = useState('list');
  const [frozenMap, setFrozenMap] = useState(() => readMapStorage('balance-frozen-accounts'));
  const [themeMap, setThemeMap] = useState(() => readMapStorage('balance-account-themes'));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState('create');
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedCardTheme, setSelectedCardTheme] = useState('standard');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [modalError, setModalError] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [showAllCardTx, setShowAllCardTx] = useState(false);

  const displayMoney = (val) => (isAmountsHidden
    ? '•••• €'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val));

  const accountsData = useMemo(() => profiles.map((p, idx) => {
    const pTxs = getTransactionsForProfile(p.id);
    const balance = pTxs.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      return tx.type === 'Ingreso' ? acc + amt : tx.type === 'Gasto' ? acc - amt : acc;
    }, 0);
    const themeId = themeMap[p.id] || CARD_THEMES[idx % CARD_THEMES.length].id;
    const themeObj = CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];
    return {
      ...p,
      balance,
      digits: getMaskedDigits(p.id),
      isFrozen: Boolean(frozenMap[p.id]),
      isShared: p.id.includes('___'),
      theme: themeObj,
    };
  }), [profiles, getTransactionsForProfile, themeMap, frozenMap]);

  const activeAccount = accountsData.find((a) => a.id === activeProfileId) || accountsData[0];

  const toggleFreeze = (profileId) => {
    triggerHaptic();
    const next = { ...frozenMap, [profileId]: !frozenMap[profileId] };
    setFrozenMap(next);
    writeMapStorage('balance-frozen-accounts', next);
  };

  const changeAccountTheme = (profileId, themeId) => {
    const next = { ...themeMap, [profileId]: themeId };
    setThemeMap(next);
    writeMapStorage('balance-account-themes', next);
  };

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const monthlyTxs = useMemo(
    () => transactions.filter((tx) => typeof tx.date === 'string' && tx.date.startsWith(monthPrefix)),
    [transactions, monthPrefix],
  );
  const monthTotals = useMemo(() => monthlyTxs.reduce((acc, tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'Ingreso') acc.income += amt;
    if (tx.type === 'Gasto') acc.expenses += amt;
    return acc;
  }, { income: 0, expenses: 0 }), [monthlyTxs]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthlyTxs.filter((tx) => tx.type === 'Gasto').forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTxs]);

  const recentAccountTxs = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
    return showAllCardTx ? sorted : sorted.slice(0, 4);
  }, [transactions, showAllCardTx]);

  const shareCode = activeProfileId.includes('___')
    ? activeProfileId
    : (syncUser ? `${syncUser.uid}___${activeProfileId}` : null);

  return (
    <>
      <style>{NX_ACCOUNTS_CSS}</style>

      {/* PANTALLA 1: LISTA DE CUENTAS */}
      {viewMode === 'list' && (
        <div className={`nx-accounts-dark-screen ${colorfulHero ? 'colorful' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-lg)' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Volver al inicio"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--rounded-full)',
                border: 0,
                backgroundColor: colorfulHero ? 'rgba(255, 255, 255, 0.16)' : 'var(--surface-elevated)',
                color: 'var(--on-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <h1 className="nx-display" style={{ fontSize: '32px', margin: '0 0 var(--sp-xl)' }}>
            Cuentas
          </h1>

          {/* TARJETA CON TODAS LAS CUENTAS */}
          <div className="nx-elevated-group">
            {accountsData.map((acc, index) => {
              const isSelected = acc.id === activeProfileId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  className="nx-account-row"
                  style={{ borderBottom: index === accountsData.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    triggerHaptic();
                    switchProfile(acc.id);
                    setShowAllCardTx(false);
                    setViewMode('detail');
                  }}
                >
                  <span className="nx-mini-thumb" style={{ background: acc.theme.bg }}>
                    <span style={{ fontSize: '6px', fontWeight: 500, letterSpacing: '0.24px' }}>NEXO</span>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-deep-pink)' }} />
                      <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-orange)', marginLeft: '-2px' }} />
                    </span>
                    {acc.isFrozen && (
                      <span style={{ position: 'absolute', inset: 0, background: 'rgba(210, 235, 255, 0.45)', backdropFilter: 'blur(2px)' }} />
                    )}
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 500 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
                      {acc.isFrozen && <span className="nx-badge-feature">Congelada</span>}
                    </span>
                    <span className="nx-label privacy-sensitive" style={{ display: 'block', color: 'rgba(255,255,255,0.75)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                      ••• {acc.digits} · {displayMoney(acc.balance)}
                    </span>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isSelected && (
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--rounded-full)',
                        backgroundColor: 'var(--canvas-light)',
                        color: 'var(--canvas-dark)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    )}
                    <ChevronRight size={17} style={{ opacity: 0.7 }} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* TARJETA DE ANÁLISIS MENSUAL */}
          <div className="nx-elevated-group">
            <button
              type="button"
              className="nx-account-row"
              onClick={() => setIsAnalyticsOpen(true)}
            >
              <span style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--rounded-full)',
                backgroundColor: colorfulHero ? 'rgba(255,255,255,0.18)' : 'var(--primary)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BarChart3 size={17} />
              </span>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
                Análisis mensual de {activeAccount?.name}
              </span>
              <ChevronRight size={17} style={{ opacity: 0.7 }} />
            </button>
          </div>

          {/* TARJETA DE PRIVACIDAD */}
          <div
            className="nx-elevated-group"
            onClick={() => {
              triggerHaptic();
              setIsAmountsHidden?.((prev) => !prev);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerHaptic();
                setIsAmountsHidden?.((prev) => !prev);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="nx-account-row">
              <span
                className="nx-mini-thumb"
                style={{
                  backgroundColor: '#141416',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
                aria-hidden="true"
              >
                <span style={{ fontSize: '6px', fontWeight: 600, letterSpacing: '0.24px', color: '#FFFFFF' }}>NEXO</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-deep-pink)' }} />
                  <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-orange)', marginLeft: '-2px' }} />
                </span>
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 500 }}>
                  {isAmountsHidden ? 'Saldos ocultos' : 'Privacidad'}
                </span>
                <span className="nx-label" style={{ display: 'block', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                  {isAmountsHidden ? 'Toca para mostrar tus importes' : 'Ocultar importes en todas las cuentas'}
                </span>
              </span>

              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--rounded-full)',
                  backgroundColor: isAmountsHidden ? 'var(--canvas-light)' : 'rgba(255, 255, 255, 0.18)',
                  color: isAmountsHidden ? 'var(--canvas-dark)' : '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                aria-label={isAmountsHidden ? 'Mostrar importes' : 'Ocultar importes'}
              >
                {isAmountsHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="nx-btn-primary nx-add-account-float"
            onClick={() => {
              setModalError('');
              setNewAccountName('');
              setJoinCode('');
              setJoinName('');
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={17} strokeWidth={2.2} /> Añadir cuenta
          </button>
        </div>
      )}

      {/* PANTALLA 2: DETALLE DE TARJETA CON HOJA INFERIOR REDONDEADA Y TARJETAS BLANCAS */}
      {viewMode === 'detail' && activeAccount && (
        <div>
          <div className={`nx-card-hero-band ${colorfulHero ? 'colorful' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-lg)' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Volver a cuentas"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--rounded-full)',
                  border: 0,
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={20} strokeWidth={2.2} />
              </button>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '82%' }}>
                {accountsData.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      switchProfile(acc.id);
                    }}
                    style={{
                      height: '34px',
                      padding: '6px 14px',
                      borderRadius: 'var(--rounded-full)',
                      border: 0,
                      fontSize: '12.5px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      backgroundColor: acc.id === activeProfileId
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.14)',
                      color: acc.id === activeProfileId ? '#0B0B0D' : '#FFFFFF',
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="nx-physical-card" style={{ background: activeAccount.theme.bg }}>
              {activeAccount.isFrozen && <div className="nx-frost-overlay" />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                  {activeAccount.isShared ? 'Compartida' : 'Estándar'}
                </span>
                <span className="nx-display privacy-sensitive" style={{ fontSize: '20px' }}>
                  {displayMoney(activeAccount.balance)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 3 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '15px', fontWeight: 500 }}>
                    {activeAccount.name}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                    •• {activeAccount.digits}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }} aria-hidden="true">
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.38)' }} />
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: '-10px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* HOJA REDONDEADA SUPERIOR (#F3F4F6) CON BOTONES Y TARJETAS EN BLANCO (#FFFFFF) */}
          <div className="nx-card-detail-sheet">
            <div className="sheet-handle" style={{ margin: '0 auto 16px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsAmountsHidden?.((prev) => !prev);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <span className="nx-detail-circle-btn">
                  {isAmountsHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <span className="nx-label">{isAmountsHidden ? 'Mostrar' : 'Ocultar'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFreeze(activeAccount.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: activeAccount.isFrozen ? 'var(--primary)' : 'var(--text-main)' }}
              >
                <span className={`nx-detail-circle-btn ${activeAccount.isFrozen ? 'frozen' : ''}`}>
                  <Snowflake size={20} />
                </span>
                <span className="nx-label">{activeAccount.isFrozen ? 'Descongelar' : 'Congelar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditName(activeAccount.name);
                  setCopiedCode(false);
                  setIsSettingsOpen(true);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <span className="nx-detail-circle-btn">
                  <Settings size={20} />
                </span>
                <span className="nx-label">Ajustes</span>
              </button>
            </div>

            <div className="nx-detail-white-card" style={{ marginBottom: 'var(--sp-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-sm)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Transacción</span>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Importe</span>
              </div>

              {recentAccountTxs.length > 0 ? (
                <>
                  {recentAccountTxs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                  {transactions.length > 4 && (
                    <div style={{ textAlign: 'center', marginTop: 'var(--sp-sm)' }}>
                      <button
                        type="button"
                        onClick={() => setShowAllCardTx((prev) => !prev)}
                        style={{
                          background: 'transparent',
                          border: 0,
                          color: 'var(--primary)',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          padding: '8px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        {showAllCardTx ? 'Mostrar menos' : 'Ver todo'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', textAlign: 'center', padding: 'var(--sp-lg) 0', margin: 0 }}>
                  Aún no hay movimientos en esta cuenta.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              className="nx-detail-white-card"
              style={{
                width: '100%',
                border: 0,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <span>Ver análisis mensual y categorías</span>
              <ChevronRight size={17} style={{ color: 'var(--text-mute)' }} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL + AÑADIR O VINCULAR CUENTA */}
      {isAddModalOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAddModalOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="record-tabs" style={{ marginBottom: 'var(--sp-lg)' }}>
              <button type="button" className={addTab === 'create' ? 'active' : ''} onClick={() => { setAddTab('create'); setModalError(''); }}>
                Crear cuenta
              </button>
              <button type="button" className={addTab === 'join' ? 'active' : ''} onClick={() => { setAddTab('join'); setModalError(''); }}>
                Vincular compartida
              </button>
            </div>

            {addTab === 'create' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalError('');
                try {
                  const created = addProfile(newAccountName);
                  changeAccountTheme(created.id, selectedCardTheme);
                  setIsAddModalOpen(false);
                  setViewMode('detail');
                } catch (err) {
                  setModalError(err.message);
                }
              }}>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-lg)' }}>
                  Nombre de la cuenta
                  <input
                    required
                    autoFocus
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ej. Trabajo, Ahorro, Pareja..."
                  />
                </label>

                <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
                  Color de tarjeta
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCardTheme(t.id)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--rounded-full)',
                        background: t.bg,
                        border: selectedCardTheme === t.id ? '3px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                      aria-label={t.label}
                    />
                  ))}
                </div>

                {modalError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: 'var(--sp-md)' }}>{modalError}</p>}

                <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                  Crear cuenta <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalError('');
                try {
                  const joined = joinProfile(joinCode, joinName);
                  changeAccountTheme(joined.id, 'cobalt');
                  setIsAddModalOpen(false);
                  setViewMode('detail');
                } catch (err) {
                  setModalError(err.message);
                }
              }}>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                  Código de invitación
                  <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
                </label>
                <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-lg)' }}>
                  Nombre para esta cuenta
                  <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Casa" />
                </label>
                {modalError && <p style={{ color: 'var(--danger-red)', fontSize: '12px', marginBottom: 'var(--sp-md)' }}>{modalError}</p>}
                <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                  <UserPlus size={16} /> Vincular cuenta
                </button>
              </form>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL AJUSTES DE LA CUENTA */}
      {isSettingsOpen && activeAccount && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsSettingsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>Ajustes de cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsSettingsOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  renameProfile(activeAccount.id, editName);
                  setIsSettingsOpen(false);
                } catch {}
              }}
              style={{ marginBottom: 'var(--sp-lg)' }}
            >
              <label className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-md)' }}>
                Nombre de la cuenta
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </label>
              <button type="submit" className="nx-btn-dark" style={{ width: '100%' }}>
                Guardar nombre
              </button>
            </form>

            <span className="nx-label" style={{ display: 'block', color: 'var(--text-mute)', marginBottom: 'var(--sp-sm)' }}>
              Color de tarjeta
            </span>
            <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeAccountTheme(activeAccount.id, t.id)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--rounded-full)',
                    background: t.bg,
                    border: activeAccount.theme.id === t.id ? '3px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {shareCode && (
              <div className="nx-card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-mute)', marginBottom: '8px' }}>
                  <Share2 size={13} /> Código para compartir esta cuenta
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareCode}</code>
                  <button
                    type="button"
                    className="nx-btn-pill-sm"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => {
                      navigator.clipboard?.writeText(shareCode);
                      setCopiedCode(true);
                    }}
                  >
                    {copiedCode ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </button>
                </div>
              </div>
            )}

            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  deleteActiveProfile()
                    .then(() => {
                      setIsSettingsOpen(false);
                      setViewMode('list');
                    })
                    .catch((err) => alert(err.message));
                }}
                className="nx-btn-soft"
                style={{ width: '100%', color: 'var(--danger-red)' }}
              >
                <Trash2 size={15} /> {activeAccount.isShared ? 'Desvincular cuenta' : 'Eliminar cuenta'}
              </button>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL ANÁLISIS MENSUAL */}
      {isAnalyticsOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAnalyticsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>
                Análisis · {activeProfile?.name}
              </h2>
              <button type="button" className="sheet-close" onClick={() => setIsAnalyticsOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
              <div className="nx-card" style={{ padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Ingresos del mes</span>
                <span className="nx-display" style={{ display: 'block', fontSize: '20px', color: 'var(--accent-teal)', marginTop: '6px' }}>
                  {displayMoney(monthTotals.income)}
                </span>
              </div>
              <div className="nx-card" style={{ padding: 'var(--sp-lg)' }}>
                <span className="nx-label" style={{ color: 'var(--text-mute)' }}>Gastos del mes</span>
                <span className="nx-display" style={{ display: 'block', fontSize: '20px', color: 'var(--danger-red)', marginTop: '6px' }}>
                  {displayMoney(monthTotals.expenses)}
                </span>
              </div>
            </div>

            <div className="nx-card" style={{ marginBottom: 'var(--sp-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Gastos por categoría</span>
                <button
                  type="button"
                  className="nx-btn-pill-sm"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    setIsAnalyticsOpen(false);
                    onOpenLimits?.();
                  }}
                >
                  Editar topes
                </button>
              </div>

              {categoryBreakdown.length > 0 ? categoryBreakdown.map((cat) => {
                const limit = Number(monthlyCategoryCaps?.[cat.name]) || 0;
                const pct = limit > 0
                  ? Math.min(100, Math.round((cat.amount / limit) * 100))
                  : (monthTotals.expenses > 0 ? Math.min(100, Math.round((cat.amount / monthTotals.expenses) * 100)) : 0);
                return (
                  <div key={cat.name} style={{ marginBottom: 'var(--sp-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span>{cat.name}</span>
                      <span>
                        {displayMoney(cat.amount)}
                        {limit > 0 && <span style={{ color: 'var(--text-mute)' }}> / {displayMoney(limit)}</span>}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--bg-card-alt)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 'var(--rounded-full)',
                        backgroundColor: limit > 0 && cat.amount > limit ? 'var(--danger-red)' : 'var(--primary)',
                      }} />
                    </div>
                  </div>
                );
              }) : (
                <p style={{ fontSize: '13px', color: 'var(--text-mute)', margin: 0 }}>
                  Sin gastos registrados este mes.
                </p>
              )}
            </div>

            <button type="button" className="nx-btn-dark" style={{ width: '100%' }} onClick={() => setIsAnalyticsOpen(false)}>
              Cerrar
            </button>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
};

export default MovementsView;
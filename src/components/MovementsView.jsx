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
  { id: 'standard', label: 'Negro Estándar', bg: 'linear-gradient(145deg, #2D2F34 0%, #17181A 100%)', mini: '#232529' },
  { id: 'cobalt', label: 'Azul Revolut', bg: 'linear-gradient(145deg, #3B28F6 0%, #0075EB 100%)', mini: '#1D4ED8' },
  { id: 'burgundy', label: 'Burdeos Metal', bg: 'linear-gradient(145deg, #6B2337 0%, #3A101C 100%)', mini: '#5B1D2E' },
  { id: 'emerald', label: 'Esmeralda', bg: 'linear-gradient(145deg, #0F6B4E 0%, #063B2A 100%)', mini: '#0D5C43' },
  { id: 'violet', label: 'Ultravioleta', bg: 'linear-gradient(145deg, #5B21B6 0%, #2E1065 100%)', mini: '#4C1D95' },
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

const ACCOUNTS_CSS = `
.rev-cards-list-screen {
    min-height: 100dvh;
    margin-bottom: calc(-96px - env(safe-area-inset-bottom, 0px));
    padding: calc(16px + env(safe-area-inset-top, 0px)) 16px calc(154px + env(safe-area-inset-bottom, 0px));
    background:
      radial-gradient(95% 50% at 50% 8%, #4721E0 0%, #2B1378 50%, transparent 88%),
      linear-gradient(180deg, #2B1378 0%, #434157 56%, #6C6B73 100%);
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .rev-glass-group {
    background: rgba(255, 255, 255, 0.13);
    border-radius: 20px;
    padding: 4px 16px;
    margin-bottom: 12px;
  }
  .rev-card-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 16px 0;
    background: transparent;
    border: 0;
    color: #FFFFFF;
    text-align: left;
    cursor: pointer;
    gap: 18px;
  }
  .rev-mini-thumb {
    width: 44px;
    height: 28px;
    border-radius: 5px;
    padding: 4px 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.14);
    position: relative;
    overflow: hidden;
  }
  .rev-add-card-float {
    position: fixed;
    left: 50%;
    bottom: calc(82px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    background: #FFFFFF;
    color: #111418;
    border: 0;
    border-radius: 999px;
    padding: 12px 24px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
    cursor: pointer;
    z-index: 35;
    transition: transform 0.14s ease;
  }
  .rev-add-card-float:active {
    transform: translateX(-50%) scale(0.95);
  }

  /* VISTA DETALLE DE TARJETA (PANTALLAS 2 Y 3 DE REVOLUT) */
  .rev-card-stage {
    background: #2C2E31;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 18px 34px;
    color: #FFFFFF;
  }
  .rev-physical-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1.586 / 1;
    border-radius: 18px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
    transition: filter 0.35s ease, transform 0.25s ease;
  }
  /* EFECTO CONGELADO / HIELO COMO EN LA 3ª PANTALLA */
  .rev-frost-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.42) 0%, transparent 45%),
      radial-gradient(circle at 80% 30%, rgba(210, 235, 255, 0.38) 0%, transparent 50%),
      radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.46) 0%, transparent 55%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.26) 0%, rgba(190, 225, 255, 0.18) 100%);
    backdrop-filter: blur(6px) saturate(130%);
    -webkit-backdrop-filter: blur(6px) saturate(130%);
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    border-radius: 18px;
    pointer-events: none;
    z-index: 2;
  }
  .rev-card-detail-body {
    background: var(--rev-bg);
    border-radius: 26px 26px 0 0;
    margin-top: -18px;
    padding: 12px 16px 28px;
    position: relative;
    z-index: 3;
  }
  .rev-card-actions-trio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 8px 0 20px;
  }
  .rev-card-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    background: transparent;
    border: 0;
    cursor: pointer;
    font-family: inherit;
  }
  .rev-card-action-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--rev-card);
    color: var(--rev-text);
    box-shadow: var(--rev-shadow);
    border: 1px solid var(--rev-border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .rev-card-action-circle.frozen-active {
    background: var(--rev-blue);
    color: #FFFFFF;
    border-color: transparent;
    box-shadow: 0 6px 18px rgba(0, 117, 235, 0.35);
  }
  .rev-card-action-btn span {
    font-size: 12px;
    font-weight: 600;
    color: var(--rev-text);
  }
  .rev-card-action-btn.frozen-text span {
    color: var(--rev-blue);
    font-weight: 700;
  }
`;

const MovementsView = ({ onClose, onOpenLimits }) => {
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

  // 'list' = pantalla morada "Cuentas" (1ª captura), 'detail' = pantalla tarjeta + acciones (2ª y 3ª captura)
  const [viewMode, setViewMode] = useState('list');
  const [frozenMap, setFrozenMap] = useState(() => readMapStorage('balance-frozen-accounts'));
  const [themeMap, setThemeMap] = useState(() => readMapStorage('balance-account-themes'));

  // Modales
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

  // Datos para el modal de Análisis mensual
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
      <style>{ACCOUNTS_CSS}</style>

      {/* PANTALLA 1: LISTA DE CUENTAS ESTILO REVOLUT */}
      {viewMode === 'list' && (
        <div className="rev-cards-list-screen">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 0,
                background: 'rgba(255,255,255,0.14)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Volver al inicio"
            >
              <X size={18} />
            </button>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
            Cuentas
          </h1>

          {/* TARJETA TRANSLÚCIDA CON TODAS LAS CUENTAS */}
          <div className="rev-glass-group">
            {accountsData.map((acc, index) => {
              const isSelected = acc.id === activeProfileId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  className="rev-card-list-row"
                  onClick={() => {
                    triggerHaptic();
                    switchProfile(acc.id);
                    setShowAllCardTx(false);
                    setViewMode('detail');
                  }}
                >
                  {/* MINI TARJETA A LA IZQUIERDA */}
                  <span className="rev-mini-thumb" style={{ background: acc.theme.bg }}>
                    <span style={{ fontSize: '6px', fontWeight: 800, opacity: 0.85 }}>NEXO</span>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                      <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', marginLeft: '-2px' }} />
                    </span>
                    {acc.isFrozen && (
                      <span style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(210, 235, 255, 0.45)',
                        backdropFilter: 'blur(2px)',
                      }} />
                    )}
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
                      {acc.isFrozen && (
                        <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.2)' }}>
                          Congelada
                        </span>
                      )}
                    </strong>
                    <small className="privacy-sensitive" style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.72)', marginTop: '1px', fontVariantNumeric: 'tabular-nums' }}>
                      ••• {acc.digits} · {displayMoney(acc.balance)}
                    </small>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isSelected && (
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        color: '#2B1378',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <ChevronRight size={17} style={{ opacity: 0.65 }} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEGUNDA TARJETA TRANSLÚCIDA: ANÁLISIS MENSUAL Y TOPES */}
          <div className="rev-glass-group">
            <button
              type="button"
              className="rev-card-list-row"
              onClick={() => setIsAnalyticsOpen(true)}
            >
              <span style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.16)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BarChart3 size={17} />
              </span>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>
                Análisis mensual de {activeAccount?.name}
              </span>
              <ChevronRight size={17} style={{ opacity: 0.65 }} />
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.62)', marginTop: '10px' }}>
            Toca una cuenta para activarla, congelarla o ver sus movimientos
          </p>

          {/* BOTÓN FLOTANTE BLANCO + AÑADIR CUENTA */}
          <button
            type="button"
            className="rev-add-card-float"
            onClick={() => {
              setModalError('');
              setNewAccountName('');
              setJoinCode('');
              setJoinName('');
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={17} strokeWidth={2.6} /> Añadir cuenta
          </button>
        </div>
      )}

      {/* PANTALLAS 2 Y 3: DETALLE DE CUENTA / TARJETA CON EFECTO CONGELAR */}
      {viewMode === 'detail' && activeAccount && (
        <div>
          <div className="rev-card-stage">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: 0,
                  background: 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Volver a cuentas"
              >
                <ArrowLeft size={18} />
              </button>

              {/* SELECTOR RÁPIDO ENTRE CUENTAS */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '75%' }}>
                {accountsData.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      switchProfile(acc.id);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: 0,
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: acc.id === activeProfileId ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
                      color: acc.id === activeProfileId ? '#111418' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* TARJETA FÍSICA ESTILO REVOLUT */}
            <div className="rev-physical-card" style={{ background: activeAccount.theme.bg }}>
              {activeAccount.isFrozen && <div className="rev-frost-overlay" />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
                  {activeAccount.isShared ? 'Compartida' : 'Estándar'}
                </span>
                <strong className="privacy-sensitive" style={{ fontSize: '18px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {displayMoney(activeAccount.balance)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 3 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', fontWeight: 700 }}>
                    {activeAccount.name}
                  </strong>
                  <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                    •• {activeAccount.digits}
                  </span>
                </div>

                {/* DOBLE CÍRCULO ESTILO MASTERCARD */}
                <div style={{ display: 'flex', alignItems: 'center' }} aria-hidden="true">
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.42)' }} />
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', marginLeft: '-10px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* HOJA BLANCA INFERIOR CON 3 ACCIONES Y TRANSACCIONES */}
          <div className="rev-card-detail-body">
            <div className="sheet-handle" />

            <div className="rev-card-actions-trio">
              <button
                type="button"
                className="rev-card-action-btn"
                onClick={() => {
                  triggerHaptic();
                  setIsAmountsHidden?.((prev) => !prev);
                }}
              >
                <span className="rev-card-action-circle">
                  {isAmountsHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <span>{isAmountsHidden ? 'Mostrar' : 'Ocultar'}</span>
              </button>

              <button
                type="button"
                className={`rev-card-action-btn ${activeAccount.isFrozen ? 'frozen-text' : ''}`}
                onClick={() => toggleFreeze(activeAccount.id)}
              >
                <span className={`rev-card-action-circle ${activeAccount.isFrozen ? 'frozen-active' : ''}`}>
                  <Snowflake size={20} />
                </span>
                <span>{activeAccount.isFrozen ? 'Descongelar' : 'Congelar'}</span>
              </button>

              <button
                type="button"
                className="rev-card-action-btn"
                onClick={() => {
                  setEditName(activeAccount.name);
                  setCopiedCode(false);
                  setIsSettingsOpen(true);
                }}
              >
                <span className="rev-card-action-circle">
                  <Settings size={20} />
                </span>
                <span>Ajustes</span>
              </button>
            </div>

            {/* TRANSACCIONES DE ESTA CUENTA */}
            <div style={{
              background: 'var(--rev-card)',
              borderRadius: '18px',
              padding: '14px 16px 8px',
              border: '1px solid var(--rev-border)',
              boxShadow: 'var(--rev-shadow)',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--rev-muted)', marginBottom: '4px' }}>
                <span>Transacción</span>
                <span>Importe</span>
              </div>

              {recentAccountTxs.length > 0 ? (
                <>
                  {recentAccountTxs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                  {transactions.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCardTx((prev) => !prev)}
                      style={{
                        width: '100%',
                        border: 0,
                        background: 'transparent',
                        color: 'var(--rev-blue)',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '10px 0 6px',
                        cursor: 'pointer',
                      }}
                    >
                      {showAllCardTx ? 'Mostrar menos' : 'Ver todo'}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--rev-muted)', textAlign: 'center', padding: '16px 0' }}>
                  Aún no hay movimientos en esta cuenta.
                </p>
              )}
            </div>

            {/* ACCESO A ANÁLISIS MENSUAL DE LA CUENTA */}
            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              style={{
                width: '100%',
                background: 'var(--rev-card)',
                borderRadius: '16px',
                padding: '15px 16px',
                border: '1px solid var(--rev-border)',
                boxShadow: 'var(--rev-shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--rev-text)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Ver análisis mensual y categorías</span>
              <ChevronRight size={17} style={{ color: 'var(--rev-muted)' }} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL + AÑADIR O VINCULAR CUENTA */}
      {isAddModalOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAddModalOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="record-tabs" style={{ marginBottom: '16px' }}>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '14px' }}>
                  Nombre de la cuenta
                  <input
                    required
                    autoFocus
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ej. Trabajo, Ahorro, Pareja..."
                  />
                </label>

                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '8px' }}>
                  Color de tarjeta
                </span>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCardTheme(t.id)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: t.bg,
                        border: selectedCardTheme === t.id ? '3px solid var(--rev-blue)' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                      aria-label={t.label}
                    />
                  ))}
                </div>

                {modalError && <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>{modalError}</p>}

                <button type="submit" className="sheet-submit">
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '12px' }}>
                  Código de invitación
                  <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
                </label>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '14px' }}>
                  Nombre para esta cuenta
                  <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Casa" />
                </label>
                {modalError && <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>{modalError}</p>}
                <button type="submit" className="sheet-submit">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Ajustes de cuenta</h2>
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
              style={{ marginBottom: '16px' }}
            >
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '10px' }}>
                Nombre de la cuenta
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </label>
              <button type="submit" className="sheet-submit" style={{ height: '44px', fontSize: '14px' }}>
                Guardar nombre
              </button>
            </form>

            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '8px' }}>
              Diseño de tarjeta
            </span>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeAccountTheme(activeAccount.id, t.id)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: t.bg,
                    border: activeAccount.theme.id === t.id ? '3px solid var(--rev-blue)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {shareCode && (
              <div style={{
                background: 'var(--rev-card)',
                borderRadius: '16px',
                padding: '12px 14px',
                border: '1px solid var(--rev-border)',
                marginBottom: '14px',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', marginBottom: '6px' }}>
                  <Share2 size={13} /> Código para compartir esta cuenta
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareCode}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(shareCode);
                      setCopiedCode(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: 0,
                      background: 'var(--rev-blue-soft)',
                      color: 'var(--rev-blue)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
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
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '999px',
                  border: 0,
                  background: 'rgba(244, 63, 94, 0.14)',
                  color: 'var(--rev-red)',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={15} /> {activeAccount.isShared ? 'Desvincular cuenta' : 'Eliminar cuenta'}
              </button>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL ANÁLISIS MENSUAL DE LA CUENTA */}
      {isAnalyticsOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={() => setIsAnalyticsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Análisis · {activeProfile?.name}
              </h2>
              <button type="button" className="sheet-close" onClick={() => setIsAnalyticsOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--rev-card)', padding: '14px', borderRadius: '16px', border: '1px solid var(--rev-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Ingresos del mes</span>
                <strong style={{ display: 'block', fontSize: '18px', fontWeight: 800, color: 'var(--rev-green)', marginTop: '4px' }}>
                  {displayMoney(monthTotals.income)}
                </strong>
              </div>
              <div style={{ background: 'var(--rev-card)', padding: '14px', borderRadius: '16px', border: '1px solid var(--rev-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--rev-muted)' }}>Gastos del mes</span>
                <strong style={{ display: 'block', fontSize: '18px', fontWeight: 800, color: 'var(--rev-red)', marginTop: '4px' }}>
                  {displayMoney(monthTotals.expenses)}
                </strong>
              </div>
            </div>

            <div style={{ background: 'var(--rev-card)', padding: '16px', borderRadius: '18px', border: '1px solid var(--rev-border)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '14px' }}>Gastos por categoría</strong>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnalyticsOpen(false);
                    onOpenLimits?.();
                  }}
                  style={{ background: 'var(--rev-blue-soft)', color: 'var(--rev-blue)', border: 0, borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
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
                  <div key={cat.name} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <strong>{cat.name}</strong>
                      <span>
                        {displayMoney(cat.amount)}
                        {limit > 0 && <span style={{ color: 'var(--rev-muted)' }}> / {displayMoney(limit)}</span>}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '99px', background: 'var(--rev-subtle)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: '99px',
                        background: limit > 0 && cat.amount > limit ? 'var(--rev-red)' : 'var(--rev-blue)',
                      }} />
                    </div>
                  </div>
                );
              }) : (
                <p style={{ fontSize: '13px', color: 'var(--rev-muted)', margin: 0 }}>
                  Sin gastos registrados este mes.
                </p>
              )}
            </div>

            <button type="button" className="sheet-submit" onClick={() => setIsAnalyticsOpen(false)}>
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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart2,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FolderPlus,
  Landmark,
  Menu,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Settings,
  Share2,
  Shuffle,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import TransactionItem, { getCategoryVisuals } from "./TransactionItem";
import HomeThemeModal from "./HomeThemeModal";
import {
  getSavedHomeBackground,
  HOME_BG_EVENT,
} from "../utils/homeBackgrounds";
import { useElasticScroll } from "../hooks/useElasticScroll";
import { getFromLocalStorage } from "../utils/localStorage";
import { triggerHaptic } from "../utils/haptics";

const HOME_CARD_THEMES = [
  { id: "revolut-standard", label: "Revolut Standard", bg: "linear-gradient(135deg, #2563EB 0%, #7C3AED 52%, #EC4899 100%)" },
  { id: "metal-black", label: "Metal Black", bg: "linear-gradient(145deg, #2C2D32 0%, #16171A 52%, #09090B 100%)" },
  { id: "metal-space-grey", label: "Space Grey", bg: "linear-gradient(145deg, #5C606B 0%, #3A3D45 50%, #23252A 100%)" },
  { id: "metal-gold", label: "Metal Gold", bg: "linear-gradient(135deg, #C8A45D 0%, #9E7B38 48%, #735723 100%)" },
  { id: "metal-rose-gold", label: "Rose Gold", bg: "linear-gradient(135deg, #C98B83 0%, #A46760 50%, #7A4843 100%)" },
  { id: "metal-lavender", label: "Metal Lavender", bg: "linear-gradient(135deg, #8B7AD9 0%, #6353B5 52%, #44368A 100%)" },
  { id: "ultra-platinum", label: "Ultra Platinum", bg: "linear-gradient(135deg, #9EA4B0 0%, #6C727F 48%, #464B56 100%)" },
  { id: "chromatic", label: "Chromatic", bg: "linear-gradient(125deg, #3B82F6 0%, #8B5CF6 28%, #EC4899 56%, #F59E0B 82%, #10B981 100%)" },
  { id: "disposable", label: "Desechable", bg: "linear-gradient(135deg, #FF2E93 0%, #E11D48 55%, #9F1239 100%)" },
  { id: "cobalt", label: "Azul Cobalto", bg: "linear-gradient(145deg, #494FDF 0%, #2D32B8 55%, #1A1E7A 100%)" },
  { id: "emerald", label: "Esmeralda", bg: "linear-gradient(145deg, #00A87E 0%, #007558 55%, #024B39 100%)" },
  { id: "midnight-aurora", label: "Aurora", bg: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0EA5E9 100%)" },
  { id: "sunset-amber", label: "Ámbar", bg: "linear-gradient(135deg, #F97316 0%, #C2410C 52%, #7C2D12 100%)" },
  { id: "bronze", label: "Bronce", bg: "linear-gradient(145deg, #936D62 0%, #63473F 55%, #3E2C27 100%)" },
];

const CARD_THEME_BGS = Object.fromEntries(HOME_CARD_THEMES.map((t) => [t.id, t.bg]));

const HOME_CARD_NETWORKS = [
  { id: "mastercard", label: "Mastercard" },
  { id: "mastercard-color", label: "MC Color" },
  { id: "visa", label: "Visa" },
  { id: "amex", label: "Amex" },
  { id: "none", label: "Sin logo" },
];

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatEuro = (val, { minDecimals = 2, maxDecimals = 2 } = {}) => {
  const num = Number(val) || 0;
  const sign = num < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("es-ES", {
    useGrouping: "always",
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(Math.abs(num));
  return `${sign}€${formatted}`;
};

const formatTxDateMeta = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const today = getTodayStr();
  const yestDate = new Date();
  yestDate.setDate(yestDate.getDate() - 1);
  const yesterday = `${yestDate.getFullYear()}-${String(yestDate.getMonth() + 1).padStart(2, "0")}-${String(yestDate.getDate()).padStart(2, "0")}`;

  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
};

const CardThemeStackSlider = ({
  themes,
  selectedThemeId,
  account,
  balanceDisplay,
  isFrozen,
  onSelectTheme,
}) => {
  const activeIdx = Math.max(
    0,
    themes.findIndex((t) => t.id === selectedThemeId),
  );

  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const dragStartRef = useRef(null);

  const goToIndex = (nextIdx) => {
    const wrapped = (nextIdx + themes.length) % themes.length;
    triggerHaptic("light");
    onSelectTheme(themes[wrapped].id);
  };

  const handlePointerDown = (e) => {
    if (e.target.closest("button")) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDraggingCard(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingCard || !dragStartRef.current) return;
    const dy = e.clientY - dragStartRef.current.y;
    const dx = e.clientX - dragStartRef.current.x;
    const dominant = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
    setDragOffset(dominant * 0.65);
  };

  const handlePointerUp = () => {
    if (!isDraggingCard) return;
    setIsDraggingCard(false);
    const threshold = 34;

    if (dragOffset > threshold) {
      goToIndex(activeIdx + 1);
    } else if (dragOffset < -threshold) {
      goToIndex(activeIdx - 1);
    }
    setDragOffset(0);
    dragStartRef.current = null;
  };

  const currentTheme = themes[activeIdx] || themes[0];
  const txCount = Array.isArray(account?.txs) ? account.txs.length : 0;
  const network = account?.net || "mastercard";
  const cardTitle = account?.name || "Tarjeta";

  return (
    <div>
      <div
        className="nx-card-slider-shell"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >

        <div className="nx-card-stack-stage">
          {themes.map((t, idx) => {
            let offset = idx - activeIdx;
            const half = Math.floor(themes.length / 2);
            if (offset > half) offset -= themes.length;
            if (offset < -half) offset += themes.length;

            const absOffset = Math.abs(offset);
            const isVisible = absOffset <= 2;

            const liveShift = isDraggingCard ? dragOffset * 0.35 : 0;
            const translateY = offset * 34 + liveShift;
            const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.93 : 0.86;
            const opacity = !isVisible ? 0 : absOffset === 0 ? 1 : absOffset === 1 ? 0.82 : 0.45;
            const zIndex = 10 - absOffset * 2;

            return (
              <div
                key={t.id}
                role="button"
                tabIndex={isVisible ? 0 : -1}
                className="nx-stack-slide-card"
                onClick={() => {
                  if (Math.abs(dragOffset) > 6) return;
                  if (offset === 0) {
                    goToIndex(activeIdx + 1);
                  } else {
                    triggerHaptic("light");
                    onSelectTheme(t.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goToIndex(idx);
                  }
                }}
                style={{
                  background: t.bg,
                  opacity,
                  zIndex,
                  pointerEvents: isVisible ? "auto" : "none",
                  transition: isDraggingCard
                    ? "none"
                    : "transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease",
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                }}
                aria-label={`Color ${t.label} · ${cardTitle}`}
              >
                {isFrozen && <div className="nx-frost-overlay" />}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 3 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{cardTitle}</span>
                  <span className="privacy-sensitive" style={{ fontSize: "18px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {balanceDisplay}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 3 }}>
                  <span style={{ fontSize: "12px", opacity: 0.85 }}>
                    {isFrozen
                      ? "Tarjeta congelada"
                      : `${txCount} ${txCount === 1 ? "movimiento" : "movimientos"}`}
                  </span>

                  {network === "visa" ? (
                    <span style={{ fontSize: "16px", fontWeight: 800, fontStyle: "italic" }}>VISA</span>
                  ) : network === "amex" ? (
                    <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em" }}>AMEX</span>
                  ) : network === "none" ? null : (
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      <i style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#EB001B", display: "inline-block" }} />
                      <i style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#F79E1B", marginLeft: "-7px", display: "inline-block" }} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nx-card-theme-caption">
        <span style={{ fontSize: "12.5px", color: "#9CA3AF", fontWeight: 500 }}>
          Color de tarjeta
        </span>
        <strong style={{ fontSize: "13.5px", fontWeight: 600 }}>
          {currentTheme?.label} · {activeIdx + 1}/{themes.length}
        </strong>
      </div>

      <div className="nx-card-dots" aria-hidden="true">
        {themes.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            className={`nx-card-dot ${idx === activeIdx ? "active" : ""}`}
            onClick={() => goToIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};
const WalletTxRow = ({ transaction, isAmountsHidden, onClick }) => {
  const isExpense = transaction.type === "Gasto";
  const isIncome = transaction.type === "Ingreso";
  const visuals = getCategoryVisuals(transaction.category, transaction.type);
  const IconComp = visuals?.icon;
  const title = (transaction.description || "").trim() || transaction.category || "Movimiento";
  const categoryLabel = transaction.category || (isIncome ? "Ingreso" : "Gasto");
  const dateLabel = formatTxDateMeta(transaction.date);
  const timeLabel = transaction.time ? `${transaction.time} · ` : "";

  const amt = Math.abs(Number(transaction.amount) || 0);
  const formattedAmt = isAmountsHidden
    ? "€••••"
    : formatEuro(amt, { minDecimals: 2, maxDecimals: 2 });

  const sign = isExpense ? "- " : isIncome ? "+ " : "";

  return (
    <div className="nx-wtx-row" onClick={onClick} role="button" tabIndex={0}>
      <div
        className="nx-wtx-avatar"
        style={{ backgroundColor: visuals?.bg || "#ECEEF2", color: "#FFFFFF" }}
      >
        {React.isValidElement(IconComp)
          ? React.cloneElement(IconComp, { size: 18, strokeWidth: 2.1 })
          : typeof IconComp === "function"
            ? <IconComp size={18} strokeWidth={2.1} />
            : title.charAt(0).toUpperCase()}
      </div>

      <div className="nx-wtx-main">
        <span className="nx-wtx-title">{title}</span>
        <span className="nx-wtx-sub">
          {timeLabel}
          {dateLabel}
        </span>
      </div>

      <div className="nx-wtx-right">
        <span
          className={`nx-wtx-amount privacy-sensitive ${isExpense ? "expense" : "income"}`}
        >
          {isAmountsHidden ? "€••••" : `${sign}${formattedAmt}`}
        </span>
        <span className="nx-wtx-cat">{categoryLabel}</span>
      </div>

      <ChevronRight size={15} className="nx-wtx-chevron" />
    </div>
  );
};

const HOME_WALLET_CSS = `
  .stage:not(.dark),
  .stage:not(.dark) .phone,
  .stage:not(.dark) .screen-content {
    background-color: #FAFAFB;
    color: #111827;
  }
  .dark .stage,
  .dark .phone,
  .dark .screen-content {
    background-color: var(--canvas-dark);
    color: #FFFFFF;
  }

  .nx-wallet-home {
    padding: calc(var(--sp-lg) + env(safe-area-inset-top, 0px)) var(--sp-lg) var(--sp-xxl);
    position: relative;
  }

  /* CABECERA ESTILO WALLET */
  .nx-wh-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 30px 0px;
    margin-top: 20px !important;
  }
  .nx-wh-circle-btn {
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
    flex-shrink: 0;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .nx-wh-circle-btn:active {
    transform: scale(0.93);
  }
  .dark .nx-wh-circle-btn {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .nx-wh-title-wrap {
    text-align: center;
    flex: 1;
    min-width: 0;
  }
  .nx-wh-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: #111827;
  }
  .dark .nx-wh-title {
    color: #FFFFFF;
  }
  .nx-wh-subtitle {
    margin: 2px 0 0;
    font-size: 11.5px;
    font-weight: 500;
    color: #8E929B;
  }
  .dark .nx-wh-subtitle {
    color: rgba(255, 255, 255, 0.56);
  }

  /* BUSCADOR SUTIL */
  .nx-wh-search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #8E929B;
    margin-bottom: 16px;
  }
  .dark .nx-wh-search {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
  }
  .nx-wh-search input {
    flex: 1;
    border: 0;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: 13px;
    color: #111827;
    min-width: 0;
  }
  .dark .nx-wh-search input {
    color: #FFFFFF;
  }

  /* =========================================================
     CARTERA DE PIEL CON IMAGEN PNG — TAMAÑO COMPACTO Y LIMPIO
     ========================================================= */
  .nx-leather-stage {
    position: relative;
    width: 100%;
    max-width: 340px;
    height: 212px;
    margin: 0 auto 18px;
    user-select: none;
    overflow: visible;
  }

  .nx-leather-back-rim {
    position: absolute;
    left: 6px;
    right: 6px;
    top: 24px;
    bottom: 12px;
    border-radius: 24px;
    z-index: 0;
    background: linear-gradient(180deg, #4B2E1B 0%, #331D0F 100%);
    box-shadow: none;
  }
  .nx-leather-back-rim::before {
    content: "";
    position: absolute;
    inset: 4px;
    border-radius: 20px;
    border: 1.5px dashed rgba(214, 168, 124, 0.3);
    pointer-events: none;
  }

  .nx-leather-fan {
    position: absolute;
    left: 18px;
    right: 18px;
    top: 6px;
    height: 136px;
    z-index: 1;
  }

  @keyframes nxCardTuckIn {
    0% {
      opacity: 0;
      transform: translate3d(0, calc(var(--ty) - 50px), 0) scale(0.95);
    }
    25% {
      opacity: 1;
    }
    76% {
      opacity: 1;
      transform: translate3d(0, calc(var(--ty) + 4px), 0) scale(1);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, var(--ty), 0) scale(1);
    }
  }

  .nx-leather-fan-card {
    position: relative;
    position: absolute;
    left: 0;
    right: 0;
    width: 100%;
    height: 118px;
    border-radius: 14px 14px 8px 8px;
    padding: 10px 14px;
    box-sizing: border-box;
    border: 0;
    overflow: hidden;
    color: #FFFFFF;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    box-shadow:
      0 -2px 10px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
    transform: translate3d(0, var(--ty), 0);
    transition: transform .98s cubic-bezier(0.16, 1, 0.3, 1);
    animation: nxCardTuckIn 2.15s cubic-bezier(0.16, 1, 0.3, 1) 50ms backwards;
    will-change: transform, opacity;
  }
  .nx-leather-fan-card:hover {
    transform: translate3d(0, calc(var(--ty) - 6px), 0);
  }

  /* EFECTO HIELO COMPARTIDO EN TARJETAS */
  .nx-frost-overlay {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.44) 0%, transparent 45%),
      radial-gradient(circle at 80% 30%, rgba(210, 235, 255, 0.38) 0%, transparent 50%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.26) 0%, rgba(190, 225, 255, 0.18) 100%);
    backdrop-filter: blur(6px) saturate(130%);
    -webkit-backdrop-filter: blur(6px) saturate(130%);
    pointer-events: none;
    z-index: 2;
  }

  .nx-leather-pouch {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 156px;
    z-index: 3;
    padding: 46px 24px 18px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    cursor: pointer;
  }

  .nx-leather-pouch-img {
    position: absolute;
    width: 119%;
    max-width: none;
    height: auto;
    left: -10.5%;
    bottom: -40px;
    pointer-events: none;
    z-index: 0;
    filter: none;
  }

  .nx-leather-balance-lbl {
    font-size: 12px;
    font-weight: 300;
    color: rgba(255, 244, 232, 0.78);
    display: block;
    margin-bottom: 12px;
    margin-left: 6px;
    position: relative;
    z-index: 2;
  }

  .nx-leather-balance-val {
    display: block;
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: #FFFDF9;
    font-variant-numeric: tabular-nums;
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    margin-bottom: 12px;
    margin-left: 6px;
  }

  .nx-leather-eye-btn {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(255, 226, 190, 0.26);
    background: rgba(94, 60, 38, 0.56);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow:
      inset 0 1px 1px rgba(255, 232, 204, 0.24),
      0 3px 8px rgba(0, 0, 0, 0.28);
    color: rgba(255, 248, 240, 0.92);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    transition: transform 0.12s ease;
    margin-bottom: 8px;
  }
  .nx-leather-eye-btn:active {
    transform: scale(0.93);
  }

  /* =========================================================
     ACCIONES RÁPIDAS — ESTILO PLANO Y NÍTIDO (1px #EAECEF)
     ========================================================= */
  .nx-wh-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 22px;
    position: relative;
  }
  .nx-wh-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: #111827;
  }
  .dark .nx-wh-action-btn {
    color: #FFFFFF;
  }
  .nx-wh-action-icon {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .nx-wh-action-btn:active:not(:disabled) .nx-wh-action-icon {
    transform: scale(0.93);
    background: #F3F4F6;
  }
  .dark .nx-wh-action-icon {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }
  .nx-wh-action-lbl {
    font-size: 11.5px;
    font-weight: 500;
    color: #6B7280;
  }
  .dark .nx-wh-action-lbl {
    color: rgba(255, 255, 255, 0.72);
  }

  /* =========================================================
     LISTA DE MOVIMIENTOS
     ========================================================= */
  .nx-wh-section-heading {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0 0 8px 2px;
    color: #111827;
  }
  .dark .nx-wh-section-heading {
    color: #FFFFFF;
  }
  .nx-wh-month-label {
    font-size: 13.5px;
    font-weight: 500;
    color: #9CA3AF;
    margin: 0 0 10px 2px;
    text-transform: capitalize;
  }
  .dark .nx-wh-month-label {
    color: rgba(255, 255, 255, 0.52);
  }
  .nx-wh-tx-card {
    background: #FFFFFF;
    border-radius: 18px;
    margin-bottom: 18px;
    border: 1px solid #EAECEF;
    overflow: hidden;
  }
  .dark .nx-wh-tx-card {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
  }

  .nx-wtx-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    cursor: pointer;
    transition: background-color 0.14s ease;
  }
  .nx-wtx-row + .nx-wtx-row {
    border-top: 1px solid #F1F3F5;
  }
  .nx-wtx-row:active {
    background-color: #F9FAFB;
  }
  .dark .nx-wtx-row + .nx-wtx-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
  .dark .nx-wtx-row:active {
    background-color: rgba(255, 255, 255, 0.04);
  }

  .nx-wtx-avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .nx-wtx-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nx-wtx-title {
    font-size: 14.5px;
    font-weight: 500;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dark .nx-wtx-title {
    color: #FFFFFF;
  }
  .nx-wtx-sub {
    font-size: 12px;
    font-weight: 400;
    color: #9CA3AF;
    font-variant-numeric: tabular-nums;
  }

  .nx-wtx-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }
  .nx-wtx-amount {
    font-size: 14.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .nx-wtx-amount.expense {
    color: #D93829;
  }
  .nx-wtx-amount.income {
    color: #111827;
  }
  .dark .nx-wtx-amount.income {
    color: #FFFFFF;
  }
  .nx-wtx-cat {
    font-size: 11.5px;
    font-weight: 400;
    color: #9CA3AF;
  }

  .nx-wtx-chevron {
    color: #9CA3AF;
    flex-shrink: 0;
    margin-left: 2px;
  }

  /* =========================================================
     WIDGETS
     ========================================================= */
  .nx-wh-widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .nx-wh-widget {
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 16px;
    text-align: left;
    font-family: inherit;
    color: #111827;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: background-color 0.14s ease, transform 0.12s ease;
  }
  button.nx-wh-widget:active {
    transform: scale(0.985);
    background-color: #F9FAFB;
  }
  .dark .nx-wh-widget {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
    color: #FFFFFF;
  }
  .nx-wh-cat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    background: transparent;
    border: 0;
    padding: 9px 0;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
  }
  .nx-wh-cat-row + .nx-wh-cat-row {
    border-top: 1px solid #F1F3F5;
  }
  .dark .nx-wh-cat-row + .nx-wh-cat-row {
    border-top-color: rgba(255, 255, 255, 0.07);
  }

  /* POPUP DESLIZABLE PARA ELEGIR TARJETA / CUENTA */
  .nx-card-picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10020;
    background: rgba(10, 12, 20, 0.46);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .nx-card-picker-sheet {
    width: 100%;
    max-width: 460px;
    max-height: 90dvh;
    overflow-y: auto;
    border-radius: 30px 30px 0 0;
    background: #FAFAFB;
    color: #111827;
    padding: 10px 18px calc(24px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -16px 44px rgba(0, 0, 0, 0.25);
    animation: nx-picker-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .dark .nx-card-picker-sheet {
    background: #13151C;
    color: #FFFFFF;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }
  @keyframes nx-picker-up {
    from { transform: translateY(100%); opacity: 0.7; }
    to { transform: translateY(0); opacity: 1; }
  }
  .nx-picker-grabber {
    width: 38px;
    height: 5px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.18);
    margin: 0 auto 12px;
  }
  .dark .nx-picker-grabber {
    background: rgba(255, 255, 255, 0.25);
  }
  .nx-picker-carousel {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    margin: 0 -18px 8px;
    padding: 6px 24px 20px;
    background: transparent;
  }
  .nx-picker-carousel::-webkit-scrollbar {
    display: none;
  }
  .nx-picker-slide {
    flex: 0 0 calc(100% - 16px);
    scroll-snap-align: center;
    scroll-snap-stop: always;
    background: transparent;
  }
  .nx-picker-card {
    position: relative;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 1.65 / 1;
    border-radius: 22px;
    padding: 20px;
    box-sizing: border-box;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 0;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.14);
  }
  .dark .nx-picker-card {
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
  }

  /* ACCIONES DE CUENTA DENTRO DEL POPUP DE TARJETAS */
  .nx-picker-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 0 0 16px;
  }
  .nx-picker-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
  }
  .nx-picker-action-circle {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background-color 0.15s ease;
  }
  .nx-picker-action-btn:active .nx-picker-action-circle {
    transform: scale(0.92);
  }
  .dark .nx-picker-action-circle {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .nx-picker-action-circle.frozen {
    background: #38BDF8;
    border-color: #38BDF8;
    color: #0F172A;
  }
  .nx-picker-action-lbl {
    font-size: 11.5px;
    font-weight: 500;
    color: #6B7280;
  }
  .dark .nx-picker-action-lbl {
    color: rgba(255, 255, 255, 0.72);
  }

  .nx-picker-tx-box {
    background: #FFFFFF;
    border-radius: 18px;
    margin-bottom: 14px;
    border: 1px solid #EAECEF;
    overflow: hidden;
  }
  .dark .nx-picker-tx-box {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.09);
  }
  .nx-picker-select-btn {
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .dark .nx-picker-select-btn {
    background: #FFFFFF;
    color: #111827;
  }

  /* POPOVER MÁS: OSCURO EN MODO CLARO / CLARO EN MODO OSCURO */
  .nx-more-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0, 0, 0, 0.18);
  }
  .nx-more-popover {
    position: absolute;
    right: 0;
    bottom: calc(100% + 10px);
    width: 220px;
    z-index: 20;
    border-radius: 18px;
    background: rgba(24, 26, 33, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.28);
    overflow: hidden;
  }
  .nx-more-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    background: transparent;
    border: 0;
    color: #FFFFFF;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.14s ease;
  }
  .nx-more-item:active {
    background: rgba(255, 255, 255, 0.08);
  }
  .nx-more-item + .nx-more-item {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .nx-more-item.danger {
    color: #F87171;
  }
  .dark .nx-more-popover {
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid #EAECEF;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  }
  .dark .nx-more-item {
    color: #111827;
  }
  .dark .nx-more-item:active {
    background: #F3F4F6;
  }
  .dark .nx-more-item + .nx-more-item {
    border-top: 1px solid #F1F3F5;
  }
  .dark .nx-more-item.danger {
    color: #DC2626;
  }

  /* PORCENTAJE AL LADO DEL BALANCE EN LA CARTERA */
  .nx-leather-balance-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    position: relative;
    z-index: 2;
    margin-bottom: 12px;
    margin-left: 6px;
  }
  .nx-leather-balance-row .nx-leather-balance-val {
    margin: 0;
  }
  .nx-leather-pct-badge {
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 7px;
    border-radius: 999px;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .nx-leather-pct-badge.up {
    color: #4ADE80;
  }
  .nx-leather-pct-badge.down {
    color: #F87171;
  }

  /* SLIDER DE GASTOS / INGRESOS EN EL WIDGET */
  .nx-wh-slider-widget {
    padding: 0;
    overflow: hidden;
    position: relative;
    cursor: default;
  }
  .nx-wh-slider-track {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .nx-wh-slider-track::-webkit-scrollbar {
    display: none;
  }
  .nx-wh-slide {
    flex: 0 0 100%;
    width: 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    padding: 16px 16px 24px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: transparent;
    border: 0;
    text-align: left;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
  }
  .nx-wh-slide-dots {
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 5px;
    z-index: 2;
  }
  .nx-wh-slide-dot {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background: rgba(156, 163, 175, 0.45);
    cursor: pointer;
    transition: width 0.2s ease, background-color 0.2s ease;
  }
  .nx-wh-slide-dot.active {
    width: 13px;
    background: #111827;
  }
  .dark .nx-wh-slide-dot.active {
    background: #FFFFFF;
  }

  /* AJUSTES DE TARJETA — SLIDER APILADO */
  .nx-card-slider-shell {
    position: relative;
    width: 100%;
    height: 286px;
    margin: 6px 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }
  .nx-card-stack-stage {
    position: relative;
    width: 100%;
    max-width: 310px;
    height: 182px;
  }
  .nx-stack-slide-card {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 182px;
    border-radius: 20px;
    padding: 16px 18px;
    box-sizing: border-box;
    border: 1.5px solid rgba(255, 255, 255, 0.28);
    overflow: hidden;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
    will-change: transform, opacity;
  }
  .dark .nx-stack-slide-card {
    border-color: rgba(255, 255, 255, 0.18);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
  }
  .nx-stack-chip {
    width: 34px;
    height: 25px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.45);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.06) 100%);
    position: relative;
    overflow: hidden;
  }
  .nx-stack-chip::before {
    content: "";
    position: absolute;
    inset: 4px 7px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 2px;
  }
  .nx-stack-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid #EAECEF;
    background: #FFFFFF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 20;
    transition: transform 0.12s ease, background-color 0.14s ease;
  }
  .nx-stack-nav-btn:active {
    transform: translateY(-50%) scale(0.92);
  }
  .nx-stack-nav-btn.prev {
    left: 2px;
  }
  .nx-stack-nav-btn.next {
    right: 2px;
  }
  .dark .nx-stack-nav-btn {
    background: #1B1E27;
    border-color: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }
  .nx-card-theme-caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 4px 12px;
    margin-top: 26px;
  }
  .nx-card-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }
  .nx-card-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background: #D1D5DB;
    cursor: pointer;
    transition: width 0.2s ease, background-color 0.2s ease;
  }
  .dark .nx-card-dot {
    background: rgba(255, 255, 255, 0.22);
  }
  .nx-card-dot.active {
    width: 18px;
    background: #111827;
  }
  .dark .nx-card-dot.active {
    background: #FFFFFF;
  }
  .nx-settings-box {
    background: #FFFFFF;
    border: 1px solid #EAECEF;
    border-radius: 18px;
    padding: 14px 16px;
    margin-bottom: 14px;
  }
  .dark .nx-settings-box {
    background: #16171C;
    border-color: rgba(255, 255, 255, 0.09);
  }
    @keyframes nx-quick-actions-in {
    from {
      opacity: 0;
      transform: translate3d(0, -8px, 0) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  .nx-wh-actions.is-open {
    animation: nx-quick-actions-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

const HomeOverview = ({
  query = "",
  onQueryChange,
  onOpenLimits,
  onQuickAction,
  onOpenProfile,
  onLongPressAvatar,
  onOpenMovements,
}) => {
const {
    transactions,
    investmentRecords = [],
    monthlyCategoryCaps = {},
    accountsVersion = 0,
    filters,
    activeProfile,
    activeProfileId,
    switchProfile,
    profiles = [],
    getTransactionsForProfile,
    isAmountsHidden,
    setIsAmountsHidden,
    addProfile,
    joinProfile,
    renameProfile,
    deleteActiveProfile,
    exportPdf,
    exportCsv,
    syncUser,
    deleteTransaction,
  } = useFinance();

  const [, setBgConfig] = useState(() => getSavedHomeBackground());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [addAccountTab, setAddAccountTab] = useState("create");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountDate, setNewAccountDate] = useState(() => getTodayStr());
  const [selectedCardTheme, setSelectedCardTheme] = useState("revolut-standard");
  const [selectedCardNetwork, setSelectedCardNetwork] = useState("mastercard");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [newAccountError, setNewAccountError] = useState("");

  const [showSearch, setShowSearch] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [previewAccountId, setPreviewAccountId] = useState(activeProfileId);
  const [frozenMap, setFrozenMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("balance-frozen-accounts") || "{}") || {}; } catch { return {}; }
  });
  const [metaVersion, setMetaVersion] = useState(0);

  const [isPickerSettingsOpen, setIsPickerSettingsOpen] = useState(false);
  const [editAccName, setEditAccName] = useState("");
  const [copiedAccCode, setCopiedAccCode] = useState(false);

  const scrollContainerRef = useRef(null);
  const pickerCarouselRef = useRef(null);
  const pickerScrollTimerRef = useRef(null);
  const longPressRef = useRef(null);
  const didLongPressRef = useRef(false);

  const [txSyncTick, setTxSyncTick] = useState(0);

  useEffect(() => {
    const handleTxUpdated = () => setTxSyncTick((t) => t + 1);
    window.addEventListener("finance:transactions-updated", handleTxUpdated);
    return () => window.removeEventListener("finance:transactions-updated", handleTxUpdated);
  }, []);
  
  const { pullY, isSnapping, onTouchStart, onTouchMove, onTouchEnd } =
    useElasticScroll(75, 0.35);

  useEffect(() => {
    const handleBgChanged = (e) => {
      setBgConfig(e.detail || getSavedHomeBackground());
    };
    window.addEventListener(HOME_BG_EVENT, handleBgChanged);
    return () => window.removeEventListener(HOME_BG_EVENT, handleBgChanged);
  }, []);

  useEffect(() => {
    const settleTimer = window.setTimeout(() => {
      if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
        triggerHaptic("cardSettle");
      }
    }, 1680);

    return () => window.clearTimeout(settleTimer);
  }, []);

  useEffect(() => () => window.clearTimeout(pickerScrollTimerRef.current), []);

  const saveAccountMeta = (profileId, { themeId, networkId, createdDate }) => {
    try {
      const themes = JSON.parse(localStorage.getItem("balance-account-themes") || "{}") || {};
      const nets = JSON.parse(localStorage.getItem("balance-account-networks") || "{}") || {};
      const dates = JSON.parse(localStorage.getItem("balance-account-created-dates") || "{}") || {};
      if (themeId) themes[profileId] = themeId;
      if (networkId) nets[profileId] = networkId;
      if (createdDate) dates[profileId] = createdDate;
      localStorage.setItem("balance-account-themes", JSON.stringify(themes));
      localStorage.setItem("balance-account-networks", JSON.stringify(nets));
      localStorage.setItem("balance-account-created-dates", JSON.stringify(dates));
    } catch {}
    setMetaVersion((v) => v + 1);
  };

  const toggleFreezeAccount = (profileId) => {
    triggerHaptic("medium");
    const next = { ...frozenMap, [profileId]: !frozenMap[profileId] };
    setFrozenMap(next);
    try { localStorage.setItem("balance-frozen-accounts", JSON.stringify(next)); } catch {}
  };

  const updateAccountTheme = (profileId, themeId) => {
    triggerHaptic();
    saveAccountMeta(profileId, { themeId });
  };

  const updateAccountNetwork = (profileId, networkId) => {
    triggerHaptic();
    saveAccountMeta(profileId, { networkId });
  };

  const openAddAccountModal = () => {
    triggerHaptic();
    setAddAccountTab("create");
    setNewAccountName("");
    setNewAccountDate(getTodayStr());
    setSelectedCardTheme("revolut-standard");
    setSelectedCardNetwork("mastercard");
    setJoinCode("");
    setJoinName("");
    setNewAccountError("");
    setIsNewAccountOpen(true);
  };

  const accountsWithCards = useMemo(() => {
    let savedThemes = {};
    let savedNets = {};
    try {
      savedThemes = JSON.parse(localStorage.getItem("balance-account-themes") || "{}") || {};
      savedNets = JSON.parse(localStorage.getItem("balance-account-networks") || "{}") || {};
    } catch {}

    const themeKeys = Object.keys(CARD_THEME_BGS);
    const list = profiles.length > 0 ? profiles : activeProfile ? [activeProfile] : [];

    return list.map((p, idx) => {
      const storedTxs = getFromLocalStorage(`finance:${p.id}:transactions`);
      const pTxs = p.id === activeProfileId
        ? transactions
        : (Array.isArray(storedTxs)
          ? storedTxs
          : (getTransactionsForProfile ? getTransactionsForProfile(p.id) : []));

      const bal = (Array.isArray(pTxs) ? pTxs : []).reduce((acc, tx) => {
        const amt = Number(tx?.amount) || 0;
        if (!Number.isFinite(amt)) return acc;
        return tx.type === "Ingreso" ? acc + amt : tx.type === "Gasto" ? acc - amt : acc;
      }, 0);
      const themeId = savedThemes[p.id] || themeKeys[idx % themeKeys.length];

      return {
        ...p,
        balance: bal,
        txs: Array.isArray(pTxs) ? pTxs : [],
        themeId,
        bg: CARD_THEME_BGS[themeId] || CARD_THEME_BGS["revolut-standard"],
        net: savedNets[p.id] || (idx % 2 === 0 ? "mastercard" : "visa"),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, activeProfile, activeProfileId, transactions, getTransactionsForProfile, metaVersion, accountsVersion, txSyncTick]);

  const isActiveFrozen = Boolean(frozenMap[activeProfileId]);

  const openPickerAt = (profileId) => {
    triggerHaptic();
    const targetId = profileId || activeProfileId;
    setPreviewAccountId(targetId);
    setIsPickerOpen(true);
    window.requestAnimationFrame(() => {
      const el = pickerCarouselRef.current;
      if (!el) return;
      const idx = Math.max(0, accountsWithCards.findIndex((a) => a.id === targetId));
      const slide = el.children[idx];
      if (slide) {
        el.scrollTo({ left: slide.offsetLeft - 24, behavior: "auto" });
      }
    });
  };

  const handlePickerScroll = () => {
    const el = pickerCarouselRef.current;
    if (!el || accountsWithCards.length <= 1) return;
    window.clearTimeout(pickerScrollTimerRef.current);
    pickerScrollTimerRef.current = window.setTimeout(() => {
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let minDist = Infinity;
      Array.from(el.children).forEach((child, idx) => {
        const cCenter = child.offsetLeft + child.clientWidth / 2;
        const d = Math.abs(center - cCenter);
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });
      if (accountsWithCards[closestIdx]) {
        setPreviewAccountId(accountsWithCards[closestIdx].id);
      }
    }, 80);
  };

  const previewAccount = useMemo(
    () => accountsWithCards.find((a) => a.id === previewAccountId) || accountsWithCards[0],
    [accountsWithCards, previewAccountId],
  );

  const previewRecentTxs = useMemo(() => {
    if (!previewAccount) return [];
    return [...previewAccount.txs]
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
      .slice(0, 3);
  }, [previewAccount]);

  const fanCards = useMemo(() => {
    return [
      ...accountsWithCards.filter((a) => a.id !== activeProfileId),
      ...accountsWithCards.filter((a) => a.id === activeProfileId),
    ].slice(-3);
  }, [accountsWithCards, activeProfileId]);

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}`;
  const monthName = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(
    new Date(filters.year, filters.month, 1),
  );
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const monthlyTransactions = useMemo(
    () => transactions.filter((tx) => typeof tx.date === "string" && tx.date.startsWith(monthPrefix)),
    [transactions, monthPrefix],
  );

  const [metricSlide, setMetricSlide] = useState(0);
  const metricSliderRef = useRef(null);

  const previousMonthTotals = useMemo(() => {
    const prevDate = new Date(filters.year, filters.month - 1, 1);
    const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    return transactions.reduce((acc, tx) => {
      if (typeof tx.date !== "string" || !tx.date.startsWith(prevPrefix)) return acc;
      const amt = Number(tx.amount) || 0;
      if (!Number.isFinite(amt) || amt <= 0) return acc;
      if (tx.type === "Ingreso") acc.income += amt;
      if (tx.type === "Gasto") acc.expenses += amt;
      return acc;
    }, { income: 0, expenses: 0 });
  }, [transactions, filters.year, filters.month]);

  const totals = useMemo(
    () => monthlyTransactions.reduce((acc, tx) => {
      const amt = Number(tx.amount);
      if (!Number.isFinite(amt) || amt <= 0) return acc;
      if (tx.type === "Ingreso") acc.income += amt;
      if (tx.type === "Gasto") acc.expenses += amt;
      return acc;
    }, { income: 0, expenses: 0 }),
    [monthlyTransactions],
  );

  const expenseDiff = totals.expenses - previousMonthTotals.expenses;
  const incomeDiff = totals.income - previousMonthTotals.income;

  const availableThisMonth = totals.income - totals.expenses;
  const availableLastMonth = previousMonthTotals.income - previousMonthTotals.expenses;
  const availablePct = useMemo(() => {
    if (availableLastMonth === 0) {
      if (availableThisMonth === 0) return 0;
      return availableThisMonth > 0 ? 100 : -100;
    }
    return Math.round(((availableThisMonth - availableLastMonth) / Math.abs(availableLastMonth)) * 100);
  }, [availableThisMonth, availableLastMonth]);
  const isAvailableUp = availableThisMonth >= availableLastMonth;

  const { spendWidgetChart, incomeWidgetChart } = useMemo(() => {
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = filters.year === today.getFullYear() && filters.month === today.getMonth();
    const isPastMonth = filters.year < today.getFullYear() || (filters.year === today.getFullYear() && filters.month < today.getMonth());
    const cutoffDay = isCurrentMonth ? Math.min(daysInMonth, Math.max(1, today.getDate())) : (isPastMonth ? daysInMonth : 1);

    const buildChart = (txType) => {
      const daily = Array(daysInMonth).fill(0);
      monthlyTransactions.filter((tx) => tx.type === txType).forEach((tx) => {
        const day = parseInt(tx.date.split("-")[2], 10);
        if (day >= 1 && day <= daysInMonth) daily[day - 1] += Number(tx.amount) || 0;
      });

      let running = 0;
      const cumulative = daily.map((val, idx) => {
        running += val;
        return { day: idx + 1, value: running };
      });

      const currentVal = cumulative[cutoffDay - 1]?.value || 0;
      const maxY = Math.max(currentVal, 1);

      const toCoord = (day, val) => ({
        x: ((day - 1) / Math.max(1, daysInMonth - 1)) * 140,
        y: 42 - (val / maxY) * 32,
      });

      const pts = cumulative.slice(0, cutoffDay).map((item) => toCoord(item.day, item.value));
      const actualPath = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
      const last = pts[pts.length - 1] || { x: 0, y: 42 };
      const actualArea = `${actualPath} L${last.x.toFixed(1)} 46 L0 46 Z`;
      return { actualPath, actualArea };
    };

    return {
      spendWidgetChart: buildChart("Gasto"),
      incomeWidgetChart: buildChart("Ingreso"),
    };
  }, [monthlyTransactions, filters.year, filters.month]);

  const walletBalance = availableThisMonth;

  const { totalWealth, allAccountsMonthlyDelta } = useMemo(() => {
    const accountList = profiles.length > 0 ? profiles : activeProfile ? [activeProfile] : [];
    let wealth = 0;
    let monthlyDelta = 0;

    accountList.forEach((profile) => {
      const storedTxs = getFromLocalStorage(`finance:${profile.id}:transactions`);
      const pTxs = Array.isArray(storedTxs)
        ? storedTxs
        : (getTransactionsForProfile ? getTransactionsForProfile(profile.id) : []);

      (Array.isArray(pTxs) ? pTxs : []).forEach((tx) => {
        const amt = Number(tx?.amount) || 0;
        if (!Number.isFinite(amt)) return;
        if (tx.type === "Ingreso") {
          wealth += amt;
          if (typeof tx.date === "string" && tx.date.startsWith(monthPrefix)) monthlyDelta += amt;
        } else if (tx.type === "Gasto") {
          wealth -= amt;
          if (typeof tx.date === "string" && tx.date.startsWith(monthPrefix)) monthlyDelta -= amt;
        }
      });
    });

    return { totalWealth: wealth, allAccountsMonthlyDelta: monthlyDelta };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, activeProfile, getTransactionsForProfile, monthPrefix, accountsVersion, txSyncTick]);

  const categoryDonut = useMemo(() => {
    const map = {};
    monthlyTransactions
      .filter((tx) => tx.type === "Gasto")
      .forEach((tx) => {
        const cat = tx.category || "Otros";
        map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
      });

    const sorted = Object.entries(map)
      .map(([name, amount]) => {
        const limit = Number(monthlyCategoryCaps?.[name]) || 0;
        return {
          name,
          amount,
          limit,
          isOverLimit: limit > 0 && amount > limit,
          color: getCategoryVisuals(name, "Gasto").bg,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const items = sorted.length > 8
      ? [
          ...sorted.slice(0, 7),
          { name: "Otros", amount: sorted.slice(7).reduce((s, i) => s + i.amount, 0), limit: 0, isOverLimit: false, color: "#6B7280" },
        ]
      : sorted;

    const segments = items.map((item) => ({
      ...item,
      share: totals.expenses > 0 ? Math.round((item.amount / totals.expenses) * 100) : 0,
    }));

    return { items, segments };
  }, [monthlyTransactions, totals.expenses, monthlyCategoryCaps]);

  const displayMoney = (val) => (
    isAmountsHidden
      ? "€••••"
      : formatEuro(val, { minDecimals: 2, maxDecimals: 2 })
  );

  const displayCompactMoney = (val) => {
    if (isAmountsHidden) return "€••••";
    const num = Number(val) || 0;
    const isWhole = Number.isInteger(num);
    return formatEuro(num, {
      minDecimals: isWhole ? 0 : 2,
      maxDecimals: 2,
    });
  };

  const formatDonutTotal = (val) => {
    if (isAmountsHidden) return "€••••";
    if (Math.abs(val) >= 1000) {
      const kVal = (Math.abs(val) / 1000).toFixed(1).replace(".0", "").replace(".", ",");
      return `${val < 0 ? "-" : ""}€${kVal}K`;
    }
    return displayCompactMoney(val);
  };

  const groupedMonths = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions
      .filter((tx) => `${tx.description || ""} ${tx.category} ${tx.paymentMethod || ""}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));

    const map = new Map();
    filtered.forEach((tx) => {
      const key = typeof tx.date === "string" && tx.date.length >= 7 ? tx.date.slice(0, 7) : monthPrefix;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    });

    const groups = Array.from(map.entries()).map(([ym, list]) => {
      const [yStr, mStr] = ym.split("-");
      const label = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(
        new Date(Number(yStr) || filters.year, (Number(mStr) || 1) - 1, 1),
      );
      return { ym, label, items: list };
    });

    if (showAllTx) return groups;
    return groups.slice(0, 2).map((g, idx) => ({
      ...g,
      items: idx === 0 ? g.items.slice(0, 4) : g.items.slice(0, 2),
    }));
  }, [transactions, query, showAllTx, monthPrefix, filters.year]);

  const totalFilteredCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => `${tx.description || ""} ${tx.category} ${tx.paymentMethod || ""}`.toLowerCase().includes(q)).length;
  }, [transactions, query]);

  return (
    <div
      ref={scrollContainerRef}
      className={`elastic-scroll-wrapper ${isSnapping ? "snapping" : ""}`}
      style={{
        position: "relative",
        transform: pullY ? `translate3d(0, ${pullY}px, 0)` : undefined,
        zIndex: isMoreMenuOpen ? 60 : undefined,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={(e) => onTouchMove(e, scrollContainerRef.current?.closest(".screen-content"))}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <style>{HOME_WALLET_CSS}</style>

      {isMoreMenuOpen && createPortal(
        <div className="nx-more-backdrop" onClick={() => setIsMoreMenuOpen(false)} aria-hidden="true" />,
        document.body,
      )}

      <div className="nx-wallet-home">
        {/* CABECERA: MENÚ + WALLET + AÑADIR */}
        <div className="nx-wh-header">
          <button
  type="button"
  className="nx-wh-circle-btn"
  onClick={() => {
    triggerHaptic();
    setIsQuickActionsOpen((prev) => {
      const next = !prev;
      if (!next) setIsMoreMenuOpen(false);
      return next;
    });
  }}
  aria-label="Acciones rápidas"
  aria-expanded={isQuickActionsOpen}
>
  <Menu size={18} strokeWidth={2.2} />
</button>
          <div
            className="nx-wh-title-wrap"
            onPointerDown={() => {
              didLongPressRef.current = false;
              longPressRef.current = window.setTimeout(() => {
                didLongPressRef.current = true;
                onLongPressAvatar?.();
              }, 500);
            }}
            onPointerUp={() => window.clearTimeout(longPressRef.current)}
            onPointerLeave={() => window.clearTimeout(longPressRef.current)}
            onClick={() => {
              if (didLongPressRef.current) {
                didLongPressRef.current = false;
                return;
              }
              onOpenProfile?.();
            }}
            style={{ cursor: "pointer" }}
          >
            <h1 className="nx-wh-title">Wallet</h1>
            <p className="nx-wh-subtitle">
              {capitalizedMonth} · Mis Tarjetas y Movimientos
            </p>
          </div>

          <button
            type="button"
            className="nx-wh-circle-btn"
            onClick={openAddAccountModal}
            aria-label="Nueva cuenta"
          >
            <Plus size={19} strokeWidth={2.3} />
          </button>
        </div>

        {/* BUSCADOR */}
        {(showSearch || query) && (
          <div className="nx-wh-search">
            <Search size={14} strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              placeholder="Buscar movimientos..."
              autoFocus={showSearch}
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange?.("")}
                style={{ background: "transparent", border: 0, color: "inherit", display: "flex", padding: 0, cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* CARTERA DE PIEL REAL CON IMAGEN PNG */}
        <div className="nx-leather-stage">
          <div className="nx-leather-back-rim" aria-hidden="true" />

          <div className="nx-leather-fan">
            {fanCards.map((card, idx) => {
              const isCardFrozen = Boolean(frozenMap[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  className="nx-leather-fan-card"
                  onClick={() => openPickerAt(card.id)}
                  style={{
                    background: card.bg,
                    "--ty": `${idx * 13}px`,
                    zIndex: idx + 1,
                  }}
                  aria-label={`Ver tarjeta ${card.name}`}
                >
                  {isCardFrozen && <div className="nx-frost-overlay" />}

                  <span style={{ position: "relative", zIndex: 3, fontSize: "12.5px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {card.name}
                  </span>

                  {card.net === "visa" ? (
                    <span style={{ position: "relative", zIndex: 3, fontSize: "13.5px", fontWeight: 800, fontStyle: "italic", letterSpacing: "-0.04em" }}>
                      VISA
                    </span>
                  ) : card.net === "none" ? null : (
                    <span style={{ position: "relative", zIndex: 3, display: "inline-flex", alignItems: "center" }}>
                      <i style={{ width: "15px", height: "15px", borderRadius: "50%", background: "#EB001B", display: "inline-block" }} />
                      <i style={{ width: "15px", height: "15px", borderRadius: "50%", background: "#F79E1B", marginLeft: "-6px", opacity: 0.92, display: "inline-block" }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="nx-leather-pouch"
            onClick={() => openPickerAt(activeProfileId)}
            role="button"
            tabIndex={0}
            aria-label="Cambiar de tarjeta o cuenta"
          >
            <img
              src="/wallet_pouch.png"
              alt=""
              className="nx-leather-pouch-img"
              draggable={false}
            />

            <div>
              <span className="nx-leather-balance-lbl">
                Disponible · {activeProfile?.name || "Personal"} 
                 {isActiveFrozen ? <Snowflake size={12} style={{ color: '#38BDF8', marginLeft: "5px" }} /> : ""}
              </span>
              <div className="nx-leather-balance-row">
                <strong className="nx-leather-balance-val privacy-sensitive">
                  {displayMoney(walletBalance)}
                </strong>
                {!isAmountsHidden && (
                  <span className={`nx-leather-pct-badge ${isAvailableUp ? "up" : "down"}`}>
                    {availablePct > 0 ? `+${availablePct}%` : `${availablePct}%`}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="nx-leather-eye-btn"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic();
                setIsAmountsHidden?.((prev) => !prev);
              }}
              aria-label={isAmountsHidden ? "Mostrar importes" : "Ocultar importes"}
            >
              {isAmountsHidden ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* 4 ACCIONES RÁPIDAS */}
        {isQuickActionsOpen && (
  <div className="nx-wh-actions is-open">
        <div className="nx-wh-actions">
          {isMoreMenuOpen && (
            <div className="nx-more-popover" role="menu">
              <button
                type="button"
                className="nx-more-item"
                onClick={() => { triggerHaptic(); setIsMoreMenuOpen(false); onOpenMovements?.(); }}
              >
                <span>Ver cuentas</span>
                <BarChart2 size={16} />
              </button>
              <button
                type="button"
                className="nx-more-item"
                onClick={() => { triggerHaptic(); setIsMoreMenuOpen(false); exportPdf?.(); }}
              >
                <span>Extracto PDF</span>
                <FileText size={16} />
              </button>
              <button
                type="button"
                className="nx-more-item"
                onClick={() => { triggerHaptic(); setIsMoreMenuOpen(false); exportCsv?.(); }}
              >
                <span>Exportar CSV</span>
                <ArrowLeftRight size={16} />
              </button>
              <button
                type="button"
                className="nx-more-item"
                onClick={() => { triggerHaptic(); setIsMoreMenuOpen(false); setIsThemeModalOpen(true); }}
              >
                <span>Tema</span>
                <Palette size={16} />
              </button>
              <button
                type="button"
                className="nx-more-item"
                onClick={() => {
                  triggerHaptic();
                  setIsMoreMenuOpen(false);
                  openAddAccountModal();
                }}
              >
                <span>Nueva cuenta</span>
                <FolderPlus size={16} />
              </button>
              {profiles.length > 1 && (
                <button
                  type="button"
                  className="nx-more-item danger"
                  onClick={() => {
                    triggerHaptic();
                    setIsMoreMenuOpen(false);
                    deleteActiveProfile?.().catch((err) => alert(err.message));
                  }}
                >
                  <span>Eliminar cuenta</span>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="nx-wh-action-btn"
            style={{ opacity: isActiveFrozen ? 0.45 : 1 }}
            onClick={() => {
              if (isActiveFrozen) {
                triggerHaptic("error");
                return;
              }
              setIsMoreMenuOpen(false);
              onQuickAction?.("income");
            }}
          >
            <span className="nx-wh-action-icon"><Plus size={18} strokeWidth={2.1} /></span>
            <span className="nx-wh-action-lbl">Ingreso</span>
          </button>

          <button
            type="button"
            className="nx-wh-action-btn"
            style={{ opacity: isActiveFrozen ? 0.45 : 1 }}
            onClick={() => {
              if (isActiveFrozen) {
                triggerHaptic("error");
                return;
              }
              setIsMoreMenuOpen(false);
              onQuickAction?.("expense");
            }}
          >
            <span className="nx-wh-action-icon"><Shuffle size={16} strokeWidth={2.1} /></span>
            <span className="nx-wh-action-lbl">Gasto</span>
          </button>

          <button type="button" className="nx-wh-action-btn" onClick={() => { setIsMoreMenuOpen(false); onOpenLimits?.(); }}>
            <span className="nx-wh-action-icon"><Landmark size={16} strokeWidth={2.1} /></span>
            <span className="nx-wh-action-lbl">Topes</span>
          </button>

          <button
            type="button"
            className="nx-wh-action-btn"
            onClick={() => { triggerHaptic(); setIsMoreMenuOpen((prev) => !prev); }}
            aria-expanded={isMoreMenuOpen}
          >
            <span className="nx-wh-action-icon"><MoreHorizontal size={18} strokeWidth={2.1} /></span>
            <span className="nx-wh-action-lbl">Más</span>
          </button>
        </div></div>
)}

        {/* MOVIMIENTOS AGRUPADOS POR MES */}
        <h2 className="nx-wh-section-heading">Movimientos</h2>

        {groupedMonths.length > 0 ? (
          <>
            {groupedMonths.map((group) => (
              <div key={group.ym}>
                <div className="nx-wh-month-label">{group.label}</div>
                <div className="nx-wh-tx-card">
                  {group.items.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              </div>
            ))}

            {totalFilteredCount > 4 && (
              <button
                type="button"
                onClick={() => setShowAllTx((prev) => !prev)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: 0,
                  color: "#6B7280",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "2px 0 18px",
                  cursor: "pointer",
                }}
              >
                {showAllTx ? "Mostrar menos" : "Ver todos los movimientos"}
              </button>
            )}
          </>
        ) : (
          <div className="nx-wh-tx-card" style={{ padding: "22px 16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF" }}>
              Sin movimientos registrados todavía.
            </p>
          </div>
        )}

        {/* WIDGETS */}
        <h2 className="nx-wh-section-heading">Resumen</h2>

        <div className="nx-wh-widgets-grid">
          <div className="nx-wh-widget nx-wh-slider-widget">
            <div
              ref={metricSliderRef}
              className="nx-wh-slider-track"
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (idx !== metricSlide) setMetricSlide(idx);
              }}
            >
              <button type="button" className="nx-wh-slide" onClick={onOpenMovements}>
                <div>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500, display: "block" }}>
                    Gasto este mes
                  </span>
                  <strong className="privacy-sensitive" style={{ fontSize: "20px", fontWeight: 700, display: "block", marginTop: "6px", letterSpacing: "-0.02em" }}>
                    {displayMoney(totals.expenses)}
                  </strong>
                  <span
                    className="privacy-sensitive"
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      display: "inline-block",
                      marginTop: "6px",
                      color: expenseDiff >= 0 ? "#D93829" : "#10B981",
                    }}
                  >
                    {expenseDiff >= 0 ? "▲ " : "▼ "}{displayCompactMoney(Math.abs(expenseDiff))}
                  </span>
                </div>

                <svg viewBox="0 0 140 46" preserveAspectRatio="none" style={{ width: "100%", height: "38px", marginTop: "10px", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="nxWhSpendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D93829" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#D93829" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d={spendWidgetChart.actualArea} fill="url(#nxWhSpendFill)" />
                  <path d={spendWidgetChart.actualPath} fill="none" stroke="#D93829" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>

              <button type="button" className="nx-wh-slide" onClick={onOpenMovements}>
                <div>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500, display: "block" }}>
                    Ingresos este mes
                  </span>
                  <strong className="privacy-sensitive" style={{ fontSize: "20px", fontWeight: 700, display: "block", marginTop: "6px", letterSpacing: "-0.02em" }}>
                    {displayMoney(totals.income)}
                  </strong>
                  <span
                    className="privacy-sensitive"
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      display: "inline-block",
                      marginTop: "6px",
                      color: incomeDiff >= 0 ? "#10B981" : "#D93829",
                    }}
                  >
                    {incomeDiff >= 0 ? "▲ " : "▼ "}{displayCompactMoney(Math.abs(incomeDiff))}
                  </span>
                </div>

                <svg viewBox="0 0 140 46" preserveAspectRatio="none" style={{ width: "100%", height: "38px", marginTop: "10px", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="nxWhIncomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d={incomeWidgetChart.actualArea} fill="url(#nxWhIncomeFill)" />
                  <path d={incomeWidgetChart.actualPath} fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="nx-wh-slide-dots" aria-label="Cambiar entre gastos e ingresos">
              {[0, 1].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`nx-wh-slide-dot ${metricSlide === idx ? "active" : ""}`}
                  onClick={() => {
                    triggerHaptic();
                    setMetricSlide(idx);
                    const el = metricSliderRef.current;
                    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
                  }}
                  aria-label={idx === 0 ? "Ver gastos" : "Ver ingresos"}
                />
              ))}
            </div>
          </div>

          <button type="button" className="nx-wh-widget" onClick={onOpenMovements}>
            <div>
              <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500, display: "block" }}>
                Patrimonio total
              </span>
              <strong className="privacy-sensitive" style={{ fontSize: "20px", fontWeight: 700, display: "block", marginTop: "6px", letterSpacing: "-0.02em" }}>
                {displayCompactMoney(totalWealth)}
              </strong>
              <span
                className="privacy-sensitive"
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginTop: "6px",
                  color: allAccountsMonthlyDelta >= 0 ? "#10B981" : "#D93829",
                }}
              >
                {allAccountsMonthlyDelta >= 0 ? "▲ " : "▼ "}{displayCompactMoney(Math.abs(allAccountsMonthlyDelta))}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "14px" }}>
              <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                {accountsWithCards.length} {accountsWithCards.length === 1 ? "tarjeta" : "tarjetas"}
              </span>
              <ChevronRight size={14} style={{ color: "#9CA3AF" }} />
            </div>
          </button>

          <div
            className="nx-wh-widget"
            style={{ gridColumn: "1 / -1", cursor: "default", padding: "14px 16px 8px" }}
            onMouseLeave={() => setHoveredCat(null)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "#9CA3AF", fontWeight: 500 }}>Por categoría</span>
              <button
                type="button"
                onClick={onOpenLimits}
                style={{ background: "transparent", border: 0, padding: 0, fontSize: "12px", fontWeight: 600, color: "var(--primary)", cursor: "pointer", fontFamily: "inherit" }}
              >
                Topes
              </button>
            </div>

            {categoryDonut.items.length > 0 ? (
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <strong className="privacy-sensitive" style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {hoveredCat ? displayCompactMoney(hoveredCat.amount) : formatDonutTotal(totals.expenses)}
                  </strong>
                  {hoveredCat && (
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {hoveredCat.name} · {hoveredCat.share}%
                    </span>
                  )}
                </div>

                <div>
                  {categoryDonut.segments.slice(0, 4).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      className="nx-wh-cat-row"
                      onMouseEnter={() => setHoveredCat(cat)}
                      onClick={() => { triggerHaptic(); setHoveredCat((prev) => (prev?.name === cat.name ? null : cat)); }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, minWidth: 0 }}>
                        <i style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cat.color, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                      </span>
                      <span
                        className="privacy-sensitive"
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: cat.isOverLimit ? "#D93829" : "inherit",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayCompactMoney(cat.amount)}
                        {cat.limit > 0 && (
                          <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
                            /{displayCompactMoney(cat.limit)}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: "13px", color: "#9CA3AF", paddingBottom: "8px" }}>Sin gastos este mes.</span>
            )}
          </div>
        </div>
      </div>

      {/* POPUP DESLIZABLE DE TARJETAS + ACCIONES + MOVIMIENTOS + SELECCIONAR */}
      {isPickerOpen && previewAccount && createPortal(
        <div
          className="nx-card-picker-backdrop"
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            className="nx-card-picker-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nx-picker-grabber" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>Tus tarjetas</span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid #EAECEF",
                  background: "#FFFFFF",
                  color: "#111827",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              ref={pickerCarouselRef}
              className="nx-picker-carousel"
              onScroll={handlePickerScroll}
            >
              {accountsWithCards.map((acc) => {
                const isFrozen = Boolean(frozenMap[acc.id]);
                return (
                  <div key={acc.id} className="nx-picker-slide">
                    <div className="nx-picker-card" style={{ background: acc.bg }}>
                      {isFrozen && <div className="nx-frost-overlay" />}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 3 }}>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{acc.name}</span>
                        <span className="privacy-sensitive" style={{ fontSize: "18px", fontWeight: 700 }}>
                          {displayMoney(acc.balance)}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 3 }}>
                        <span style={{ fontSize: "12px", opacity: 0.85 }}>
                          {isFrozen ? "Tarjeta congelada" : `${acc.txs.length} ${acc.txs.length === 1 ? "movimiento" : "movimientos"}`}
                        </span>
                        {acc.net === "visa" ? (
                          <span style={{ fontSize: "16px", fontWeight: 800, fontStyle: "italic" }}>VISA</span>
                        ) : acc.net === "none" ? null : (
                          <span style={{ display: "inline-flex", alignItems: "center" }}>
                            <i style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#EB001B", display: "inline-block" }} />
                            <i style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#F79E1B", marginLeft: "-7px", display: "inline-block" }} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3 ACCIONES DE LA TARJETA: OCULTAR, CONGELAR, AJUSTES */}
            <div className="nx-picker-actions">
              <button
                type="button"
                className="nx-picker-action-btn"
                onClick={() => {
                  triggerHaptic();
                  setIsAmountsHidden?.((prev) => !prev);
                }}
              >
                <span className="nx-picker-action-circle">
                  {isAmountsHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
                <span className="nx-picker-action-lbl">{isAmountsHidden ? "Mostrar" : "Ocultar"}</span>
              </button>

              <button
                type="button"
                className="nx-picker-action-btn"
                style={{ color: frozenMap[previewAccount.id] ? "#38BDF8" : "inherit" }}
                onClick={() => toggleFreezeAccount(previewAccount.id)}
              >
                <span className={`nx-picker-action-circle ${frozenMap[previewAccount.id] ? "frozen" : ""}`}>
                  <Snowflake size={18} />
                </span>
                <span className="nx-picker-action-lbl">
                  {frozenMap[previewAccount.id] ? "Descongelar" : "Congelar"}
                </span>
              </button>

              <button
                type="button"
                className="nx-picker-action-btn"
                onClick={() => {
                  triggerHaptic();
                  setEditAccName(previewAccount.name);
                  setCopiedAccCode(false);
                  setIsPickerSettingsOpen(true);
                }}
              >
                <span className="nx-picker-action-circle">
                  <Settings size={18} />
                </span>
                <span className="nx-picker-action-lbl">Ajustes</span>
              </button>
            </div>

            <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#9CA3AF", margin: "0 0 8px 4px" }}>
              Últimos movimientos · {previewAccount.name}
            </div>
            <div className="nx-picker-tx-box">
              {previewRecentTxs.length > 0 ? (
                previewRecentTxs.map((tx) => (
                  <WalletTxRow
                    key={tx.id}
                    transaction={tx}
                    isAmountsHidden={isAmountsHidden}
                  />
                ))
              ) : (
                <p style={{ margin: 0, padding: "16px 0", textAlign: "center", fontSize: "12.5px", color: "#9CA3AF" }}>
                  Sin movimientos en esta tarjeta.
                </p>
              )}
            </div>

            <button
              type="button"
              className="nx-picker-select-btn"
              onClick={() => {
                triggerHaptic();
                switchProfile?.(previewAccount.id);
                setIsPickerOpen(false);
              }}
            >
              <Check size={17} strokeWidth={2.5} />
              <span>
                {previewAccount.id === activeProfileId
                  ? `Seleccionada (${previewAccount.name})`
                  : `Seleccionar ${previewAccount.name}`}
              </span>
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* SUB-MODAL AJUSTES DE LA TARJETA CON SLIDER APILADO */}
      {isPickerSettingsOpen && previewAccount && createPortal(
        <div className="sheet-layer" style={{ zIndex: 10040 }} onMouseDown={() => setIsPickerSettingsOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                  Ajustes de tarjeta
                </h2>
                <span style={{ fontSize: "12.5px", color: "#9CA3AF" }}>
                  Desliza arriba o abajo para cambiar el color de {previewAccount.name}
                </span>
              </div>
              <button
                type="button"
                className="sheet-close"
                style={{ border: "1px solid #EAECEF" }}
                onClick={() => setIsPickerSettingsOpen(false)}
              >
                <X size={17} />
              </button>
            </div>

            <CardThemeStackSlider
              themes={HOME_CARD_THEMES}
              selectedThemeId={previewAccount.themeId}
              account={{
                ...previewAccount,
                name: (editAccName || "").trim() || previewAccount.name,
              }}
              balanceDisplay={displayMoney(previewAccount.balance)}
              isFrozen={Boolean(frozenMap[previewAccount.id])}
              onSelectTheme={(themeId) => updateAccountTheme(previewAccount.id, themeId)}
            />

            <div className="nx-settings-box">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    renameProfile?.(previewAccount.id, editAccName);
                    triggerHaptic("success");
                    setIsPickerSettingsOpen(false);
                  } catch {}
                }}
              >
                <label className="nx-label" style={{ display: "block", color: "#9CA3AF", marginBottom: "10px" }}>
                  Nombre de la tarjeta / cuenta
                  <input
                    value={editAccName}
                    onChange={(e) => setEditAccName(e.target.value)}
                    required
                    style={{ marginTop: "6px" }}
                  />
                </label>
                <button type="submit" className="nx-btn-dark" style={{ width: "100%" }}>
                  Guardar nombre
                </button>
              </form>
            </div>

            <div className="nx-settings-box">
              <span className="nx-label" style={{ display: "block", color: "#9CA3AF", marginBottom: "10px" }}>
                Red de pagos
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {HOME_CARD_NETWORKS.map((net) => {
                  const active = previewAccount.net === net.id;
                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => updateAccountNetwork(previewAccount.id, net.id)}
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        border: active ? "1px solid #111827" : "1px solid #EAECEF",
                        fontSize: "12.5px",
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        backgroundColor: active ? "#111827" : "transparent",
                        color: active ? "#FFFFFF" : "inherit",
                      }}
                    >
                      {net.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(previewAccount.id.includes("___") || syncUser) && (
              <div className="nx-settings-box">
                <span className="nx-label" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9CA3AF", marginBottom: "8px" }}>
                  <Share2 size={13} /> Código para compartir
                </span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <code style={{ fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {previewAccount.id.includes("___") ? previewAccount.id : `${syncUser.uid}___${previewAccount.id}`}
                  </code>
                  <button
                    type="button"
                    className="nx-btn-pill-sm"
                    style={{ color: "var(--primary)" }}
                    onClick={() => {
                      const code = previewAccount.id.includes("___") ? previewAccount.id : `${syncUser.uid}___${previewAccount.id}`;
                      navigator.clipboard?.writeText(code);
                      triggerHaptic("light");
                      setCopiedAccCode(true);
                    }}
                  >
                    {copiedAccCode ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </button>
                </div>
              </div>
            )}

            {profiles.length > 1 && previewAccount.id === activeProfileId && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("error");
                  deleteActiveProfile?.()
                    .then(() => {
                      setIsPickerSettingsOpen(false);
                      setIsPickerOpen(false);
                    })
                    .catch((err) => alert(err.message));
                }}
                className="nx-btn-soft"
                style={{ width: "100%", color: "#D93829", border: "1px solid #EAECEF" }}
              >
                <Trash2 size={15} /> {previewAccount.id.includes("___") ? "Desvincular cuenta" : "Eliminar cuenta"}
              </button>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL NUEVA CUENTA COMPLETO */}
      {isNewAccountOpen && createPortal(
        <div className="sheet-layer" style={{ zIndex: 10030 }} onMouseDown={() => setIsNewAccountOpen(false)}>
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>Nueva cuenta</h2>
              <button type="button" className="sheet-close" onClick={() => setIsNewAccountOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="record-tabs" style={{ marginBottom: "16px" }}>
              <button
                type="button"
                className={addAccountTab === "create" ? "active" : ""}
                onClick={() => { setAddAccountTab("create"); setNewAccountError(""); }}
              >
                Crear cuenta
              </button>
              <button
                type="button"
                className={addAccountTab === "join" ? "active" : ""}
                onClick={() => { setAddAccountTab("join"); setNewAccountError(""); }}
              >
                Vincular compartida
              </button>
            </div>

            {addAccountTab === "create" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewAccountError("");
                  try {
                    const created = addProfile(newAccountName);
                    if (created?.id) {
                      saveAccountMeta(created.id, {
                        themeId: selectedCardTheme,
                        networkId: selectedCardNetwork,
                        createdDate: newAccountDate || getTodayStr(),
                      });
                    }
                    triggerHaptic();
                    setNewAccountName("");
                    setIsNewAccountOpen(false);
                  } catch (err) {
                    setNewAccountError(err.message);
                  }
                }}
              >
                <label className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "14px" }}>
                  Nombre de la cuenta
                  <input
                    required
                    autoFocus
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ej. Ahorro, Viajes, Trabajo..."
                  />
                </label>

                <label className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "16px" }}>
                  Fecha de creación
                  <input
                    type="date"
                    value={newAccountDate}
                    onChange={(e) => setNewAccountDate(e.target.value)}
                    required
                  />
                </label>

                <span className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "8px" }}>
                  Color de tarjeta
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                  {HOME_CARD_THEMES.map((t) => {
                    const isSelected = selectedCardTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedCardTheme(t.id)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--rounded-full)",
                          background: t.bg,
                          border: isSelected ? "3px solid var(--primary)" : "2px solid transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        aria-label={t.label}
                      >
                        {isSelected && <Check size={15} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>

                <span className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "8px" }}>
                  Pasarela / Red de pagos
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                  {HOME_CARD_NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedCardNetwork(net.id)}
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        border: 0,
                        fontSize: "12.5px",
                        fontWeight: 500,
                        cursor: "pointer",
                        backgroundColor: selectedCardNetwork === net.id ? "var(--primary)" : "var(--surface-soft)",
                        color: selectedCardNetwork === net.id ? "#FFFFFF" : "var(--text-main)",
                      }}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>

                {newAccountError && (
                  <p style={{ color: "var(--danger-red)", fontSize: "12px", marginBottom: "10px" }}>{newAccountError}</p>
                )}

                <button type="submit" className="nx-btn-dark" style={{ width: "100%" }}>
                  Crear cuenta <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewAccountError("");
                  try {
                    const joined = joinProfile?.(joinCode, joinName);
                    if (joined?.id) {
                      saveAccountMeta(joined.id, {
                        themeId: "cobalt",
                        networkId: "mastercard",
                        createdDate: getTodayStr(),
                      });
                    }
                    triggerHaptic();
                    setJoinCode("");
                    setJoinName("");
                    setIsNewAccountOpen(false);
                  } catch (err) {
                    setNewAccountError(err.message);
                  }
                }}
              >
                <label className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "14px" }}>
                  Código de invitación
                  <input required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="uid___default" />
                </label>
                <label className="nx-label" style={{ display: "block", color: "var(--text-mute)", marginBottom: "18px" }}>
                  Nombre para esta cuenta
                  <input required value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Ej. Gastos Casa" />
                </label>
                {newAccountError && (
                  <p style={{ color: "var(--danger-red)", fontSize: "12px", marginBottom: "10px" }}>{newAccountError}</p>
                )}
                <button type="submit" className="nx-btn-dark" style={{ width: "100%" }}>
                  Vincular cuenta <ArrowRight size={16} />
                </button>
              </form>
            )}
          </section>
        </div>,
        document.body,
      )}

      {/* MODAL DETALLE DEL MOVIMIENTO */}
      {selectedTx && createPortal(
        <div
          className="sheet-layer"
          style={{ zIndex: 10050 }}
          onMouseDown={() => setSelectedTx(null)}
        >
          <section className="bottom-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "19px", fontWeight: 600, margin: 0 }}>Detalle del movimiento</h2>
              <button type="button" className="sheet-close" onClick={() => setSelectedTx(null)}>
                <X size={17} />
              </button>
            </div>

            {(() => {
              const isExpense = selectedTx.type === "Gasto";
              const visuals = getCategoryVisuals(selectedTx.category, selectedTx.type);
              const IconComp = visuals?.icon;
              const title = (selectedTx.description || "").trim() || selectedTx.category || "Movimiento";

              return (
                <>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "18px" }}>
                    <div
                      className="nx-wtx-avatar"
                      style={{
                        width: "52px",
                        height: "52px",
                        backgroundColor: visuals?.bg || "#ECEEF2",
                        color: "#FFFFFF",
                        marginBottom: "10px",
                      }}
                    >
                      {React.isValidElement(IconComp)
                        ? React.cloneElement(IconComp, { size: 22, strokeWidth: 2.1 })
                        : typeof IconComp === "function"
                          ? <IconComp size={22} strokeWidth={2.1} />
                          : title.charAt(0).toUpperCase()}
                    </div>

                    <strong style={{ fontSize: "17px", fontWeight: 600 }}>{title}</strong>
                    <strong
                      className="privacy-sensitive"
                      style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        marginTop: "6px",
                        color: isExpense ? "#D93829" : "inherit",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {isAmountsHidden
                        ? "€••••"
                        : `${isExpense ? "- " : "+ "}${displayMoney(Math.abs(Number(selectedTx.amount) || 0))}`}
                    </strong>
                  </div>

                  <div className="nx-wh-tx-card" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: "13.5px" }}>
                      <span style={{ color: "#9CA3AF" }}>Categoría</span>
                      <span style={{ fontWeight: 500 }}>{selectedTx.category || "Sin categoría"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: "13.5px", borderTop: "1px solid #F1F3F5" }}>
                      <span style={{ color: "#9CA3AF" }}>Fecha</span>
                      <span style={{ fontWeight: 500 }}>
                        {selectedTx.time ? `${selectedTx.time} · ` : ""}{formatTxDateMeta(selectedTx.date)}
                      </span>
                    </div>
                    {selectedTx.paymentMethod && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: "13.5px", borderTop: "1px solid #F1F3F5" }}>
                        <span style={{ color: "#9CA3AF" }}>Método</span>
                        <span style={{ fontWeight: 500 }}>{selectedTx.paymentMethod}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: "13.5px", borderTop: "1px solid #F1F3F5" }}>
                      <span style={{ color: "#9CA3AF" }}>Tipo</span>
                      <span style={{ fontWeight: 500 }}>{selectedTx.type}</span>
                    </div>
                  </div>

                  {deleteTransaction && (
                    <button
                      type="button"
                      className="nx-btn-soft"
                      style={{ width: "100%", color: "var(--danger-red)", marginBottom: "8px" }}
                      onClick={() => {
                        triggerHaptic();
                        deleteTransaction(selectedTx.id);
                        setSelectedTx(null);
                      }}
                    >
                      <Trash2 size={15} /> Eliminar movimiento
                    </button>
                  )}

                  <button
                    type="button"
                    className="nx-btn-dark"
                    style={{ width: "100%" }}
                    onClick={() => setSelectedTx(null)}
                  >
                    Cerrar
                  </button>
                </>
              );
            })()}
          </section>
        </div>,
        document.body,
      )}

      <HomeThemeModal
        open={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        accountLabel={`${activeProfile?.name || "Personal"} · EUR`}
        balanceDisplay={displayMoney(walletBalance)}
        onApplied={(nextConfig) => setBgConfig(nextConfig)}
      />
    </div>
  );
};

export default HomeOverview;
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { expenseCategories, incomeCategories } from '../utils/categories';
import {
  getCategoryVisuals,
  REVOLUT_CATEGORY_PRESETS,
  setCustomCategoryPresetId,
} from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const REVOLUT_EDIT_CAT_CSS = `
  .rev-cat-modal {
    position: relative;
    width: 100%;
    max-width: 460px;
    height: 94dvh;
    max-height: 94dvh;
    display: flex;
    flex-direction: column;
    background-color: #F6F6F8;
    color: #111418;
    border-radius: 24px 24px 0 0;
    overflow: hidden;
    animation: nx-slide 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dark .rev-cat-modal {
    background-color: #000000;
    color: #FFFFFF;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .rev-cat-head {
    padding: 16px 20px 10px;
    flex-shrink: 0;
  }
  .rev-cat-x-btn {
    width: 32px;
    height: 32px;
    border: 0;
    padding: 0;
    background: transparent;
    color: #111418;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
  }
  .dark .rev-cat-x-btn {
    color: #FFFFFF;
  }
  .rev-cat-x-btn:active {
    opacity: 0.6;
  }
  .rev-cat-blue-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 0;
    padding: 4px 2px;
    background: transparent;
    color: #246BFD;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    flex-shrink: 0;
  }
  .rev-cat-blue-link:active {
    opacity: 0.7;
  }
  .rev-cat-title {
    font-size: 27px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.15;
    margin: 4px 0 12px;
  }
  .rev-cat-subhead {
    font-size: 13px;
    font-weight: 600;
    color: #1C1E24;
    margin: 14px 0 10px 2px;
  }
  .dark .rev-cat-subhead {
    color: rgba(255, 255, 255, 0.72);
  }
  .rev-cat-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 18px 28px;
    scrollbar-width: none;
  }
  .rev-cat-scroll::-webkit-scrollbar {
    display: none;
  }
  .rev-cat-card {
    background-color: #FFFFFF;
    border-radius: 18px;
    padding: 8px 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.025);
  }
  .dark .rev-cat-card {
    background-color: #141416;
    box-shadow: none;
  }
  .rev-cat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 7px 0;
  }
  .rev-cat-disc {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .rev-cat-name {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: #111418;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dark .rev-cat-name {
    color: #FFFFFF;
  }
  .rev-cat-preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0 4px;
  }
  .rev-cat-preset-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 2px solid transparent;
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s ease;
  }
  .rev-cat-preset-btn.active {
    transform: scale(1.12);
    box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #246BFD;
  }
  .dark .rev-cat-preset-btn.active {
    box-shadow: 0 0 0 2px #141416, 0 0 0 4px #246BFD;
  }
  .rev-cat-limit-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    margin: 2px 0 8px;
    border-radius: 12px;
    background-color: #F6F6F8;
  }
  .dark .rev-cat-limit-box {
    background-color: #1E1E22;
  }
  .rev-cat-limit-input {
    width: 96px;
    height: 34px;
    margin: 0;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid rgba(17, 20, 24, 0.12);
    background-color: #FFFFFF;
    color: #111418;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    text-align: right;
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .dark .rev-cat-limit-input {
    border-color: rgba(255, 255, 255, 0.14);
    background-color: #141416;
    color: #FFFFFF;
  }
  .rev-cat-footer {
    padding: 12px 18px calc(16px + env(safe-area-inset-bottom, 0px));
    background-color: #F6F6F8;
    flex-shrink: 0;
  }
  .dark .rev-cat-footer {
    background-color: #000000;
  }
`;

const CategoryLimitsForm = ({ onClose }) => {
  const {
    monthlyCategoryCaps,
    setMonthlyCategoryCaps,
    previousMonthCategoryCaps,
    customCategories,
    allCategories,
    addCategory,
    deleteCategory,
    activeProfileId,
  } = useFinance();

  const [activeType, setActiveType] = useState('Gasto');
  const [newCat, setNewCat] = useState('');
  const [newPresetId, setNewPresetId] = useState(REVOLUT_CATEGORY_PRESETS[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [, setStyleVersion] = useState(0);
  const [formError, setFormError] = useState('');

  const storageLimitsKey = `balance-category-limits-${activeProfileId || 'default'}`;

  const [limitsValues, setLimitsValues] = useState(() => {
    try {
      const savedLimits = JSON.parse(localStorage.getItem(storageLimitsKey) || '{}');
      return { ...savedLimits, ...(monthlyCategoryCaps || {}) };
    } catch {
      return monthlyCategoryCaps || {};
    }
  });

  const customList = useMemo(
    () => (Array.isArray(customCategories?.[activeType]) ? customCategories[activeType] : []),
    [customCategories, activeType],
  );

  const defaultList = useMemo(() => {
    const base = activeType === 'Gasto' ? expenseCategories : incomeCategories;
    const extra = (allCategories?.[activeType] || []).filter((c) => !customList.includes(c));
    return Array.from(new Set([...base, ...extra]));
  }, [activeType, allCategories, customList]);

  const hasPreviousCaps = previousMonthCategoryCaps && Object.keys(previousMonthCategoryCaps).length > 0;

  const handleAddCategory = () => {
    setFormError('');
    const trimmed = newCat.trim();
    if (!trimmed) return;
    try {
      const createdName = addCategory(activeType, trimmed);
      setCustomCategoryPresetId(createdName, newPresetId);
      setStyleVersion((v) => v + 1);
      triggerHaptic();
      setNewCat('');
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const finalLimits = {};
    [...customList, ...defaultList].forEach((cat) => {
      const val = Number(limitsValues[cat]);
      if (val > 0) finalLimits[cat] = val;
    });
    try {
      localStorage.setItem(storageLimitsKey, JSON.stringify(finalLimits));
    } catch {}
    setMonthlyCategoryCaps?.(finalLimits);
    triggerHaptic();
    onClose();
  };

  const formatCap = (val) => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(val) ? 0 : 2,
  }).format(val);

  const renderCategoryRow = (cat, isCustom) => {
    const visuals = getCategoryVisuals(cat, activeType, 17);
    const limit = activeType === 'Gasto' ? (Number(limitsValues[cat]) || 0) : 0;
    const isExpanded = expandedCat === cat;

    return (
      <div key={cat}>
        <div
          className="rev-cat-row"
          onClick={() => {
            if (!isCustom && activeType === 'Gasto') {
              triggerHaptic();
              setExpandedCat(isExpanded ? null : cat);
            }
          }}
          style={{ cursor: !isCustom && activeType === 'Gasto' ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
            <span className="rev-cat-disc" style={{ backgroundColor: visuals.bg }}>
              {visuals.icon}
            </span>
            <span className="rev-cat-name">{cat}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {limit > 0 && !isCustom && (
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
                {formatCap(limit)}
              </span>
            )}

            {isCustom && (
              <button
                type="button"
                className="rev-cat-blue-link"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic();
                  setExpandedCat(isExpanded ? null : cat);
                }}
              >
                <Pencil size={13} strokeWidth={2.2} />
                <span>{isExpanded ? 'Listo' : 'Editar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* PANEL DESPLEGABLE LIMPIO AL TOCAR EDITAR O UN TOPE */}
        {isExpanded && (
          <div className="rev-cat-limit-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
            {isCustom && (
              <div>
                <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
                  Icono y color
                </span>
                <div className="rev-cat-preset-grid">
                  {REVOLUT_CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`rev-cat-preset-btn ${visuals.presetId === preset.id ? 'active' : ''}`}
                      style={{ backgroundColor: preset.bg }}
                      onClick={() => {
                        triggerHaptic();
                        setCustomCategoryPresetId(cat, preset.id);
                        setStyleVersion((v) => v + 1);
                      }}
                      aria-label={preset.label}
                    >
                      {preset.renderIcon(16)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeType === 'Gasto' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B7280' }}>
                  Tope mensual (€)
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  className="rev-cat-limit-input"
                  value={limitsValues[cat] ?? ''}
                  onChange={(e) => setLimitsValues((prev) => ({ ...prev, [cat]: e.target.value }))}
                  placeholder="Sin tope"
                />
              </div>
            )}

            {isCustom && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      deleteCategory(activeType, cat);
                      setCustomCategoryPresetId(cat, null);
                      setExpandedCat(null);
                      triggerHaptic();
                    } catch (err) {
                      setFormError(err.message);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '4px 0',
                    color: '#DE5448',
                    fontFamily: 'inherit',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} /> Eliminar categoría
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={onClose}>
      <style>{REVOLUT_EDIT_CAT_CSS}</style>

      <section
        className="rev-cat-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Editar categorías"
      >
        {/* CABECERA IDÉNTICA A REVOLUT */}
        <div className="rev-cat-head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="rev-cat-x-btn" onClick={onClose} aria-label="Cerrar">
              <X size={20} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              className="rev-cat-blue-link"
              onClick={() => {
                triggerHaptic();
                setFormError('');
                setShowAddForm((v) => !v);
              }}
            >
              <Plus size={15} strokeWidth={2.3} />
              <span>Añadir</span>
            </button>
          </div>

          <h1 className="rev-cat-title">Editar categorías</h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div className="record-tabs">
              <button
                type="button"
                className={activeType === 'Gasto' ? 'active' : ''}
                onClick={() => {
                  setActiveType('Gasto');
                  setExpandedCat(null);
                }}
              >
                Gastos
              </button>
              <button
                type="button"
                className={activeType === 'Ingreso' ? 'active' : ''}
                onClick={() => {
                  setActiveType('Ingreso');
                  setExpandedCat(null);
                }}
              >
                Ingresos
              </button>
            </div>

            {activeType === 'Gasto' && hasPreviousCaps && (
              <button
                type="button"
                className="rev-cat-blue-link"
                onClick={() => {
                  triggerHaptic();
                  setLimitsValues((prev) => ({ ...prev, ...previousMonthCategoryCaps }));
                }}
              >
                <Copy size={13} />
                <span>Copiar mes ant.</span>
              </button>
            )}
          </div>
        </div>

        {/* LISTA DE CATEGORÍAS */}
        <form id="rev-edit-categories-form" onSubmit={handleSave} className="rev-cat-scroll">
          {showAddForm && (
            <div className="rev-cat-card" style={{ padding: '14px 16px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder={`Nueva categoría de ${activeType.toLowerCase()}...`}
                  style={{
                    flex: 1,
                    height: '40px',
                    margin: 0,
                    padding: '0 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(17, 20, 24, 0.12)',
                    backgroundColor: '#F6F6F8',
                    color: '#111418',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '999px',
                    border: 0,
                    backgroundColor: '#246BFD',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Crear
                </button>
              </div>

              <div className="rev-cat-preset-grid">
                {REVOLUT_CATEGORY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`rev-cat-preset-btn ${newPresetId === preset.id ? 'active' : ''}`}
                    style={{ backgroundColor: preset.bg }}
                    onClick={() => setNewPresetId(preset.id)}
                    aria-label={preset.label}
                  >
                    {preset.renderIcon(16)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <p style={{ color: '#DE5448', fontSize: '12.5px', fontWeight: 500, margin: '8px 2px 0' }}>
              {formError}
            </p>
          )}

          {/* SECCIÓN: CATEGORÍAS PERSONALIZADAS */}
          <p className="rev-cat-subhead">Categorías personalizadas</p>
          <div className="rev-cat-card">
            {customList.length > 0 ? (
              customList.map((cat) => renderCategoryRow(cat, true))
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rev-cat-row"
                style={{ width: '100%', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="rev-cat-disc" style={{ backgroundColor: '#4B89DC' }}>
                    <Plus size={18} strokeWidth={2.3} />
                  </span>
                  <span className="rev-cat-name" style={{ color: '#246BFD' }}>
                    Crear categoría personalizada
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* SECCIÓN: CATEGORÍAS POR DEFECTO */}
          <p className="rev-cat-subhead">Categorías por defecto</p>
          <div className="rev-cat-card">
            {defaultList.map((cat) => renderCategoryRow(cat, false))}
          </div>
        </form>

        {/* BOTÓN GUARDAR CAMBIOS */}
        <div className="rev-cat-footer">
          <button type="submit" form="rev-edit-categories-form" className="nx-btn-dark" style={{ width: '100%' }}>
            <Check size={16} strokeWidth={2.3} /> Guardar cambios
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default CategoryLimitsForm;
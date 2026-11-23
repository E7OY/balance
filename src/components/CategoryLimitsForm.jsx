import React, { useState, useMemo } from 'react';
import { Copy, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { expenseCategories, incomeCategories } from '../utils/categories';
import { getCategoryVisuals } from './TransactionItem';
import { triggerHaptic } from '../utils/haptics';

const CategoryLimitsForm = ({ onClose }) => {
  const {
    transactions,
    filters,
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
  const [showAddInput, setShowAddInput] = useState(false);
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

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const monthlyTotals = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === activeType && typeof tx.date === 'string' && tx.date.startsWith(monthPrefix))
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + (Number(tx.amount) || 0);
      });
    return map;
  }, [transactions, activeType, monthPrefix]);

  const hasPreviousCaps = previousMonthCategoryCaps && Object.keys(previousMonthCategoryCaps).length > 0;

  const handleAddCategory = () => {
    setFormError('');
    const trimmed = newCat.trim();
    if (!trimmed) return;
    try {
      addCategory(activeType, trimmed);
      triggerHaptic();
      setNewCat('');
      setShowAddInput(false);
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

  const displayMoney = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const renderCategoryRow = (cat, isCustom, isLast) => {
    const visuals = getCategoryVisuals(cat, activeType, 17);
    const spent = monthlyTotals[cat] || 0;
    const limit = activeType === 'Gasto' ? (Number(limitsValues[cat]) || 0) : 0;

    return (
      <div
        key={cat}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 0',
          borderBottom: isLast ? 'none' : '1px solid var(--rev-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <span style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: visuals.bg,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {visuals.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--rev-text)' }}>
              {cat}
            </strong>
            <small style={{ display: 'block', fontSize: '11px', color: 'var(--rev-muted)' }}>
              {displayMoney(spent)} {activeType === 'Gasto' ? 'gastados' : 'recibidos'}
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeType === 'Gasto' && (
            <div style={{ position: 'relative', width: '88px' }}>
              <input
                type="number"
                min="0"
                step="1"
                value={limitsValues[cat] ?? ''}
                onChange={(e) => setLimitsValues((prev) => ({ ...prev, [cat]: e.target.value }))}
                placeholder="Tope"
                style={{
                  margin: 0,
                  height: '36px',
                  paddingRight: '20px',
                  textAlign: 'right',
                  fontSize: '13px',
                  background: 'var(--rev-bg)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 700, color: 'var(--rev-muted)' }}>
                €
              </span>
            </div>
          )}

          {isCustom && (
            <button
              type="button"
              onClick={() => {
                try {
                  deleteCategory(activeType, cat);
                  triggerHaptic();
                } catch (err) {
                  setFormError(err.message);
                }
              }}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--rev-blue)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Borrar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="sheet-layer" style={{ zIndex: 110 }} onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        style={{ minHeight: '88dvh'}}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddInput((v) => !v)}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--rev-blue)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Añadir categoría
          </button>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
          Editar categorías
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
          <div className="record-tabs">
            <button type="button" className={activeType === 'Gasto' ? 'active' : ''} onClick={() => setActiveType('Gasto')}>
              Gastos
            </button>
            <button type="button" className={activeType === 'Ingreso' ? 'active' : ''} onClick={() => setActiveType('Ingreso')}>
              Ingresos
            </button>
          </div>

          {activeType === 'Gasto' && hasPreviousCaps && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setLimitsValues((prev) => ({ ...prev, ...previousMonthCategoryCaps }));
              }}
              style={{
                background: 'var(--rev-blue-soft)',
                color: 'var(--rev-blue)',
                border: 0,
                borderRadius: '999px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Copy size={12} /> Copiar mes ant.
            </button>
          )}
        </div>

        {showAddInput && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder={`Nombre de categoría de ${activeType.toLowerCase()}...`}
              style={{ margin: 0, flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCategory}
              style={{
                height: '46px',
                padding: '0 16px',
                borderRadius: '14px',
                border: 0,
                background: 'var(--rev-blue)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Crear
            </button>
          </div>
        )}

        {formError && (
          <p style={{ color: 'var(--rev-red)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
            {formError}
          </p>
        )}

        <form onSubmit={handleSave}>
          {/* SECCIÓN: CATEGORÍAS PERSONALIZADAS */}
          {customList.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', margin: '0 0 8px 4px' }}>
                Categorías personalizadas
              </p>
              <div style={{
                background: 'var(--rev-card)',
                borderRadius: '18px',
                padding: '2px 14px',
                border: '1px solid var(--rev-border)',
                boxShadow: 'var(--rev-shadow)',
              }}>
                {customList.map((cat, idx) => renderCategoryRow(cat, true, idx === customList.length - 1))}
              </div>
            </div>
          )}

          {/* SECCIÓN: CATEGORÍAS POR DEFECTO */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rev-muted)', margin: '0 0 8px 4px' }}>
              Categorías por defecto
            </p>
            <div style={{
              background: 'var(--rev-card)',
              borderRadius: '18px',
              padding: '2px 14px',
              border: '1px solid var(--rev-border)',
              boxShadow: 'var(--rev-shadow)',
            }}>
              {defaultList.map((cat, idx) => renderCategoryRow(cat, false, idx === defaultList.length - 1))}
            </div>
          </div>

          <button type="submit" className="sheet-submit">
            Guardar cambios
          </button>
        </form>
      </section>
    </div>
  );
};

export default CategoryLimitsForm;
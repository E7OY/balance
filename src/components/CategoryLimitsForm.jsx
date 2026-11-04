import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { triggerHaptic } from '../utils/haptics';

function Icon({ name, size = 17 }) {
  const paths = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Comida', 'Alquiler/Hipoteca', 'Transporte', 'Ocio', 'Suscripciones', 'Mascotas', 'Salud', 'Ropa', 'Hogar', 'Viajes', 'Regalos', 'Inversiones', 'Deudas', 'Otros'
];


const CategoryLimitsForm = ({ onClose }) => {
  const { 
    transactions, 
    filters, 
    categoryLimits, 
    setCategoryLimits,
    allCategories,
    setAllCategories,
    activeProfileId 
  } = useFinance();

  const storageLimitsKey = `balance-category-limits-${activeProfileId || 'default'}`;
  const storageCatsKey = `balance-custom-categories-${activeProfileId || 'default'}`;

  // 1. Cargamos categorías guardadas en localStorage + contexto + defaults
  const [localCategories, setLocalCategories] = useState(() => {
    try {
      const savedCats = JSON.parse(localStorage.getItem(storageCatsKey) || '[]');
      const savedLimits = JSON.parse(localStorage.getItem(storageLimitsKey) || '{}');
      const fromContext = allCategories?.Gasto || [];
      const fromLimits = Object.keys(categoryLimits || {});
      const fromTx = transactions.filter(t => t.type === 'Gasto').map(t => t.category);
      return Array.from(new Set([
        ...DEFAULT_EXPENSE_CATEGORIES,
        ...savedCats,
        ...fromContext,
        ...fromLimits,
        ...Object.keys(savedLimits),
        ...fromTx
      ]));
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  // 2. Cargamos los límites en un estado reactivo (clave-valor)
  const [limitsValues, setLimitsValues] = useState(() => {
    try {
      const savedLimits = JSON.parse(localStorage.getItem(storageLimitsKey) || '{}');
      return { ...savedLimits, ...(categoryLimits || {}) };
    } catch {
      return categoryLimits || {};
    }
  });

  const [newCat, setNewCat] = useState('');

  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const monthlyExpenses = useMemo(() => 
    transactions.filter(tx => tx.type === 'Gasto' && typeof tx.date === 'string' && tx.date.startsWith(monthPrefix)),
  [transactions, monthPrefix]);

  const handleInputChange = (cat, val) => {
    setLimitsValues(prev => ({
      ...prev,
      [cat]: val
    }));
  };

  const handleAddCategory = () => {
    const catName = newCat.trim();
    if (!catName) return;
    
    if (!localCategories.includes(catName)) {
      const updatedCats = [catName, ...localCategories];
      setLocalCategories(updatedCats);
      
      // Guardar de inmediato en localStorage
      try {
        localStorage.setItem(storageCatsKey, JSON.stringify(updatedCats));
      } catch (e) {
        console.error(e);
      }

      if (setAllCategories) {
        setAllCategories(prev => ({
          ...prev,
          Gasto: updatedCats
        }));
      }
    }
    setNewCat('');
  };

  const handleSaveLimits = (e) => {
    e.preventDefault();
    
    // Normalizar números y filtrar vacíos o 0
    const finalLimits = {};
    localCategories.forEach(cat => {
      const val = Number(limitsValues[cat]);
      if (val > 0) finalLimits[cat] = val;
    });

    // 1. Guardar en localStorage persistente
    try {
      localStorage.setItem(storageLimitsKey, JSON.stringify(finalLimits));
      localStorage.setItem(storageCatsKey, JSON.stringify(localCategories));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }

    // 2. Guardar en el Contexto de la app
    if (setCategoryLimits) {
      setCategoryLimits(finalLimits);
    }
    if (setAllCategories) {
      setAllCategories(prev => ({
        ...prev,
        Gasto: localCategories
      }));
    }

    triggerHaptic();
    onClose();
  };

  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  return (
    <div className="sheet-layer" style={{ zIndex: 80 }} onMouseDown={onClose}>
      <section 
        className="bottom-sheet limits-sheet" 
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-icon limits">%</div>
        
        <h2 id="limits-title">Topes por categoría</h2>
        <p>Define cuánto quieres gastar como máximo o añade nuevas categorías.</p>

        {/* Añadir nueva categoría */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
          <input 
            type="text" 
            value={newCat} 
            onChange={(e) => setNewCat(e.target.value)} 
            placeholder="Añadir nueva categoría..." 
            style={{ flex: 1, margin: 0 }}
          />
          <button 
            type="button" 
            onClick={handleAddCategory}
            className="sheet-submit limits-submit"
            style={{ width: 'auto', height: '50px', margin: 0, padding: '0 16px', fontSize: '12px', background: '#090909' }}
          >
            Añadir
          </button>
        </div>

        <form onSubmit={handleSaveLimits}>
          <div className="limits-list">
            {localCategories.map(cat => {
              const currentLimit = Number(limitsValues[cat]) || 0;
              const spent = monthlyExpenses
                .filter(tx => tx.category === cat)
                .reduce((sum, tx) => sum + Number(tx.amount), 0);
              
              const percent = currentLimit > 0 ? Math.min(100, Math.round((spent / currentLimit) * 100)) : 0;

              return (
                <label className="limit-row" key={cat}>
                  <span>
                    <strong>{cat}</strong>
                    <small>
                      {displayMoney(spent)} gastados {currentLimit > 0 ? `· ${percent}%` : ''}
                    </small>
                  </span>
                  <span className="limit-input">
                    <input
                      name={cat}
                      type="number"
                      min="0"
                      step="1"
                      value={limitsValues[cat] ?? ''}
                      onChange={(e) => handleInputChange(cat, e.target.value)}
                      placeholder="0"
                    />
                    <i>€</i>
                  </span>
                </label>
              );
            })}
          </div>
          <button className="sheet-submit limits-submit" style={{ marginTop: '20px', background: '#090909' }} type="submit">
            Guardar
            <Icon name="arrow" size={16} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default CategoryLimitsForm;
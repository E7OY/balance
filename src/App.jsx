import React, { useEffect, useState, useRef } from 'react';
import { useFinance } from './context/FinanceContext';
import HomeOverview from './components/HomeOverview';
import MovementsView from './components/MovementsView';
import InvestmentsOverview from './components/InvestmentsOverview';
import TransactionForm from './components/TransactionForm';
import InvestmentForm from './components/InvestmentForm';
import ProfileSwitcher from './components/ProfileSwitcher';
import CategoryLimitsForm from './components/CategoryLimitsForm';
import { triggerHaptic } from './utils/haptics';
import { getFromLocalStorage, saveToLocalStorage } from './utils/localStorage';

const homeTabs = ['expenses', 'investments', 'movements'];
const getPreferredHomeTab = (profileId) => {
  const savedTab = getFromLocalStorage(`finance:${profileId}:defaultHomeTab`);
  return homeTabs.includes(savedTab) ? savedTab : 'expenses';
};
const getInvestmentsEnabled = (profileId) => (
  getFromLocalStorage(`finance:${profileId}:showInvestments`) === true
);

function Icon({ name, size = 17 }) {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.6" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const App = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    editingTransaction,
    setEditingTransaction,
    activeProfile,
    activeProfileId,
    setFilters
  } = useFinance();

  const [activeTab, setActiveTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [defaultHomeTab, setDefaultHomeTab] = useState(() => getPreferredHomeTab(activeProfileId));
  const [investmentsEnabled, setInvestmentsEnabled] = useState(() => getInvestmentsEnabled(activeProfileId));
  const [transactionType, setTransactionType] = useState('expense');
  const [theme, setTheme] = useState(() => localStorage.getItem('balance-theme') || 'dark');
  
  // ESTADOS GLOBALES
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const monthSwipeStart = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('balance-theme', theme);
  }, [theme]);

  useEffect(() => {
    const showInvestments = getInvestmentsEnabled(activeProfileId);
    const savedPreferredTab = getPreferredHomeTab(activeProfileId);
    const preferredTab = !showInvestments && savedPreferredTab === 'investments'
      ? 'expenses'
      : savedPreferredTab;
    if (preferredTab !== savedPreferredTab) {
      saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, preferredTab);
    }
    setInvestmentsEnabled(showInvestments);
    setActiveTab(preferredTab);
    setDefaultHomeTab(preferredTab);
    setQuery('');
    setSearchOpen(false);
  }, [activeProfileId]);

  const handleDefaultHomeTabChange = (tab) => {
    if (!homeTabs.includes(tab) || (tab === 'investments' && !investmentsEnabled)) return;
    saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, tab);
    setDefaultHomeTab(tab);
    setActiveTab(tab);
    setQuery('');
    setSearchOpen(false);
  };

  const handleInvestmentsVisibilityChange = (enabled) => {
    saveToLocalStorage(`finance:${activeProfileId}:showInvestments`, enabled);
    setInvestmentsEnabled(enabled);
    if (!enabled) {
      if (defaultHomeTab === 'investments') {
        saveToLocalStorage(`finance:${activeProfileId}:defaultHomeTab`, 'expenses');
        setDefaultHomeTab('expenses');
      }
      if (activeTab === 'investments') setActiveTab('expenses');
    }
  };

  const initials = (activeProfile?.name || 'US').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setQuery('');
    setSearchOpen(false);
  };

  const openForm = (type) => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  // --- LÓGICA DE DESLIZAR PARA CAMBIAR MES ---
  const handleTouchStart = (event) => {
    if ((activeTab !== 'expenses' && activeTab !== 'movements') || event.touches.length !== 1) {
      monthSwipeStart.current = null;
      return;
    }
    if (event.target.closest?.('button, input, select, textarea, a, [role="dialog"], [data-month-swipe-ignore]')) {
      monthSwipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    monthSwipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = monthSwipeStart.current;
    monthSwipeStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;

    const monthOffset = deltaX < 0 ? 1 : -1;
    setFilters((previous) => {
      const nextMonth = new Date(previous.year, previous.month + monthOffset, 1);
      return { ...previous, month: nextMonth.getMonth(), year: nextMonth.getFullYear() };
    });
    triggerHaptic(); 
  };

  return (
    <div className={`stage ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="phone">
        <main 
          className="screen-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => { monthSwipeStart.current = null; }}
        >
          <header className="app-header">
            <div className="tabs">
              <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => handleTabChange('expenses')}>
                Gastos
              </button>
              <button className={activeTab === 'movements' ? 'active' : ''} onClick={() => handleTabChange('movements')}>
                Movimientos
              </button>
              {investmentsEnabled && (
                <button className={activeTab === 'investments' ? 'active' : ''} onClick={() => handleTabChange('investments')}>
                  Inversiones
                </button>
              )}
            </div>
            <button className="avatar-button" onClick={() => setIsProfileOpen(true)}>
              {initials}
            </button>
          </header>

          {/* BARRA DE BÚSQUEDA GLOBAL */}
          {searchOpen && (
            <div className="search-bar">
              <Icon name="search" size={15} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar..."
              />
              <button onClick={() => setSearchOpen(false)}>
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {activeTab === 'expenses' && <HomeOverview query={query} onOpenLimits={() => setIsLimitsOpen(true)} />}
          {activeTab === 'movements' && <MovementsView query={query} />}
          {activeTab === 'investments' && <InvestmentsOverview query={query} />}
        </main>

        <div className="bottom-actions">
          {activeTab === 'movements' ? (
            <>
              <button onClick={() => openForm('expense')}>
                Gasto <span className="action-symbol">−</span>
              </button>
              <button onClick={() => openForm('income')}>
                Ingreso <span className="action-symbol">+</span>
              </button>
            </>
          ) : activeTab === 'investments' ? (
            <>
              <button onClick={() => setSearchOpen(true)}>
                Buscar <Icon name="search" size={16} />
              </button>
              <button onClick={() => setIsInvestmentFormOpen(true)}>
                Invertir <Icon name="arrow" size={16} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)}>
                Buscar <Icon name="search" size={16} />
              </button>
              <button onClick={() => openForm('expense')}>
                Añadir <Icon name="arrow" size={16} />
              </button>
            </>
          )}
        </div>
        
        {/* MODALES INDEPENDIENTES DE PANTALLA COMPLETA */}
        {isProfileOpen && (
          <ProfileSwitcher
            theme={theme}
            setTheme={setTheme}
            defaultHomeTab={defaultHomeTab}
            onDefaultHomeTabChange={handleDefaultHomeTabChange}
            investmentsEnabled={investmentsEnabled}
            onInvestmentsVisibilityChange={handleInvestmentsVisibilityChange}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
        
        {isLimitsOpen && (
          <CategoryLimitsForm onClose={() => setIsLimitsOpen(false)} />
        )}
        {isInvestmentFormOpen && (
          <InvestmentForm onClose={() => setIsInvestmentFormOpen(false)} />
        )}
      </div>

      {/* FORMULARIO DE AÑADIR/EDITAR */}
      {(isModalOpen || editingTransaction) && (
        <TransactionForm
          key={editingTransaction?.id || 'new'}
          transaction={editingTransaction}
          defaultType={transactionType}
          onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        />
      )}
    </div>
  );
};

export default App;
import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month, 1)),
);

const Filters = ({ isMobileFiltersOpen, onCloseMobileFilters }) => {
  const { filters, setFilters, allCategories, transactions } = useFinance();
  const touchStart = useRef(null);
  const availableYears = useMemo(() => {
    const years = transactions.map((transaction) => Number(transaction.date.slice(0, 4)));
    return [...new Set([filters.year, ...years])].sort((a, b) => b - a);
  }, [transactions, filters.year]);

  const changeMonth = (offset) => {
    const next = new Date(filters.year, filters.month + offset, 1);
    setFilters((previous) => ({
      ...previous,
      month: next.getMonth(),
      year: next.getFullYear(),
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({
      ...previous,
      [name]: name === 'year' ? Number(value) : value,
      ...(name === 'type' ? { category: 'Todas' } : {}),
    }));
  };

  const categoriesForType = filters.type === 'Ingreso'
    ? allCategories.Ingreso
    : filters.type === 'Gasto'
      ? allCategories.Gasto
      : allCategories.Todas;

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseMobileFilters();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFiltersOpen, onCloseMobileFilters]);

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1 || event.currentTarget.scrollTop > 0) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    if (touch.clientY - start.y > 80 && Math.abs(touch.clientX - start.x) < 60) {
      onCloseMobileFilters();
    }
  };

  return (
    <>
    {isMobileFiltersOpen && (
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md md:hidden"
        aria-hidden="true"
        onClick={onCloseMobileFilters}
      />
    )}
    <section
      id="transaction-filters"
      role={isMobileFiltersOpen ? 'dialog' : undefined}
      aria-modal={isMobileFiltersOpen ? true : undefined}
      aria-label="Seleccionar mes y filtrar movimientos"
      className={`${isMobileFiltersOpen ? 'fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[61] flex max-h-[min(75dvh,34rem)] overflow-y-auto rounded-t-3xl rounded-b-2xl border border-neutral-200/70 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 md:static md:max-h-none md:overflow-visible md:rounded-xl md:border-0 md:p-3 md:shadow-none' : 'hidden'} flex-col gap-2 transition-colors dark:text-white sm:gap-3 md:flex md:flex-row md:items-center md:justify-between`}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { touchStart.current = null; }}
    >
      <div className="mb-1 flex items-center justify-center md:hidden">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Filtros</h2>
      </div>
      <div className="hidden items-center gap-1 md:flex md:gap-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:size-9"
        >
          <ChevronLeft size={18} />
        </button>
        <label className="sr-only" htmlFor="month">Mes</label>
        <select
          id="month"
          name="month"
          value={filters.month}
          onChange={(event) => setFilters((previous) => ({ ...previous, month: Number(event.target.value) }))}
          className="h-8 min-w-0 flex-1 rounded-md border-0 bg-transparent px-1 text-sm font-medium capitalize text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-100 sm:h-9 sm:min-w-32 sm:flex-none sm:px-2"
        >
          {monthNames.map((month, index) => (
            <option key={month} value={index}>{month}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="year">Año</label>
        <select
          id="year"
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          className="h-8 rounded-md border-0 bg-transparent px-1 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-100 sm:h-9 sm:px-2"
        >
          {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:size-9"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} grid-cols-2 gap-1.5 md:flex md:items-center md:gap-2`}
      >
        <div className="col-span-2 flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
          <label className="sr-only" htmlFor="mobile-month">Mes</label>
          <select
            id="mobile-month"
            name="month"
            value={filters.month}
            onChange={(event) => setFilters((previous) => ({ ...previous, month: Number(event.target.value) }))}
            className="h-8 min-w-0 flex-1 rounded-md border-0 bg-transparent px-1 text-sm font-medium capitalize text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-100"
          >
            {monthNames.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mobile-year">Año</label>
          <select
            id="mobile-year"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="h-8 rounded-md border-0 bg-transparent px-1 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-100"
          >
            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <label className="relative col-span-2 block sm:col-span-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <span className="sr-only">Buscar movimiento</span>
          <input
            type="search"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Buscar movimiento..."
            className="h-8 w-full rounded-md border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 md:h-9 md:w-48 md:pr-3"
          />
        </label>
        <label className="sr-only" htmlFor="type">Tipo de movimiento</label>
        <select
          id="type"
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="h-8 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-9 sm:px-3"
        >
          <option value="Todos">Todos</option>
          <option value="Ingreso">Ingresos</option>
          <option value="Gasto">Gastos</option>
        </select>
        <label className="sr-only" htmlFor="category">Categoría</label>
        <select
          id="category"
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="h-8 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-9 sm:px-3"
        >
          <option value="Todas">Todas las categorías</option>
          {categoriesForType.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
    </section>
    </>
  );
};

export default Filters;

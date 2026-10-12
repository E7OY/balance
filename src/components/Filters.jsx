import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Filter, Search } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month, 1)),
);

const Filters = () => {
  const { filters, setFilters, allCategories, transactions } = useFinance();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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
  const activeFilterCount = [
    filters.searchTerm.trim().length > 0,
    filters.type !== 'Todos',
    filters.category !== 'Todas',
  ].filter(Boolean).length;

  return (
    <section aria-label="Seleccionar mes y filtrar movimientos" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 sm:gap-3 sm:p-3 sm:flex-row sm:items-center sm:justify-between">
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

      <button
        type="button"
        aria-expanded={isMobileFiltersOpen}
        aria-controls="transaction-filters"
        onClick={() => setIsMobileFiltersOpen((isOpen) => !isOpen)}
        className="inline-flex h-9 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 md:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <Filter size={15} aria-hidden="true" />
          Mes y filtros
          {activeFilterCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              {activeFilterCount}
            </span>
          )}
        </span>
        {isMobileFiltersOpen
          ? <ChevronUp size={16} aria-hidden="true" />
          : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      <div
        id="transaction-filters"
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
  );
};

export default Filters;

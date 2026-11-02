import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Filter, List } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Filters from './Filters';
import TransactionItem from './TransactionItem';
import TransactionList from './TransactionList';
import { Card } from './ui/card';

const weekDays = Array.from({ length: 7 }, (_, index) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(new Date(2024, 0, index + 1)),
);

const MovementsView = ({ isMobileFiltersOpen, onMobileFiltersOpenChange }) => {
  const { filters, setFilters, filteredTransactions } = useFinance();
  const [mode, setMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState('');
  const monthStart = new Date(filters.year, filters.month, 1);
  const dayCount = new Date(filters.year, filters.month + 1, 0).getDate();
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const transactionsByDate = useMemo(() => filteredTransactions.reduce((byDate, transaction) => {
    if (!Array.isArray(byDate[transaction.date])) byDate[transaction.date] = [];
    byDate[transaction.date].push(transaction);
    return byDate;
  }, {}), [filteredTransactions]);
  const selectedTransactions = transactionsByDate[selectedDate] || [];
  const selectedTotal = selectedTransactions.reduce((sum, transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'Ingreso') return sum + amount;
    if (transaction.type === 'Gasto') return sum - amount;
    return sum;
  }, 0);

  useEffect(() => {
    const today = new Date();
    const defaultDay = today.getFullYear() === filters.year && today.getMonth() === filters.month
      ? today.getDate()
      : 1;
    setSelectedDate(`${filters.year}-${String(filters.month + 1).padStart(2, '0')}-${String(defaultDay).padStart(2, '0')}`);
  }, [filters.year, filters.month]);

  const changeMonth = (offset) => {
    setFilters((previous) => {
      const next = new Date(previous.year, previous.month + offset, 1);
      return { ...previous, year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
        <div>
          <p className="mt-0.5 text-sm text-zinc-400">Consulta y organiza tus registros.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="group" aria-label="Modo de movimientos">
            <button
              type="button"
              onClick={() => setMode('list')}
              aria-pressed={mode === 'list'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ${mode === 'list' ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1C1C1C] dark:text-white' : 'text-slate-500 dark:text-white'}`}
            >
              <List size={16} aria-hidden="true" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setMode('calendar')}
              aria-pressed={mode === 'calendar'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ${mode === 'calendar' ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1C1C1C] dark:text-white' : 'text-slate-500 dark:text-white'}`}
            >
              <CalendarDays size={16} aria-hidden="true" />
              Calendario
            </button>
          </div>
          <button
            type="button"
            onClick={() => onMobileFiltersOpenChange((isOpen) => !isOpen)}
            aria-label="Abrir filtros de movimientos"
            aria-expanded={isMobileFiltersOpen}
            className="inline-flex size-10 items-center justify-center rounded-xl  text-slate-700 hover:bg-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            <Filter size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Filters
        isMobileFiltersOpen={isMobileFiltersOpen}
        onCloseMobileFilters={() => onMobileFiltersOpenChange(false)}
      />

      {mode === 'list' ? (
        <TransactionList />
      ) : (
        <>
          <Card as="section" aria-label="Calendario mensual de movimientos" className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <h3 className="text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
                {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(monthStart)}
              </h3>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map((day) => (
                <span key={day} className="pb-1 text-center text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                  {day}
                </span>
              ))}
              {Array.from({ length: firstDayOffset }, (_, index) => (
                <span key={`empty-${index}`} aria-hidden="true" />
              ))}
              {Array.from({ length: dayCount }, (_, index) => {
                const day = index + 1;
                const date = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTransactions = transactionsByDate[date] || [];
                const dayExpenses = dayTransactions.reduce((sum, transaction) => (
                  sum + (transaction.type === 'Gasto' ? Number(transaction.amount) || 0 : 0)
                ), 0);
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    aria-label={`${day} de ${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(monthStart)}${dayTransactions.length ? `, ${dayTransactions.length} movimientos, gastos ${formatCurrency(dayExpenses)}` : ', sin movimientos'}`}
                    aria-pressed={isSelected}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors sm:min-h-[4.5rem] ${isSelected ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-transparent text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'} ${dayTransactions.length ? '' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    <span>{day}</span>
                    {dayTransactions.length > 0 && (
                      <span className={`privacy-sensitive max-w-full truncate text-[9px] sm:text-[10px] ${isSelected ? 'text-white/75 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatCurrency(dayExpenses)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card as="section" data-phantom-surface aria-labelledby="selected-day-title" className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-1 py-4">
              <div>
                <h3 id="selected-day-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDate ? formatDate(selectedDate) : 'Movimientos del día'}
                </h3>
                <p className="privacy-sensitive mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {selectedTransactions.length} {selectedTransactions.length === 1 ? 'movimiento' : 'movimientos'}
                  {selectedTransactions.length > 0 ? ` · ${formatCurrency(selectedTotal)}` : ''}
                </p>
              </div>
            </div>
            {selectedTransactions.length > 0 ? (
              <div className="px-1">
                {selectedTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} layout="list" />
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No hay movimientos en este día.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default MovementsView;

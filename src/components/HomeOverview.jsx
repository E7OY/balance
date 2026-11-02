import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import AnimatedCurrency from './AnimatedCurrency';
import TransactionItem from './TransactionItem';
import CategoryBreakdown from './CategoryBreakdown';
import { Card } from './ui/card';

const HomeOverview = ({ onOverlayOpenChange, onAnnualViewToggle, onShowMovements }) => {
  const { transactions, filters } = useFinance();
  const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(filters.year, filters.month - 1, 1);
  const previousMonthPrefix = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const monthlyTransactions = useMemo(
    () => transactions.filter((transaction) => (
      typeof transaction.date === 'string' && transaction.date.startsWith(monthPrefix)
    )),
    [transactions, monthPrefix],
  );
  const previousMonthTransactions = useMemo(
    () => transactions.filter((transaction) => (
      typeof transaction.date === 'string' && transaction.date.startsWith(previousMonthPrefix)
    )),
    [transactions, previousMonthPrefix],
  );
  const totals = useMemo(() => monthlyTransactions.reduce((result, transaction) => {
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount <= 0) return result;
    if (transaction.type === 'Ingreso') result.income += amount;
    if (transaction.type === 'Gasto') result.expenses += amount;
    return result;
  }, { income: 0, expenses: 0 }), [monthlyTransactions]);
  const previousTotals = useMemo(() => previousMonthTransactions.reduce((result, transaction) => {
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount <= 0) return result;
    if (transaction.type === 'Ingreso') result.income += amount;
    if (transaction.type === 'Gasto') result.expenses += amount;
    return result;
  }, { income: 0, expenses: 0 }), [previousMonthTransactions]);
  const latestTransactions = useMemo(
    () => [...monthlyTransactions]
      .sort((left, right) => (
        right.date.localeCompare(left.date)
        || String(right.id).localeCompare(String(left.id))
      ))
      .slice(0, 5),
    [monthlyTransactions],
  );
  const available = totals.income - totals.expenses;
  const getMonthChange = (current, previous) => {
    const difference = current - previous;
    if (difference === 0) return null;
    return {
      difference,
      percent: previous === 0 ? null : (difference / previous) * 100,
    };
  };
  const renderMonthChange = (current, previous) => {
    const change = getMonthChange(current, previous);
    if (!change) return 'Sin cambios vs. mes anterior';
    const sign = change.difference > 0 ? '+' : '-';
    const formattedDifference = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(change.difference));
    const formattedPercent = change.percent === null
      ? null
      : `${change.percent > 0 ? '+' : '-'}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(Math.abs(change.percent))}%`;

    return (
      <span className="text-zinc-500 dark:text-zinc-400">
        {sign}{formattedDifference} € (
        {formattedPercent ? (
          <span
            data-preserve-colors
            className={change.difference > 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'}
          >
            {formattedPercent}
          </span>
        ) : 'Nuevo este mes'}
        ) vs. mes anterior
      </span>
    );
  };

  return (
    <div className="mt-4 space-y-4">
      <section aria-labelledby="available-balance-title" className="px-1 py-3 sm:px-2">
        <div className="flex items-center justify-between gap-3">
          <h2 id="available-balance-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 first-letter:capitalize">
            {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
              .format(new Date(filters.year, filters.month, 1))}
          </h2>
          <button
            type="button"
            onClick={onAnnualViewToggle}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Vista anual
          </button>
        </div>
        <p className="privacy-sensitive mt-1 break-words text-5xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
          <AnimatedCurrency value={available} />
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-3 dark:!bg-zinc-900 sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <ArrowUpRight size={15} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              Ingresos del mes
            </p>
            <p data-preserve-colors className="privacy-sensitive mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totals.income)}
            </p>
            <p className="mt-1 min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
              {renderMonthChange(totals.income, previousTotals.income)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 dark:!bg-zinc-900 sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <ArrowDownLeft size={15} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              Gastos del mes
            </p>
            <p data-preserve-colors className="privacy-sensitive mt-1 text-base font-semibold text-rose-700 dark:text-rose-400">
              {formatCurrency(totals.expenses)}
            </p>
            <p className="mt-1 min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
              {renderMonthChange(totals.expenses, previousTotals.expenses)}
            </p>
          </div>
        </div>
      </section>

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <button
              type="button"
              onClick={onShowMovements}
              className="inline-flex items-center gap-1 text-left text-base font-semibold text-zinc-900 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              <span id="latest-transactions-title">Últimos movimientos</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <p className="mt-0.5 text-sm capitalize text-zinc-500 dark:text-zinc-400">
              {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
                .format(new Date(filters.year, filters.month, 1))}
            </p>
          </div>
          {latestTransactions.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {latestTransactions.length} de {monthlyTransactions.length}
            </span>
          )}
        </div>
        {latestTransactions.length > 0 ? (
          <div className="space-y-1.5 p-2 sm:p-3">
            {latestTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} layout="list" />
            ))}
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No hay movimientos en este mes. Desliza para cambiar de mes o añade un movimiento.
          </p>
        )}

      <CategoryBreakdown onOverlayOpenChange={onOverlayOpenChange} />
    </div>
  );
};

export default HomeOverview;

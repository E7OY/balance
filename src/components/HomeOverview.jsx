import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import AnimatedCurrency from './AnimatedCurrency';
import TransactionItem from './TransactionItem';
import CategoryBreakdown from './CategoryBreakdown';
import { Card } from './ui/card';

const HomeOverview = ({ onOverlayOpenChange, onAnnualViewToggle, onShowMovements }) => {
  const { transactions, filters, monthlyGoals } = useFinance();
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
  const savingsGoal = Number(monthlyGoals.savings) || 0;
  const investmentGoal = Number(monthlyGoals.investment) || 0;
  const availableForGoals = Math.max(0, available);
  const goalProgress = [
    {
      label: 'Ahorro',
      amount: Math.min(savingsGoal, Math.max(0, availableForGoals - investmentGoal)),
      goal: savingsGoal,
      color: '#10b981',
    },
    {
      label: 'Inversión',
      amount: Math.min(investmentGoal, availableForGoals),
      goal: investmentGoal,
      color: '#0ea5e9',
    },
  ].filter(({ goal }) => goal > 0);
  const getMonthChange = (current, previous) => {
    const difference = current - previous;
    if (difference === 0) return null;
    return {
      difference,
      percent: previous === 0 ? null : (difference / previous) * 100,
    };
  };
  const renderMonthChange = (current, previous, isExpense = false) => {
    const change = getMonthChange(current, previous);
    if (!change) {
      return (
        <p className="mt-2 border-t border-zinc-200/70 pt-2 text-[11px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          Sin cambios vs. mes anterior
        </p>
      );
    }
    const sign = change.difference > 0 ? '+' : '-';
    const formattedDifference = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(change.difference));
    const formattedPercent = change.percent === null
      ? null
      : `${change.percent > 0 ? '+' : '-'}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(Math.abs(change.percent))}%`;
    const trendIsPositive = isExpense ? change.difference < 0 : change.difference > 0;

    return (
      <div className="mt-2 border-t border-zinc-200/70 pt-2 dark:border-white/10">
        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Vs. mes anterior</p>
        <div className="mt-1 flex items-center justify-between gap-1.5">
          <span className="min-w-0 truncate text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
            {sign}{formattedDifference} €
          </span>
          <span
            data-preserve-colors
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
              trendIsPositive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
            }`}
          >
            {formattedPercent || 'Nuevo'}
          </span>
        </div>
      </div>
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
        <p
          data-preserve-colors
          className={`privacy-sensitive mt-1 break-words text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl ${
            available < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-950 dark:text-white'
          }`}
        >
          <AnimatedCurrency value={available} />
        </p>
        {goalProgress.length > 0 && (
          <section aria-labelledby="goal-progress-title" className="mt-4 rounded-2xl bg-[#F4F2F4] p-4 dark:bg-[#28282C] sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="goal-progress-title" className="text-sm font-semibold text-zinc-900 dark:text-white">Progreso de metas</h3>
              <span className="text-right text-xs text-zinc-500 dark:text-zinc-400">Saldo del mes</span>
            </div>
            <div className="divide-y divide-zinc-300/60 dark:divide-white/10">
              {goalProgress.map(({ label, amount, goal, color }) => {
                const percentage = Math.min(100, (amount / goal) * 100);
                return (
                  <div key={label} className="py-3 first:pt-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</p>
                        <p className="privacy-sensitive mt-0.5 truncate text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {formatCurrency(amount)} de {formatCurrency(goal)}
                        </p>
                      </div>
                      <span className="privacy-sensitive shrink-0 text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Progreso de la meta de ${label.toLowerCase()}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(percentage)}
                      className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-[#1C1C1C]"
                    >
                      <span
                        className="chart-color block h-full rounded-full transition-[width]"
                        style={{ width: `${percentage}%`, '--chart-color': color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-2xl bg-[#F4F2F4] p-3.5 dark:bg-[#28282C] sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">Ingresos del mes</p>
              <span data-color-icon="income" className="flex size-7 shrink-0 items-center justify-center rounded-lg">
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </div>
            <p data-preserve-colors className="privacy-sensitive mt-2 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-xl">
              {formatCurrency(totals.income)}
            </p>
            {renderMonthChange(totals.income, previousTotals.income)}
          </div>
          <div className="min-w-0 rounded-2xl bg-[#F4F2F4] p-3.5 dark:bg-[#28282C] sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">Gastos del mes</p>
              <span data-color-icon="expense" className="flex size-7 shrink-0 items-center justify-center rounded-lg">
                <ArrowDownLeft size={15} aria-hidden="true" />
              </span>
            </div>
            <p data-preserve-colors className="privacy-sensitive mt-2 text-lg font-semibold tabular-nums text-rose-700 dark:text-rose-400 sm:text-xl">
              {formatCurrency(totals.expenses)}
            </p>
            {renderMonthChange(totals.expenses, previousTotals.expenses, true)}
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

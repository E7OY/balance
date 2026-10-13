import React, { useState } from 'react';
import { CircleHelp, PieChart, SlidersHorizontal, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/card';

const chartColors = [
  '#10b981',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#84cc16',
  '#d946ef',
  '#f97316',
];

const CategoryBreakdown = () => {
  const {
    expenseBreakdown,
    totalExpenses,
    totalIncome,
    isAmountsHidden,
    allCategories,
    monthlyCategoryCaps,
    setMonthlyCategoryCap,
    filters,
  } = useFinance();
  const [isEditingCaps, setIsEditingCaps] = useState(false);
  const categoriesToShow = [...new Set([
    ...expenseBreakdown.map((item) => item.category),
    ...Object.keys(monthlyCategoryCaps),
  ])].map((category) => expenseBreakdown.find((item) => item.category === category) || {
    category,
    amount: 0,
    percentage: 0,
  });
  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
    .format(new Date(filters.year, filters.month, 1));
  const formatIncomeShare = (amount) => {
    if (totalIncome <= 0) return 'Sin ingresos este mes';
    const percentage = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
      .format((amount / totalIncome) * 100);
    return `${percentage}% de ingresos`;
  };
  const circumference = 2 * Math.PI * 72;
  let offset = 0;

  return (
    <>
    <Card as="section" className="p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">¿En qué se va?</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gastos por categoría</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingCaps(true)}
            aria-label="Configurar topes mensuales"
            title="Configurar topes mensuales"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Topes
          </button>
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <PieChart size={18} />
          </span>
        </div>
      </div>

      {expenseBreakdown.length === 0 && categoriesToShow.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
          <CircleHelp size={22} className="mb-3 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Aún no hay gastos</p>
          <p className="mt-1 max-w-52 text-sm text-slate-500 dark:text-slate-400">
            Cuando añadas gastos, aquí verás cómo se reparten.
          </p>
        </div>
      ) : (
        <>
          {expenseBreakdown.length > 0 ? (
          <div className="flex justify-center py-5">
            <div className="relative size-52 sm:size-56">
              <svg
                viewBox="0 0 200 200"
                role="img"
                aria-label={isAmountsHidden
                  ? 'Gráfico circular de gastos por categoría.'
                  : `Gráfico circular de gastos por categoría. Total: ${formatCurrency(totalExpenses)}.`}
                className="size-full -rotate-90"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="72"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                {expenseBreakdown.map((item, index) => {
                  const segmentLength = (item.percentage / 100) * circumference;
                  const segmentOffset = offset;
                  offset += segmentLength;

                  return (
                    <circle
                      key={item.category}
                      cx="100"
                      cy="100"
                      r="72"
                      fill="none"
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth="20"
                      strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                      strokeDashoffset={-segmentOffset}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total gastado</span>
                <span className="privacy-sensitive mt-1 max-w-[9rem] truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {formatCurrency(totalExpenses)}
                </span>
                <span className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {expenseBreakdown.length} {expenseBreakdown.length === 1 ? 'categoría' : 'categorías'}
                </span>
              </div>
            </div>
          </div>
          ) : (
            <div className="flex min-h-20 items-center justify-center gap-2 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
              <CircleHelp size={18} aria-hidden="true" />
              Aún no hay gastos en las categorías con tope
            </div>
          )}
          <ul className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            {categoriesToShow.map((item, index) => {
              const cap = monthlyCategoryCaps[item.category];
              const progress = cap ? (item.amount / cap) * 100 : 0;
              const progressClass = progress >= 100
                ? 'bg-rose-500'
                : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
              <li key={item.category} className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.category}</span>
                  </span>
                  <span className="privacy-sensitive shrink-0 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrency(item.amount)}
                    <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {item.percentage < 10 ? item.percentage.toFixed(1) : Math.round(item.percentage)}%
                    </span>
                  </span>
                </div>
                {cap && (
                  <div className="mt-2 pl-5">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="privacy-sensitive">{formatCurrency(item.amount)} / {formatCurrency(cap)}</span>
                      <span className={progress >= 100 ? 'font-medium text-rose-700 dark:text-rose-400' : ''}>
                        {progress >= 100 ? 'Superado' : `${Math.round(progress)}%`}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${item.category}: ${formatCurrency(item.amount)} de ${formatCurrency(cap)}`}
                      aria-valuemin={0}
                      aria-valuemax={cap}
                      aria-valuenow={Math.min(item.amount, cap)}
                      className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                    >
                      <span
                        className={`block h-full rounded-full transition-[width] ${progressClass}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
    {isEditingCaps && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsEditingCaps(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="monthly-category-caps-title"
          className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
        >
          <button
            type="button"
            onClick={() => setIsEditingCaps(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={17} />
          </button>
          <h2 id="monthly-category-caps-title" className="pr-9 text-lg font-semibold text-slate-950 dark:text-slate-50">
            Topes mensuales
          </h2>
          <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">Gasto máximo por categoría · {monthLabel}</p>
          <div className="mt-5 space-y-3 overflow-y-auto">
            {allCategories.Gasto.map((category, index) => (
              <div key={`${category}-${index}`} className="flex items-center justify-between gap-4">
                <label htmlFor={`category-cap-${index}`} className="min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {category}
                </label>
                <div className="w-32 shrink-0">
                  <div className="relative">
                    <input
                      id={`category-cap-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Sin tope"
                      value={monthlyCategoryCaps[category] ?? ''}
                      onChange={(event) => setMonthlyCategoryCap(category, event.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                  </div>
                  {monthlyCategoryCaps[category] > 0 && (
                    <p className="privacy-sensitive mt-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
                      {formatIncomeShare(monthlyCategoryCaps[category])}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsEditingCaps(false)}
              className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Listo
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  );
};

export default CategoryBreakdown;

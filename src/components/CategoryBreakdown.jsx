import React from 'react';
import { CircleHelp, PieChart } from 'lucide-react';
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
  const { expenseBreakdown, totalExpenses, isAmountsHidden } = useFinance();
  const circumference = 2 * Math.PI * 72;
  let offset = 0;

  return (
    <Card as="section" className="p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">¿En qué se va?</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gastos por categoría</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <PieChart size={18} />
        </span>
      </div>

      {expenseBreakdown.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
          <CircleHelp size={22} className="mb-3 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Aún no hay gastos</p>
          <p className="mt-1 max-w-52 text-sm text-slate-500 dark:text-slate-400">
            Cuando añadas gastos, aquí verás cómo se reparten.
          </p>
        </div>
      ) : (
        <>
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
          <ul className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            {expenseBreakdown.map((item, index) => (
              <li key={item.category} className="flex items-center justify-between gap-3 text-sm">
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
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
};

export default CategoryBreakdown;

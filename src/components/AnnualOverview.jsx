import React, { useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/card';

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month, 1)),
);

const chartColors = [
  '#10b981',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#84cc16',
];

const AnnualOverview = () => {
  const { transactions, filters, monthlyGoalsByMonth } = useFinance();
  const yearTransactions = useMemo(
    () => transactions.filter((transaction) => (
      typeof transaction.date === 'string' && transaction.date.startsWith(`${filters.year}-`)
    )),
    [transactions, filters.year],
  );
  const report = useMemo(() => {
    const monthlyTotals = Array.from({ length: 12 }, () => ({
      income: 0,
      expenses: 0,
      saved: 0,
      invested: 0,
    }));
    const expensesByCategory = {};
    let income = 0;
    let expenses = 0;
    let expenseCount = 0;

    yearTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const month = Number(transaction.date.slice(5, 7)) - 1;
      if (!Number.isInteger(month) || month < 0 || month > 11) return;

      if (transaction.type === 'Ingreso') {
        income += amount;
        monthlyTotals[month].income += amount;
      } else if (transaction.type === 'Gasto') {
        expenses += amount;
        expenseCount += 1;
        monthlyTotals[month].expenses += amount;
        const category = transaction.category || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
      }
    });

    const categories = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((left, right) => right.amount - left.amount);
    const biggestMonth = monthlyTotals.reduce(
      (largest, month, index) => month.expenses > largest.amount
        ? { amount: month.expenses, index }
        : largest,
      { amount: 0, index: 0 },
    );
    let saved = 0;
    let invested = 0;
    monthlyTotals.forEach((month, index) => {
      const monthKey = `${filters.year}-${String(index + 1).padStart(2, '0')}`;
      const goals = monthlyGoalsByMonth[monthKey] || {};
      const rawSavingsGoal = Number(goals.savings);
      const rawInvestmentGoal = Number(goals.investment);
      const savingsGoal = Number.isFinite(rawSavingsGoal) ? Math.max(0, rawSavingsGoal) : 0;
      const investmentGoal = Number.isFinite(rawInvestmentGoal) ? Math.max(0, rawInvestmentGoal) : 0;
      const availableBalance = Math.max(0, month.income - month.expenses);
      month.invested = Math.min(investmentGoal, availableBalance);
      month.saved = Math.min(savingsGoal, Math.max(0, availableBalance - investmentGoal));
      saved += month.saved;
      invested += month.invested;
    });

    return {
      monthlyTotals,
      expenses,
      income,
      saved,
      invested,
      balance: income - expenses,
      expenseCount,
      categories,
      biggestMonth,
      maxMonthlyTotal: Math.max(...monthlyTotals.map(({ income: monthlyIncome, expenses: monthlyExpenses }) => (
        Math.max(monthlyIncome, monthlyExpenses)
      )), 1),
    };
  }, [yearTransactions, monthlyGoalsByMonth, filters.year]);
  const topCategories = report.categories.slice(0, 8);
  const otherCategoriesTotal = report.categories.slice(8).reduce((total, category) => total + category.amount, 0);
  if (otherCategoriesTotal > 0) {
    topCategories.push({ category: 'Otras categorías', amount: otherCategoriesTotal });
  }
  const topCategory = report.categories[0];
  const metrics = [
    {
      label: 'Gastos del año',
      amount: report.expenses,
      detail: `${report.expenseCount} movimientos`,
      icon: ArrowDownRight,
      tone: 'expense',
    },
    {
      label: 'Ingresos del año',
      amount: report.income,
      detail: report.income > 0
        ? `${Math.round((report.expenses / report.income) * 100)}% destinado a gastos`
        : 'Sin ingresos registrados',
      icon: ArrowUpRight,
      tone: 'income',
    },
    {
      label: 'Balance anual',
      amount: report.balance,
      detail: 'Ingresos menos gastos',
      icon: Wallet,
      tone: 'balance',
    },
    {
      label: 'Promedio mensual',
      amount: report.expenses / 12,
      detail: topCategory ? `Mayor categoría: ${topCategory.category}` : 'Gasto medio en 12 meses',
      icon: CalendarDays,
      tone: 'average',
    },
    {
      label: 'Ahorrado',
      amount: report.saved,
      detail: 'Según saldo disponible y metas mensuales',
      icon: PiggyBank,
      tone: 'income',
    },
    {
      label: 'Invertido',
      amount: report.invested,
      detail: 'Según saldo disponible y metas mensuales',
      icon: TrendingUp,
      tone: 'average',
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <section aria-label={`Resumen financiero de ${filters.year}`} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {metrics.map(({ label, amount, detail, icon: Icon, tone }) => (
          <Card key={label} as="article" className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <span
                data-color-icon={tone === 'expense' ? 'expense' : tone === 'income' ? 'income' : 'chart'}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              >
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>
            <p className="privacy-sensitive mt-3 truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              {formatCurrency(amount)}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)]">
        <Card as="section" aria-labelledby="annual-monthly-title" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="annual-monthly-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Evolución mensual
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Comparativa de ingresos y gastos en {filters.year}
              </p>
            </div>
            <span data-color-icon="chart" className="flex size-9 shrink-0 items-center justify-center rounded-lg">
              <ReceiptText size={18} aria-hidden="true" />
            </span>
          </div>

          {report.expenses === 0 && report.income === 0 ? (
            <p className="flex min-h-52 items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              Aún no hay movimientos registrados en {filters.year}.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {report.monthlyTotals.map(({ income, expenses }, index) => (
                <div key={monthNames[index]} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                    {monthNames[index].slice(0, 3)}
                  </span>
                  <div className="space-y-1.5" aria-label={`${monthNames[index]}: barras de gastos e ingresos`}>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${(expenses / report.maxMonthlyTotal) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(income / report.maxMonthlyTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="privacy-sensitive min-w-[4.5rem] text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(expenses)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Gastos</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Ingresos</span>
            <span className="ml-auto">El importe de la derecha muestra los gastos</span>
          </div>
          {report.biggestMonth.amount > 0 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Mes con más gastos: <span className="capitalize">{monthNames[report.biggestMonth.index]}</span>
              {' '}· <span className="privacy-sensitive font-medium">{formatCurrency(report.biggestMonth.amount)}</span>
            </p>
          )}
        </Card>

        <Card as="section" aria-labelledby="annual-category-title" className="p-5 sm:p-6">
          <div>
            <h2 id="annual-category-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Gastos por categoría
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Distribución de los gastos de {filters.year}
            </p>
          </div>

          {topCategories.length === 0 ? (
            <p className="flex min-h-52 items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              Aún no hay gastos para mostrar.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {topCategories.map(({ category, amount }, index) => {
                const percentage = report.expenses > 0 ? (amount / report.expenses) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                        <span className="truncate">{category}</span>
                      </span>
                      <span className="privacy-sensitive shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(amount)} · {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: chartColors[index % chartColors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {topCategory && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Tu mayor gasto está en <strong className="text-slate-800 dark:text-slate-200">{topCategory.category}</strong>
              {' '}con <span className="privacy-sensitive font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(topCategory.amount)}</span>.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnnualOverview;

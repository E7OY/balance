import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/card';

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month, 1)),
);

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
  const currentDate = new Date();
  const monthsElapsed = filters.year === currentDate.getFullYear()
    ? currentDate.getMonth() + 1
    : 12;
  const averagePeriodLabel = `ene–${monthNames[monthsElapsed - 1].slice(0, 3)}`;
  const bestMonth = report.monthlyTotals.reduce((best, month, index) => {
    const balance = month.income - month.expenses;
    return balance > best.balance ? { balance, index } : best;
  }, { balance: Number.NEGATIVE_INFINITY, index: 0 });
  const savingsPercent = report.income > 0 ? (report.balance / report.income) * 100 : 0;
  const averageExpense = monthsElapsed > 0 ? report.expenses / monthsElapsed : 0;
  const hasAnnualData = report.income > 0 || report.expenses > 0;

  return (
    <div className="mt-3 space-y-4">
      <section aria-label={`Resumen de ahorro de ${filters.year}`} className="py-2 text-center">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ahorro del año</p>
        <p className={`privacy-sensitive mt-1 text-4xl font-bold tracking-tight tabular-nums ${report.balance < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-950 dark:text-white'}`}>
          {formatCurrency(report.balance)}
        </p>
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${report.balance < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
          {Math.round(savingsPercent)}% de tus ingresos
        </span>
      </section>

      <section aria-label={`Ingresos y gastos de ${filters.year}`} className="grid grid-cols-2 gap-3">
        <Card as="article" className="min-w-0 rounded-2xl p-3">
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Ingresos</p>
          <p className="privacy-sensitive mt-1 truncate text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatCurrency(report.income)}
          </p>
        </Card>
        <Card as="article" className="min-w-0 rounded-2xl p-3">
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Gastos</p>
          <p className="privacy-sensitive mt-1 truncate text-base font-semibold tabular-nums text-rose-700 dark:text-rose-400">
            {formatCurrency(report.expenses)}
          </p>
        </Card>
      </section>

      <Card as="section" aria-labelledby="annual-monthly-title" className="rounded-2xl p-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="annual-monthly-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Por meses</h2>
          <div className="flex items-center gap-2 text-[9px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1"><i className="size-1.5 rounded-full bg-[#AB9FF2]" />Ingresos</span>
            <span className="inline-flex items-center gap-1"><i className="size-1.5 rounded-full bg-zinc-500" />Gastos</span>
          </div>
        </div>
        {!hasAnnualData && (
          <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">Aún no hay movimientos en {filters.year}.</p>
        )}
        <div className="mt-3 grid grid-cols-12 gap-1" role="img" aria-label={`Ingresos y gastos mensuales de ${filters.year}`}>
          {report.monthlyTotals.map(({ income, expenses }, index) => (
            <div key={`${filters.year}-${index}`} className="min-w-0">
              <div className="flex h-[4.75rem] items-end justify-center gap-[2px] border-b border-zinc-200 dark:border-white/10">
                <span
                  title={`${monthNames[index]}: ingresos ${formatCurrency(income)}`}
                  className="w-[5px] rounded-t-sm bg-[#AB9FF2]"
                  style={{ height: `${(income / report.maxMonthlyTotal) * 100}%` }}
                />
                <span
                  title={`${monthNames[index]}: gastos ${formatCurrency(expenses)}`}
                  className="w-[5px] rounded-t-sm bg-zinc-500 dark:bg-zinc-400"
                  style={{ height: `${(expenses / report.maxMonthlyTotal) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-center text-[9px] font-semibold text-zinc-600 dark:text-zinc-300">
                {monthNames[index].slice(0, 1).toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card as="section" aria-label="Resumen anual" className="rounded-2xl divide-y divide-zinc-200/70 px-3.5 dark:divide-white/10">
        <div className="flex items-center justify-between gap-3 py-3 text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400">Mejor mes</span>
          <span className={`privacy-sensitive truncate text-right font-semibold tabular-nums ${bestMonth.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {hasAnnualData ? `${monthNames[bestMonth.index].slice(0, 1).toUpperCase()}${monthNames[bestMonth.index].slice(1)} · ${bestMonth.balance > 0 ? '+' : ''}${formatCurrency(bestMonth.balance)}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400">Mes con más gasto</span>
          <span className="privacy-sensitive truncate text-right font-semibold tabular-nums text-rose-700 dark:text-rose-400">
            {report.biggestMonth.amount > 0
              ? `${monthNames[report.biggestMonth.index].slice(0, 1).toUpperCase()}${monthNames[report.biggestMonth.index].slice(1)} · ${formatCurrency(report.biggestMonth.amount)}`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400">Gasto medio ({averagePeriodLabel})</span>
          <span className="privacy-sensitive font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{formatCurrency(averageExpense)}</span>
        </div>
      </Card>
    </div>
  );
};

export default AnnualOverview;

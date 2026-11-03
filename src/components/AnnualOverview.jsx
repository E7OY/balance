import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import AnimatedCurrency from './AnimatedCurrency';
import { Card } from './ui/card';

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month, 1)),
);

const AnnualOverview = () => {
  const { transactions, filters, monthlyGoalsByMonth } = useFinance();
  const [activeMonth, setActiveMonth] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  
  useEffect(() => {
    setActiveMonth(null);
    setHoveredMonth(null);
  }, [filters.year]);
  
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

  const balanceText = formatCurrency(report.balance);
  const balanceFontClass = balanceText.length > 12 ? 'text-[38px] sm:text-[44px]' : balanceText.length > 10 ? 'text-[44px] sm:text-[50px]' : 'text-5xl sm:text-6xl';
  
  const chartPitch = 350 / 12;
  const chartBaseline = 140;
  const chartMaxBar = 130;
  const getBarHeight = (value) => (
    value > 0 ? Math.max(2, (value / report.maxMonthlyTotal) * chartMaxBar) : 0
  );
  const capitalizedMonth = (index) => `${monthNames[index].slice(0, 1).toUpperCase()}${monthNames[index].slice(1)}`;
  const displayedMonth = hoveredMonth ?? activeMonth;
  const displayedTotals = displayedMonth !== null ? report.monthlyTotals[displayedMonth] : null;
  const displayedBalance = displayedTotals ? displayedTotals.income - displayedTotals.expenses : 0;
  const toggleMonth = (index) => setActiveMonth((current) => (current === index ? null : index));

  return (
    <div className="mt-2 space-y-5">
      <section aria-label={`Resumen de ahorro de ${filters.year}`} className="text-left px-1 py-3 sm:px-2">
        <p className="mt-3 text-left text-[13px] text-zinc-500 dark:text-[#9b9b9b]">Ahorro del año</p>
        <p className={`privacy-sensitive mt-1 break-words font-bold tabular-nums text-6xl tracking-[-0.03em] ${balanceFontClass} ${report.balance < 0 ? '!text-[#D6403F] dark:!text-[#FF8A8A]' : 'text-zinc-950 dark:text-white'}`}>
          <AnimatedCurrency value={report.balance} />
        </p>
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-[5px] text-[13px] font-semibold ${report.balance < 0 ? 'bg-[#FDE4E4] !text-[#D6403F] dark:bg-[#3a1c1c] dark:!text-[#FF8A8A]' : 'bg-[#DDF5E8] !text-[#0F8A5F] dark:bg-[#16332a] dark:!text-[#3DDC97]'}`}>
          {Math.round(savingsPercent)}% de tus ingresos
        </span>
      </section>

      <section aria-label={`Ingresos y gastos de ${filters.year}`} className="grid grid-cols-2 gap-3 mt-6">
        <div className="min-w-0 rounded-2xl bg-[#F4F2F4] p-3.5 dark:bg-[#28282C] sm:p-4">
          <p className="min-w-0 truncate text-[13px] text-zinc-500 dark:text-[#9b9b9b]">Ingresos</p>
          <p className="privacy-sensitive mt-2 text-lg font-semibold tabular-nums !text-[#0F8A5F] dark:!text-[#3DDC97] sm:text-xl">
            {formatCurrency(report.income)}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl bg-[#F4F2F4] p-3.5 dark:bg-[#28282C] sm:p-4">
          <p className="min-w-0 truncate text-[13px] text-zinc-500 dark:text-[#9b9b9b]">Gastos</p>
          <p className="privacy-sensitive mt-2 text-lg font-semibold tabular-nums !text-[#D6403F] dark:!text-[#FF8A8A] sm:text-xl">
            {formatCurrency(report.expenses)}
          </p>
        </div>
      </section>

      <section aria-labelledby="annual-monthly-title" className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 id="annual-monthly-title" className="text-lg font-bold text-zinc-900 dark:text-white">Por meses</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-[#c4c4c4]">
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#AB9FF2]" />Ingresos</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-zinc-400 dark:bg-[#7a7a7a]" />Gastos</span>
          </div>
        </div>
        {!hasAnnualData && (
          <p className="mb-2 text-xs text-zinc-500 dark:text-[#9b9b9b] px-1">Aún no hay movimientos en {filters.year}.</p>
        )}
        <svg
          viewBox="0 0 350 168"
          className="mx-auto h-auto w-full max-w-md select-none"
          role="group"
          aria-label={`Ingresos y gastos mensuales de ${filters.year}`}
        >
          <line x1="0" x2="350" y1={chartBaseline + 0.5} y2={chartBaseline + 0.5} strokeWidth="1" className="stroke-zinc-200 dark:stroke-[#2a2a2a]" />
          {report.monthlyTotals.map(({ income, expenses }, index) => {
            const groupX = index * chartPitch + (chartPitch - 20) / 2;
            const incomeHeight = getBarHeight(income);
            const expensesHeight = getBarHeight(expenses);
            const isActive = displayedMonth === index;
            const dimClass = displayedMonth !== null && !isActive ? 'opacity-40' : '';
            return (
              <g
                key={`${filters.year}-${index}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeMonth === index}
                aria-label={`${capitalizedMonth(index)}: ingresos ${formatCurrency(income)}, gastos ${formatCurrency(expenses)}`}
                onClick={() => toggleMonth(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleMonth(index);
                  }
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setHoveredMonth(index);
                }}
                onPointerLeave={() => setHoveredMonth(null)}
                className="group/month cursor-pointer outline-none"
              >
                <rect
                  x={index * chartPitch}
                  y="0"
                  width={chartPitch}
                  height="168"
                  rx="10"
                  strokeWidth="1.5"
                  className={`stroke-transparent transition-colors group-focus-visible/month:stroke-[#AB9FF2] ${isActive ? 'fill-[#AB9FF2]/15' : 'fill-transparent'}`}
                />
                {incomeHeight > 0 && (
                  <rect x={groupX} y={chartBaseline - incomeHeight} width="9" height={incomeHeight} rx="2" className={`fill-[#AB9FF2] transition-opacity ${dimClass}`} />
                )}
                {expensesHeight > 0 && (
                  <rect x={groupX + 11} y={chartBaseline - expensesHeight} width="9" height={expensesHeight} rx="2" className={`fill-zinc-400 transition-opacity dark:fill-[#7a7a7a] ${dimClass}`} />
                )}
                <text
                  x={groupX + 10}
                  y="160"
                  textAnchor="middle"
                  fontSize="11"
                  className={isActive ? 'fill-[#AB9FF2] font-bold' : 'fill-zinc-500 dark:fill-[#9b9b9b]'}
                >
                  {monthNames[index].slice(0, 1).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        <div aria-live="polite" className="mt-3 min-h-[3.25rem] px-1">
          {displayedTotals ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                  {capitalizedMonth(displayedMonth)} {filters.year}
                </p>
                <p className={`privacy-sensitive text-[15px] font-semibold tabular-nums ${displayedBalance >= 0 ? '!text-[#0F8A5F] dark:!text-[#3DDC97]' : '!text-[#D6403F] dark:!text-[#FF8A8A]'}`}>
                  {displayedBalance > 0 ? '+' : ''}{formatCurrency(displayedBalance)}
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[13px] text-zinc-500 dark:text-[#9b9b9b]">
                <span className="inline-flex items-center gap-1.5">
                  <i className="size-2 rounded-full bg-[#AB9FF2]" />
                  Ingresos
                  <span className="privacy-sensitive font-semibold tabular-nums !text-[#0F8A5F] dark:!text-[#3DDC97]">{formatCurrency(displayedTotals.income)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="size-2 rounded-full bg-zinc-400 dark:bg-[#7a7a7a]" />
                  Gastos
                  <span className="privacy-sensitive font-semibold tabular-nums !text-[#D6403F] dark:!text-[#FF8A8A]">{formatCurrency(displayedTotals.expenses)}</span>
                </span>
              </div>
            </>
          ) : (
            <p className="pt-2 text-center text-[13px] text-zinc-500 dark:text-[#9b9b9b]">Selecciona un mes para ver el detalle</p>
          )}
        </div>
      </section>

      <Card as="section" aria-label="Resumen anual" className="!border-none divide-y divide-zinc-200/70 rounded-[20px] bg-[#F4F2F4] px-4 py-1 dark:divide-[#2e2e2e] dark:bg-[#1f1f1f] mt-8">
        <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
          <span className="text-zinc-500 dark:text-[#9b9b9b]">Mejor mes</span>
          <span className={`privacy-sensitive truncate text-right font-semibold tabular-nums ${bestMonth.balance >= 0 ? '!text-[#0F8A5F] dark:!text-[#3DDC97]' : '!text-[#D6403F] dark:!text-[#FF8A8A]'}`}>
            {hasAnnualData ? `${monthNames[bestMonth.index].slice(0, 1).toUpperCase()}${monthNames[bestMonth.index].slice(1)} · ${bestMonth.balance > 0 ? '+' : ''}${formatCurrency(bestMonth.balance)}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
          <span className="text-zinc-500 dark:text-[#9b9b9b]">Mes con más gasto</span>
          <span className="privacy-sensitive truncate text-right font-semibold tabular-nums !text-[#D6403F] dark:!text-[#FF8A8A]">
            {report.biggestMonth.amount > 0
              ? `${monthNames[report.biggestMonth.index].slice(0, 1).toUpperCase()}${monthNames[report.biggestMonth.index].slice(1)} · ${formatCurrency(report.biggestMonth.amount)}`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
          <span className="text-zinc-500 dark:text-[#9b9b9b]">Gasto medio ({averagePeriodLabel})</span>
          <span className="privacy-sensitive font-semibold tabular-nums text-zinc-800 dark:text-white">{formatCurrency(averageExpense)}</span>
        </div>
      </Card>
    </div>
  );
};

export default AnnualOverview;
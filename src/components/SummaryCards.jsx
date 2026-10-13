import React, { useState } from 'react';
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Minus, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/card';

const Sparkline = ({ values, label, tone }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const minimum = Math.min(...values);
  const range = Math.max(...values) - minimum;
  const color = tone === 'income' ? '#10b981' : '#f43f5e';
  const gradientId = `sparkline-${tone}-gradient`;
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 100,
    y: range > 0 ? 27 - ((value - minimum) / range) * 22 : 16,
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const fillPoints = [`${points[0].x},32`, linePoints, `${points[points.length - 1].x},32`].join(' ');
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const tooltipLeft = activeIndex === null
    ? 50
    : Math.min(84, Math.max(16, (activeIndex / (values.length - 1)) * 100));

  return (
    <div
      className="relative mt-6 h-14"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        setActiveIndex(Math.round(position * (values.length - 1)));
      }}
      onMouseLeave={() => setActiveIndex(null)}
    >
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#${gradientId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1="2"
              x2={activePoint.x}
              y2="30"
              stroke={color}
              strokeDasharray="2 2"
              strokeOpacity="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
        {points.map(({ x, y }, index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="7"
            fill="transparent"
            tabIndex="0"
            aria-label={`${label}, semana ${index + 1}: ${formatCurrency(values[index])}`}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            <title>{`Semana ${index + 1}: ${formatCurrency(values[index])}`}</title>
          </circle>
        ))}
      </svg>
      {activePoint && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
          style={{
            left: `${activePoint.x}%`,
            top: `${(activePoint.y / 32) * 100}%`,
            backgroundColor: color,
          }}
        />
      )}
      {activeIndex !== null && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[11px] font-medium text-white shadow-md dark:bg-white dark:text-slate-900"
          style={{ left: `${tooltipLeft}%` }}
        >
          {`Semana ${activeIndex + 1} · ${formatCurrency(values[activeIndex])}`}
        </span>
      )}
    </div>
  );
};

const SummaryCards = () => {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    transactions,
    monthlyTransactions,
    filters,
    monthlyGoals,
    isAmountsHidden,
  } = useFinance();
  const previousMonthDate = new Date(filters.year, filters.month - 1, 1);
  const previousMonthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(previousMonthDate);
  const previousMonthTransactions = transactions.filter((transaction) => {
    const [year, month] = transaction.date.split('-').map(Number);
    return year === previousMonthDate.getFullYear() && month - 1 === previousMonthDate.getMonth();
  });
  const previousMonthTotals = previousMonthTransactions.reduce((totals, transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'Ingreso') {
      totals.income += amount;
      totals.balance += amount;
    } else if (transaction.type === 'Gasto') {
      totals.expenses += amount;
      totals.balance -= amount;
    }
    return totals;
  }, { balance: 0, income: 0, expenses: 0 });

  const categoryTotalsThisMonth = monthlyTransactions
    .filter((transaction) => transaction.type === 'Gasto')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
      return acc;
    }, {});

  const categoryTotalsPreviousMonth = previousMonthTransactions
    .filter((transaction) => transaction.type === 'Gasto')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
      return acc;
    }, {});

  const anomaly = Object.entries(categoryTotalsThisMonth)
    .map(([category, currentTotal]) => {
      const previousTotal = categoryTotalsPreviousMonth[category] || 0;
      if (previousTotal <= 0 || currentTotal <= 0) return null;
      const delta = ((currentTotal - previousTotal) / previousTotal) * 100;
      return { category, delta, currentTotal, previousTotal };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  const anomalyMessage = anomaly && anomaly.delta >= 20
    ? `Este mes has gastado un ${Math.round(anomaly.delta)}% más en '${anomaly.category}' que el mes pasado.`
    : null;

  const savingsGoal = monthlyGoals.savings;
  const investmentGoal = monthlyGoals.investment;
  const totalGoals = savingsGoal + investmentGoal;
  const hasMonthlyGoals = totalGoals > 0;
  const savedPercentage = totalIncome > 0
    ? Math.max(0, Math.min(100, (totalBalance / totalIncome) * 100))
    : 0;
  const reallySpendable = Math.max(0, totalBalance - totalGoals);
  const positiveBalance = Math.max(0, totalBalance);
  const availableForSavings = Math.min(savingsGoal, positiveBalance);
  const availableForInvestment = Math.min(investmentGoal, Math.max(0, positiveBalance - availableForSavings));
  const savingsWidth = positiveBalance > 0 ? (availableForSavings / positiveBalance) * 100 : 0;
  const investmentWidth = positiveBalance > 0 ? (availableForInvestment / positiveBalance) * 100 : 0;
  const spendableWidth = positiveBalance > 0 ? (reallySpendable / positiveBalance) * 100 : 0;
  const consumedReserve = Math.min(totalGoals, Math.max(0, totalGoals - positiveBalance));
  const formatIncomePercentage = (amount) => totalIncome > 0
    ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format((amount / totalIncome) * 100)}%`
    : '—';

  const dayCount = new Date(filters.year, filters.month + 1, 0).getDate();
  const dailyExpenses = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const isoDate = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const total = monthlyTransactions
      .filter((transaction) => transaction.type === 'Gasto' && transaction.date === isoDate)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return { day, total };
  });
  const chartMax = Math.max(...dailyExpenses.map((day) => day.total), 1);
  const weeklyTotals = Array.from({ length: Math.ceil(dayCount / 7) }, () => ({ income: 0, expenses: 0 }));
  monthlyTransactions.forEach((transaction) => {
    const weekIndex = Math.floor((Number(transaction.date.slice(-2)) - 1) / 7);
    const amount = Number(transaction.amount) || 0;
    if (!weeklyTotals[weekIndex]) return;
    if (transaction.type === 'Ingreso') weeklyTotals[weekIndex].income += amount;
    if (transaction.type === 'Gasto') weeklyTotals[weekIndex].expenses += amount;
  });
  let accumulatedIncome = 0;
  let accumulatedExpenses = 0;
  const weeklyTrends = weeklyTotals.map(({ income, expenses }) => {
    accumulatedIncome += income;
    accumulatedExpenses += expenses;
    return { income: accumulatedIncome, expenses: accumulatedExpenses };
  });

  const stats = [
    {
      label: 'Sueldo e ingresos',
      amount: +totalIncome,
      icon: ArrowUpRight,
      iconClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
      amountClass: 'text-emerald-700 dark:text-emerald-400',
      note: 'Lo que ha entrado este mes',
      previousAmount: previousMonthTotals.income,
      trendValues: weeklyTrends.map((week) => week.income),
    },
    {
      label: 'Gastos del mes',
      amount: -totalExpenses,
      icon: ArrowDownRight,
      iconClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
      amountClass: 'text-rose-700 dark:text-rose-400',
      note: 'Lo que ya has gastado',
      previousAmount: previousMonthTotals.expenses,
      trendValues: weeklyTrends.map((week) => week.expenses),
    },
  ];

  return (
    <>
      {anomalyMessage && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
            !
          </span>
          <span>{anomalyMessage}</span>
        </div>
      )}

      <section aria-label="Resumen del mes" className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 md:grid-cols-3">
        <Card as="article" className="col-span-2 p-4 sm:p-5 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {hasMonthlyGoals ? 'Dinero Realmente Gastable' : 'Dinero disponible'}
            </p>
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Wallet size={18} />
            </span>
          </div>
          <p className="privacy-sensitive mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:mt-5 sm:text-3xl">
            {formatCurrency(hasMonthlyGoals ? reallySpendable : totalBalance)}
          </p>
          {hasMonthlyGoals ? (
            <>
              <p className="privacy-sensitive mt-1 text-sm text-slate-500 dark:text-slate-400">
                Saldo del mes: {formatCurrency(totalBalance)} menos tus metas
              </p>
              <div
                className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:mt-5 sm:h-2.5"
                role="img"
                aria-label={isAmountsHidden
                  ? 'Distribución del saldo entre ahorro, inversión y dinero libre.'
                  : `Distribución del saldo: ${formatCurrency(availableForSavings)} para ahorro, ${formatCurrency(availableForInvestment)} para inversión y ${formatCurrency(reallySpendable)} libres`}
              >
                <span className="h-full bg-emerald-500 transition-[width]" style={{ width: `${savingsWidth}%` }} />
                <span className="h-full bg-violet-500 transition-[width]" style={{ width: `${investmentWidth}%` }} />
                <span className="h-full bg-sky-500 transition-[width]" style={{ width: `${spendableWidth}%` }} />
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {[
                  { label: 'Ahorro', amount: savingsGoal, color: 'bg-emerald-500' },
                  { label: 'Inversión', amount: investmentGoal, color: 'bg-violet-500' },
                  { label: 'Dinero libre', amount: reallySpendable, color: 'bg-sky-500' },
                ].map(({ label, amount, color }) => (
                  <p key={label} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`size-2 shrink-0 rounded-full ${color}`} />
                      {label}
                    </span>
                    <span className="privacy-sensitive text-right font-medium">
                      {formatCurrency(amount)} ({formatIncomePercentage(amount)} de tus ingresos)
                    </span>
                  </p>
                ))}
              </div>
              {totalBalance < totalGoals && (
                <p
                  role="alert"
                  className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  Tus gastos han consumido <span className="privacy-sensitive">{formatCurrency(consumedReserve)}</span> de la reserva prevista para ahorro e inversión.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="privacy-sensitive mt-1 text-sm text-slate-500 dark:text-slate-400">Ingresos menos gastos</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:mt-5 sm:h-2">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${savedPercentage}%` }}
                />
              </div>
              <p className="privacy-sensitive mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {totalIncome > 0
                  ? `${Math.round(savedPercentage)}% de tus ingresos sigue disponible`
                  : 'Añade tu sueldo para ver cuánto te queda'}
              </p>
            </>
          )}
          <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:mt-3 sm:pt-3">
            {`Disponible en ${previousMonthLabel}: `}
            <span className="privacy-sensitive font-medium text-slate-700 dark:text-slate-200">{formatCurrency(previousMonthTotals.balance)}</span>
          </p>
        </Card>

        {stats.map(({ label, amount, icon: Icon, iconClass, amountClass, note, previousAmount, trendValues }) => {
          const isIncome = label === 'Sueldo e ingresos';
          const currentTotal = Math.abs(amount);
          const previousTotal = Math.abs(previousAmount);
          const change = previousTotal > 0
            ? ((currentTotal - previousTotal) / previousTotal) * 100
            : null;
          const isIncrease = change !== null && change > 0;
          const isDecrease = change !== null && change < 0;
          const isFavorable = isIncome ? isIncrease : isDecrease;
          const TrendIcon = isIncrease ? ArrowUp : isDecrease ? ArrowDown : Minus;
          const trendClass = change === null
            ? isIncome
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
            : change === 0
              ? 'text-slate-500 dark:text-slate-400'
              : isFavorable
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400';
          const trendText = change === null
            ? currentTotal > 0 ? 'Nuevo' : '0%'
            : `${Math.round(Math.abs(change))}%`;

          return (
            <Card as="article" key={label} className="min-w-0 p-3.5 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <span className={`flex size-9 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-5">
                <p className={`privacy-sensitive break-words text-xl font-semibold tracking-tight sm:text-3xl ${amountClass}`}>
                  {isIncome ? `+${formatCurrency(amount)}` : formatCurrency(amount)}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold ${trendClass}`}
                  aria-label={change === null
                    ? `${trendText} respecto al mes pasado`
                    : `${isIncrease ? 'Subida' : isDecrease ? 'Bajada' : 'Sin variación'} del ${trendText} respecto al mes pasado`}
                  title="Variación respecto al mes pasado"
                >
                  <TrendIcon size={14} aria-hidden="true" />
                  {trendText}
                </span>
              </div>
              <p className="mt-1 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{note}</p>
              <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:mt-3 sm:pt-3 sm:text-xs">
                {`${label === 'Gastos del mes' ? 'Gastaste' : 'Ingresaste'} en ${previousMonthLabel}: `}
                <span className="privacy-sensitive font-medium text-slate-700 dark:text-slate-200">{formatCurrency(previousAmount)}</span>
              </p>
              <Sparkline values={trendValues} label={label} tone={isIncome ? 'income' : 'expense'} />
            </Card>
          );
        })}
      </section>
    </>
  );
};

export default SummaryCards;

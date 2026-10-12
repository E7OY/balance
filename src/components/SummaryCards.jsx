import React from 'react';
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Minus, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/card';

const SummaryCards = () => {
  const { totalBalance, totalIncome, totalExpenses, transactions, monthlyTransactions, filters } = useFinance();
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

  const savedPercentage = totalIncome > 0
    ? Math.max(0, Math.min(100, (totalBalance / totalIncome) * 100))
    : 0;

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

  const stats = [
    {
      label: 'Sueldo e ingresos',
      amount: +totalIncome,
      icon: ArrowUpRight,
      iconClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
      amountClass: 'text-emerald-700 dark:text-emerald-400',
      note: 'Lo que ha entrado este mes',
      previousAmount: previousMonthTotals.income,
    },
    {
      label: 'Gastos del mes',
      amount: -totalExpenses,
      icon: ArrowDownRight,
      iconClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
      amountClass: 'text-rose-700 dark:text-rose-400',
      note: 'Lo que ya has gastado',
      previousAmount: previousMonthTotals.expenses,
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dinero disponible</p>
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Wallet size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:mt-5 sm:text-3xl">
            {formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ingresos menos gastos</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:mt-5 sm:h-2">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${savedPercentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {totalIncome > 0
              ? `${Math.round(savedPercentage)}% de tus ingresos sigue disponible`
              : 'Añade tu sueldo para ver cuánto te queda'}
          </p>
          <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:mt-3 sm:pt-3">
            {`Disponible en ${previousMonthLabel}: `}
            <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(previousMonthTotals.balance)}</span>
          </p>
        </Card>

        {stats.map(({ label, amount, icon: Icon, iconClass, amountClass, note, previousAmount }) => {
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
                <p className={`break-words text-xl font-semibold tracking-tight sm:text-3xl ${amountClass}`}>
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
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(previousAmount)}</span>
              </p>
            </Card>
          );
        })}
      </section>
    </>
  );
};

export default SummaryCards;

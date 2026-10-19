import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, ReceiptText } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from './TransactionItem';
import { Card } from './ui/card';

const getRelevance = (transaction, searchTerm) => {
  const query = searchTerm.trim().toLocaleLowerCase('es');
  if (!query) return 0;

  const description = (transaction.description || '').toLocaleLowerCase('es');
  const category = (transaction.category || '').toLocaleLowerCase('es');
  const paymentMethod = (transaction.paymentMethod || '').toLocaleLowerCase('es');

  if (description === query || category === query || paymentMethod === query) return 4;
  if (description.startsWith(query) || category.startsWith(query) || paymentMethod.startsWith(query)) return 3;
  if (description.includes(query)) return 2;
  if (category.includes(query) || paymentMethod.includes(query)) return 1;
  return 0;
};

const TransactionList = () => {
  const { filteredTransactions, setIsModalOpen, filters } = useFinance();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'default', direction: 'desc' });
  const sortedTransactions = useMemo(() => {
    const transactions = [...filteredTransactions];
    const byNewest = (a, b) => b.date.localeCompare(a.date);

    if (sortConfig.key !== 'default') {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      return transactions.sort((a, b) => {
        let comparison = 0;
        if (sortConfig.key === 'date') comparison = a.date.localeCompare(b.date);
        if (sortConfig.key === 'amount') comparison = Number(a.amount) - Number(b.amount);
        if (sortConfig.key === 'category') {
          comparison = (a.category || '').localeCompare(b.category || '', 'es', { sensitivity: 'base' });
        }
        return comparison * direction || byNewest(a, b);
      });
    }

    return transactions.sort((a, b) =>
      getRelevance(b, filters.searchTerm) - getRelevance(a, filters.searchTerm) || byNewest(a, b),
    );
  }, [filteredTransactions, filters.searchTerm, sortConfig]);
  const toggleSort = (key) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key
        ? previous.direction === 'asc' ? 'desc' : 'asc'
        : key === 'category' ? 'asc' : 'desc',
    }));
  };
  const renderSortHeader = (label, key, className) => {
    const SortIcon = sortConfig.key !== key
      ? ArrowUpDown
      : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;

    return (
      <th
        scope="col"
        aria-sort={sortConfig.key === key ? sortConfig.direction === 'asc' ? 'ascending' : 'descending' : undefined}
        className={className}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className="inline-flex items-center gap-1 rounded-sm hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:text-slate-100"
        >
          {label}
          <SortIcon size={14} aria-hidden="true" />
        </button>
      </th>
    );
  };
  const visibleTransactions = showAllTransactions ? sortedTransactions : sortedTransactions.slice(0,5);

  return (
    <Card as="section" className="overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-700 sm:gap-3 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 p-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            Movimientos del mes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
            {sortedTransactions.length === 1
              ? '1 movimiento'
              : `${sortedTransactions.length} movimientos`}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <ReceiptText size={17} aria-hidden="true" />
        </span>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <ReceiptText size={22} />
          </span>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Tu hoja de este mes está vacía</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Añade tu sueldo o el primer gasto para empezar a ver tus cuentas.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-sm font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Añadir primer movimiento
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5 p-2 sm:space-y-2 sm:p-3 xl:hidden">
            {visibleTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} layout="card" />
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-5 py-3 sm:px-6">Movimiento</th>
                  {renderSortHeader('Categoría', 'category', 'px-4 py-3')}
                  <th scope="col" className="px-4 py-3">Método</th>
                  {renderSortHeader('Fecha', 'date', 'px-4 py-3')}
                  {renderSortHeader('Importe', 'amount', 'px-5 py-3 text-right sm:px-6 [&>button]:w-full [&>button]:justify-end')}
                  <th scope="col" className="sticky right-0 z-20 w-12 bg-slate-50/95 px-2 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.5)] dark:bg-slate-800">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {visibleTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </tbody>
            </table>
          </div>
          {sortedTransactions.length > 5 && (
            <button
              type="button"
              aria-expanded={showAllTransactions}
              onClick={() => setShowAllTransactions((showAll) => !showAll)}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-slate-100 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:border-slate-700 dark:text-emerald-400 !bg-white dark:!bg-slate-900/10 dark:hover:bg-emerald-500/10"
            >
              {showAllTransactions
                ? <>Mostrar menos <ChevronUp size={16} aria-hidden="true" /></>
                : <>Ver todos <ChevronDown size={16} aria-hidden="true" /></>}
            </button>
          )}
        </>
      )}
    </Card>
  );
};

export default TransactionList;

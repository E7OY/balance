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
  const renderSortControl = (label, key) => {
    const SortIcon = sortConfig.key !== key
      ? ArrowUpDown
      : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;

    return (
      <button
          type="button"
          onClick={() => toggleSort(key)}
          aria-pressed={sortConfig.key === key}
          className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
            sortConfig.key === key
              ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
          }`}
        >
          {label}
          <SortIcon size={14} aria-hidden="true" />
      </button>
    );
  };
  const visibleTransactions = showAllTransactions ? sortedTransactions : sortedTransactions.slice(0,5);

  return (
    <Card as="section" data-phantom-surface className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-1 py-3 dark:border-zinc-800 sm:gap-3 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
            Transacciones
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1 sm:text-sm">
            {sortedTransactions.length === 1
              ? '1 movimiento'
              : `${sortedTransactions.length} movimientos`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {renderSortControl('Fecha', 'date')}
          {renderSortControl('Importe', 'amount')}
          {renderSortControl('Categoría', 'category')}
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
            <ReceiptText size={22} />
          </span>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tu hoja de este mes está vacía</h3>
          <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
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
          <div>
            {visibleTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} layout="list" />
            ))}
          </div>
          {sortedTransactions.length > 5 && (
            <button
              type="button"
              aria-expanded={showAllTransactions}
              onClick={() => setShowAllTransactions((showAll) => !showAll)}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
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

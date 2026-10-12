import React, { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ReceiptText } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState('relevance');
  const sortedTransactions = useMemo(() => {
    const transactions = [...filteredTransactions];
    const byNewest = (a, b) => b.date.localeCompare(a.date);

    if (sortBy === 'amount') {
      return transactions.sort((a, b) => Number(b.amount) - Number(a.amount) || byNewest(a, b));
    }
    if (sortBy === 'date') {
      return transactions.sort(byNewest);
    }
    if (sortBy === 'category') {
      return transactions.sort((a, b) =>
        a.category.localeCompare(b.category, 'es', { sensitivity: 'base' }) || byNewest(a, b),
      );
    }
    return transactions.sort((a, b) =>
      getRelevance(b, filters.searchTerm) - getRelevance(a, filters.searchTerm) || byNewest(a, b),
    );
  }, [filteredTransactions, filters.searchTerm, sortBy]);

  return (
    <Card as="section" className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Movimientos del mes</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {sortedTransactions.length === 1
              ? '1 movimiento'
              : `${sortedTransactions.length} movimientos`}
          </p>
        </div>
        <label className="flex h-9 items-center gap-2 self-start rounded-md border border-slate-200 bg-white px-2.5 text-slate-500 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-800 sm:self-auto">
          <ArrowDownWideNarrow size={15} aria-hidden="true" />
          <span className="sr-only">Ordenar movimientos por</span>
          <select
            aria-label="Ordenar movimientos por"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-full min-w-28 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
          >
            <option value="relevance">Relevancia</option>
            <option value="date">Fecha</option>
            <option value="amount">Importe</option>
            <option value="category">Categoría</option>
          </select>
        </label>
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
          <div className="space-y-2 p-3 xl:hidden">
            {sortedTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} layout="card" />
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-5 py-3 sm:px-6">Movimiento</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Método</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-5 py-3 text-right sm:px-6">Importe</th>
                <th scope="col" className="px-2 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
};

export default TransactionList;

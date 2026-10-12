import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Paperclip, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { triggerHaptic } from '../utils/haptics';

const TransactionItem = ({ transaction, layout = 'table' }) => {
  const { deleteTransaction, previewInvoice, downloadInvoice, setEditingTransaction, isAmountsHidden } = useFinance();
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isExpense = transaction.type === 'Gasto';
  const description = transaction.description?.trim();

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction.id);
      triggerHaptic();
    } catch (error) {
      setErrorMessage(`No se pudo eliminar el movimiento: ${error.message}`);
    }
  };

  const handlePreview = async () => {
    try {
      const url = await previewInvoice(transaction.id);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`No se pudo abrir la factura: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadInvoice(transaction.id, transaction.invoice.name);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`No se pudo abrir la factura: ${error.message}`);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setIsPreviewOpen(false);
  };

  const openEditor = () => setEditingTransaction(transaction);
  const handleRowKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditor();
    }
  };

  if (layout === 'card') {
    return (
      <article
        role="group"
        tabIndex={0}
        aria-label={`Movimiento: ${description || transaction.category}. Selecciónalo para editar.`}
        onClick={openEditor}
        onKeyDown={handleRowKeyDown}
        className="cursor-pointer rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:p-3"
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8 ${isExpense ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
            {isExpense ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 break-words text-[13px] font-medium leading-5 text-slate-900 dark:text-slate-100 sm:text-sm">
                {description || transaction.category}
              </p>
              <p className={`privacy-sensitive shrink-0 whitespace-nowrap text-[13px] font-semibold sm:text-sm ${isExpense ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {isExpense ? '−' : '+'}{formatCurrency(Number(transaction.amount))}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 sm:mt-2 sm:gap-x-2 sm:text-xs">
              <span>{transaction.category}</span>
              <span aria-hidden="true">·</span>
              <span>{transaction.paymentMethod || 'Sin método'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 sm:mt-2">
              <div>
                {transaction.invoice && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePreview();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                    aria-label={`Ver factura ${transaction.invoice.name}`}
                  >
                    <Paperclip size={12} />
                    Factura
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete();
                }}
                aria-label={`Eliminar ${description || transaction.category}`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
        {errorMessage && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>}
      </article>
    );
  }

  return (
    <>
      <tr
        className="group hidden cursor-pointer transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70 xl:table-row"
        tabIndex={0}
        aria-label={`Editar movimiento: ${description || transaction.category}`}
        onClick={openEditor}
        onKeyDown={handleRowKeyDown}
      >
        <td className="px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isExpense ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
              {isExpense ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
            </span>
            <div className="min-w-0">
              <p className="break-words font-medium text-slate-900 dark:text-slate-100">{description || transaction.category}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">{isExpense ? 'Gasto' : 'Ingreso'}</p>
                {transaction.invoice && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePreview();
                    }}
                    className="inline-flex max-w-36 items-center gap-1 truncate text-xs font-medium text-emerald-800 hover:text-emerald-950 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                    aria-label={`Ver factura ${transaction.invoice.name}`}
                    title={transaction.invoice.name}
                  >
                    <Paperclip size={12} className="shrink-0" />
                    Factura
                  </button>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{transaction.category}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">{transaction.paymentMethod || '—'}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</td>
        <td
          aria-label={isAmountsHidden ? 'Importe oculto' : undefined}
          className={`privacy-sensitive whitespace-nowrap px-5 py-3.5 text-right font-medium sm:px-6 ${isExpense ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}
        >
          {isExpense ? '−' : '+'}{formatCurrency(Number(transaction.amount))}
        </td>
        <td className="sticky right-0 z-10 w-12 bg-white px-2 py-3.5 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.5)] group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            aria-label={`Eliminar ${description || transaction.category}`}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            <Trash2 size={15} />
          </button>
        </td>
      </tr>
      {errorMessage && (
        <tr className="hidden xl:table-row">
          <td colSpan="6" role="alert" className="px-5 pb-3 text-sm text-rose-700 dark:text-rose-300 sm:px-6">
            {errorMessage}
          </td>
        </tr>
      )}
      {isPreviewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{transaction.invoice?.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vista previa de la factura</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Cerrar vista previa"
                  className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="min-h-[40vh] overflow-auto bg-slate-50 p-3 dark:bg-slate-950/60">
              {transaction.invoice?.type === 'application/pdf' ? (
                <iframe
                  title={transaction.invoice.name}
                  src={previewUrl}
                  className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white dark:border-slate-700"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={transaction.invoice?.name || 'Factura'}
                  className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionItem;

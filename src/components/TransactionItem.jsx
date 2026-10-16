import React, { useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Paperclip, Pencil, Scissors, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { triggerHaptic } from '../utils/haptics';

const TransactionItem = ({ transaction, layout = 'table' }) => {
  const {
    deleteTransaction,
    splitTransaction,
    previewInvoice,
    downloadInvoice,
    setEditingTransaction,
    isAmountsHidden,
  } = useFinance();
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [swipeActions, setSwipeActions] = useState(null);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const touchStartRef = useRef(null);
  const suppressCardClickRef = useRef(false);
  const isExpense = transaction.type === 'Gasto';
  const description = transaction.description?.trim();

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction.id);
      triggerHaptic('heavy');
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
  const handleCardTouchStart = (event) => {
    if (event.touches.length !== 1 || event.target.closest('button, input, select, a')) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };
  const handleCardTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    suppressCardClickRef.current = true;
    window.setTimeout(() => { suppressCardClickRef.current = false; }, 400);
    setSwipeActions(deltaX < 0 ? 'delete' : 'edit');
  };
  const handleCardClick = () => {
    if (suppressCardClickRef.current) {
      suppressCardClickRef.current = false;
      return;
    }
    if (swipeActions) {
      setSwipeActions(null);
      return;
    }
    openEditor();
  };
  const handleSplit = () => {
    try {
      splitTransaction(transaction.id, installmentCount);
      triggerHaptic('heavy');
      setIsSplitDialogOpen(false);
      setSwipeActions(null);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };
  const handleRowKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditor();
    }
  };

  if (layout === 'card') {
    const swipeOffset = swipeActions === 'delete'
      ? '-80px'
      : swipeActions === 'edit' ? (isExpense ? '160px' : '80px') : '0px';

    return (
      <>
      <div className="relative overflow-hidden rounded-lg" data-month-swipe-ignore>
        {swipeActions === 'edit' && (
          <div className={`absolute inset-y-0 left-0 flex items-center gap-1 bg-emerald-50 px-2 dark:bg-emerald-500/10 ${isExpense ? 'w-40' : 'w-20'}`}>
            <button
              type="button"
              onClick={() => {
                setSwipeActions(null);
                openEditor();
              }}
              className="inline-flex h-10 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            >
              <Pencil size={16} aria-hidden="true" />
              Editar
            </button>
            {isExpense && (
              <button
                type="button"
                onClick={() => setIsSplitDialogOpen(true)}
                className="inline-flex h-10 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                <Scissors size={16} aria-hidden="true" />
                Dividir
              </button>
            )}
          </div>
        )}
        {swipeActions === 'delete' && (
          <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-rose-50 dark:bg-rose-500/10">
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Eliminar ${description || transaction.category}`}
              className="inline-flex h-10 w-16 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-500/20"
            >
              <Trash2 size={16} aria-hidden="true" />
              Eliminar
            </button>
          </div>
        )}
        <article
          role="group"
          tabIndex={0}
          aria-label={`Movimiento: ${description || transaction.category}. Desliza a la izquierda para eliminar o a la derecha para editar${isExpense ? ' o dividir' : ''}.`}
          onClick={handleCardClick}
          onKeyDown={handleRowKeyDown}
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          onTouchCancel={() => { touchStartRef.current = null; }}
          style={{ transform: `translateX(${swipeOffset})` }}
          className="relative z-10 cursor-pointer border-b border-slate-50 bg-white p-2.5 shadow-sm transition-transform duration-200 ease-out touch-pan-y hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-neutral-700 dark:hover:bg-black sm:p-3"
        >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span data-color-icon={isExpense ? 'expense' : 'income'} className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8 ${isExpense ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
            {isExpense ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 break-words text-[13px] font-medium leading-5 text-slate-900 dark:text-slate-100 sm:text-sm">
                {description || transaction.category}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <p className={`privacy-sensitive whitespace-nowrap text-[13px] tabular-nums sm:text-sm ${isExpense ? 'font-semibold !text-rose-600 dark:!text-rose-400' : 'font-semibold !text-emerald-600 dark:!text-emerald-400'}`}>
                  {isExpense ? '−' : '+'}{formatCurrency(Number(transaction.amount))}
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 sm:mt-2 sm:gap-x-2 sm:text-xs">
              <span>{transaction.category}</span>
              <span aria-hidden="true">·</span>
              <span>{transaction.paymentMethod || 'Sin método'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
            {transaction.invoice && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePreview();
                }}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-400 sm:mt-2"
                aria-label={`Ver factura ${transaction.invoice.name}`}
              >
                <Paperclip size={12} />
                Factura
              </button>
            )}
          </div>
        </div>
        {errorMessage && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>}
        </article>
      </div>
      {isSplitDialogOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSplitDialogOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="split-expense-title" className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="split-expense-title" className="text-base font-semibold text-slate-950 dark:text-slate-50">Dividir gasto en cuotas</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description || transaction.category} · {formatCurrency(Number(transaction.amount))}
            </p>
            <label htmlFor="split-installment-count" className="mb-1.5 mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Número de cuotas
            </label>
            <select
              id="split-installment-count"
              value={installmentCount}
              onChange={(event) => setInstallmentCount(Number(event.target.value))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {Array.from({ length: 23 }, (_, index) => index + 2).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsSplitDialogOpen(false)} className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Cancelar
              </button>
              <button type="button" onClick={handleSplit} className="h-9 rounded-md bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                Dividir gasto
              </button>
            </div>
          </section>
        </div>
      )}
      </>
    );
  }

  return (
    <>
      <tr
        className="group hidden cursor-pointer transition-colors hover:bg-slate-50/70 dark:hover:bg-black xl:table-row"
        tabIndex={0}
        aria-label={`Editar movimiento: ${description || transaction.category}`}
        onClick={openEditor}
        onKeyDown={handleRowKeyDown}
      >
        <td className="px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span data-color-icon={isExpense ? 'expense' : 'income'} className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isExpense ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
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
          className={`privacy-sensitive whitespace-nowrap px-5 py-3.5 text-right tabular-nums sm:px-6 ${isExpense ? 'font-semibold !text-rose-600 dark:!text-rose-400' : 'font-semibold !text-emerald-600 dark:!text-emerald-400'}`}
        >
          {isExpense ? '−' : '+'}{formatCurrency(Number(transaction.amount))}
        </td>
        <td className="sticky right-0 z-10 w-12 bg-white px-2 py-3.5 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.5)] group-hover:bg-slate-50 dark:bg-slate-800 dark:group-hover:bg-black">
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-preview-title"
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <h3 id="invoice-preview-title" className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{transaction.invoice?.name}</h3>
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
import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileText, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { expenseCategories } from '../utils/categories';
import { getLocalDateString } from '../utils/helpers';
import { triggerHaptic } from '../utils/haptics';
import { getPushNotificationsEnabled, showAppNotification } from '../utils/pushNotifications';
import { Button } from './ui/button';

const MAX_INVOICE_SIZE = 10 * 1024 * 1024;
const paymentMethods = ['Efectivo', 'Tarjeta', 'Bizum', 'Transferencia', 'Domiciliación', 'Otro'];

const TransactionForm = ({ transaction = null, onClose }) => {
  const {
    addTransaction,
    updateTransaction,
    addCategory,
    setIsModalOpen,
    downloadInvoice,
    filters,
    allCategories,
    monthlyGoalsByMonth,
    transactions,
    activeProfileId,
  } = useFinance();
  const today = new Date();
  const selectedMonthDate = new Date(filters.year, filters.month, 1);
  const defaultDate = today.getFullYear() === filters.year && today.getMonth() === filters.month
    ? today
    : selectedMonthDate;
  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(selectedMonthDate);
  const [type, setType] = useState(transaction?.type || 'Gasto');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || '');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [category, setCategory] = useState(transaction?.category || expenseCategories[0]);
  const [date, setDate] = useState(() => transaction?.date || getLocalDateString(defaultDate));
  const [description, setDescription] = useState(transaction?.description || '');
  const [isInstallment, setIsInstallment] = useState(Boolean(transaction?.installment?.total) && transaction?.installment?.total > 1);
  const [installmentTotal, setInstallmentTotal] = useState(transaction?.installment?.total || 3);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [removeExistingInvoice, setRemoveExistingInvoice] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const categories = allCategories[type];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (onClose) onClose();
        else setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, setIsModalOpen]);

  const closeForm = () => {
    if (onClose) onClose();
    else setIsModalOpen(false);
  };

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setCategory(allCategories[nextType][0]);
    if (nextType === 'Ingreso') {
      setIsInstallment(false);
    }
    setErrorMessage('');
  };

  const handleAddCategory = (event) => {
    event.preventDefault();
    try {
      const createdCategory = addCategory(type, newCategory);
      setCategory(createdCategory);
      setNewCategory('');
      setShowNewCategory(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleInvoiceChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_INVOICE_SIZE) {
      setErrorMessage('La factura no puede superar los 10 MB.');
      return;
    }
    const allowedFile = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!allowedFile) {
      setErrorMessage('Elige una factura en PDF, JPG, PNG o WebP.');
      return;
    }
    setInvoiceFile(file);
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !category || !date || !paymentMethod) {
      setErrorMessage('Completa el importe, la categoría, la fecha y el método de pago.');
      return;
    }

    if (type === 'Gasto' && isInstallment) {
      const installmentCount = Number(installmentTotal);
      if (!Number.isFinite(installmentCount) || installmentCount < 2) {
        setErrorMessage('Las cuotas deben ser un número mayor o igual a 2.');
        return;
      }
    }

    try {
      const movement = {
        type,
        paymentMethod,
        amount: value,
        category,
        date,
        description: description.trim(),
        isInstallment: type === 'Gasto' && isInstallment,
        installmentTotal: type === 'Gasto' && isInstallment ? Number(installmentTotal) : undefined,
        invoiceFile,
        ...(removeExistingInvoice && { removeInvoice: true }),
      };
      if (transaction) await updateTransaction(transaction.id, movement);
      else {
        await addTransaction(movement);
        const targetMonth = date.slice(0, 7);
        const targetMonthGoals = monthlyGoalsByMonth[targetMonth] || { savings: 0, investment: 0 };
        const targetMonthBalance = transactions
          .filter((item) => item.date?.slice(0, 7) === targetMonth)
          .reduce((balance, item) => (
            balance + (item.type === 'Ingreso' ? 1 : -1) * (Number(item.amount) || 0)
          ), 0);
        const freeBalance = Math.max(
          0,
          targetMonthBalance - targetMonthGoals.savings - targetMonthGoals.investment,
        );
        if (type === 'Gasto' && value > freeBalance) {
          try {
            if (getPushNotificationsEnabled(activeProfileId)) {
              await showAppNotification({
                title: 'Gasto por encima de tu dinero libre',
                body: `El gasto de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)} supera tu saldo libre de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(freeBalance)}.`,
                tag: `balance-overspending-${activeProfileId}-${Date.now()}`,
                action: 'dashboard',
              });
            }
          } catch (notificationError) {
            console.error('No se pudo mostrar la alerta de gasto excesivo.', notificationError);
          }
        }
      }
      triggerHaptic();
      setAmount('');
      setDescription('');
      setInvoiceFile(null);
      closeForm();
    } catch (error) {
      setErrorMessage(`No se pudo guardar el movimiento. ${error.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
        className="relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
      >
        <button
          type="button"
          onClick={closeForm}
          aria-label="Cerrar"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
        >
          <X size={17} />
        </button>

        <div className="mb-6">
          <h2 id="transaction-title" className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            {transaction ? 'Editar movimiento' : 'Añadir movimiento'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {transaction ? 'Actualiza los datos de este movimiento.' : 'Apunta el sueldo que entra o un gasto del mes.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { value: 'Gasto', label: 'Gasto', Icon: ArrowDownLeft },
              { value: 'Ingreso', label: 'Sueldo / ingreso', Icon: ArrowUpRight },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                aria-pressed={type === value}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-all ${
                  type === value
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Importe</label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                autoFocus
                required
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 pr-12 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">EUR</span>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-200">Categoría</label>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory((visible) => !visible);
                  setErrorMessage('');
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <Plus size={14} />
                Nueva categoría
              </button>
            </div>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {showNewCategory && (
              <div className="mt-2 flex gap-2">
                <label className="sr-only" htmlFor="new-category">Nombre de la nueva categoría</label>
                <input
                  id="new-category"
                  type="text"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder={type === 'Ingreso' ? 'Ej. Alquiler recibido' : 'Ej. Mascotas'}
                  maxLength={40}
                  autoFocus
                  className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Button type="button" size="sm" onClick={handleAddCategory}>Añadir</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Fecha</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Concepto</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={type === 'Ingreso' ? 'Sueldo de octubre' : 'Compra del súper'}
                maxLength={100}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {transaction?.invoice && !removeExistingInvoice && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5 dark:border-slate-700">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadInvoice(transaction.id, transaction.invoice.name);
                    setErrorMessage('');
                  } catch (error) {
                    setErrorMessage(`No se pudo abrir la factura: ${error.message}`);
                  }
                }}
                className="flex min-w-0 items-center gap-2 text-sm text-emerald-800 hover:underline dark:text-emerald-400"
              >
                <FileText size={16} className="shrink-0" />
                <span className="truncate">{transaction.invoice.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setRemoveExistingInvoice(true)}
                aria-label="Quitar factura actual"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {type === 'Gasto' && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>¿Es un pago a plazos?</span>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(event) => setIsInstallment(event.target.checked)}
                  className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
                />
              </label>
              {isInstallment && (
                <div className="mt-3">
                  <label htmlFor="installment-total" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Número total de cuotas
                  </label>
                  <input
                    id="installment-total"
                    type="number"
                    min="2"
                    max="24"
                    value={installmentTotal}
                    onChange={(event) => setInstallmentTotal(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="payment-method" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Método de pago
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              required
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="" disabled>Selecciona cómo se pagó</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="invoice" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Factura <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
            </label>
            <input
              id="invoice"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleInvoiceChange}
              className="sr-only"
            />
            <div className="flex min-h-10 items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800">
              {invoiceFile ? <FileText size={16} className="shrink-0 text-emerald-700 dark:text-emerald-400" /> : <Paperclip size={16} className="shrink-0 text-slate-400 dark:text-slate-500" />}
              <label htmlFor="invoice" className="min-w-0 flex-1 cursor-pointer truncate">
                {invoiceFile ? invoiceFile.name : transaction?.invoice && !removeExistingInvoice ? 'Reemplazar factura (PDF o imagen, máx. 10 MB)' : 'Adjuntar PDF o imagen (máx. 10 MB)'}
              </label>
              {invoiceFile && (
                <button
                  type="button"
                  aria-label="Quitar factura"
                  onClick={() => setInvoiceFile(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={closeForm}
              variant="outline"
              className="h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-10"
            >
              {transaction ? 'Guardar cambios' : `Guardar en ${monthLabel}`}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default TransactionForm;

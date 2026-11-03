import React, { useState, useMemo } from 'react';
import { Camera, Paperclip, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { triggerHaptic } from '../utils/haptics';

function Icon({ name, size = 17 }) {
  const paths = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Comida', 'Alquiler/Hipoteca', 'Transporte', 'Ocio', 'Suscripciones', 'Mascotas', 'Salud', 'Ropa', 'Hogar', 'Viajes', 'Regalos', 'Inversiones', 'Deudas', 'Otros'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salario', 'Regalo', 'Inversiones', 'Ventas', 'Reembolso', 'Freelance', 'Otros'
];

const DEFAULT_PAYMENT_METHODS = ['Tarjeta', 'Efectivo', 'Bizum', 'Transferencia', 'Domicialización', 'Otros'];

const TransactionForm = ({ transaction = null, defaultType = 'expense', onClose }) => {
  const { 
    addTransaction, 
    updateTransaction, 
    allCategories, 
    transactions, 
    categoryLimits,
    scanReceipt 
  } = useFinance();

  const isEditing = Boolean(transaction);

  // Tipos: 'expense' | 'income' | 'investment' -> 'Gasto' | 'Ingreso'
  const initialType = transaction?.type || (defaultType === 'income' ? 'Ingreso' : 'Gasto');
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState(transaction?.amount ? String(transaction.amount) : '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || 'Tarjeta');
  const [invoice, setInvoice] = useState(transaction?.invoice || null);
  const [isScanning, setIsScanning] = useState(false);

  // Fusión sincronizada de categorías idéntica a CategoryLimitsForm
  const availableCategories = useMemo(() => {
    if (type === 'Ingreso') {
      const fromContext = allCategories?.Ingreso || [];
      const fromTx = transactions.filter(t => t.type === 'Ingreso').map(t => t.category);
      return Array.from(new Set([...DEFAULT_INCOME_CATEGORIES, ...fromContext, ...fromTx]));
    }
    const fromContext = allCategories?.Gasto || [];
    const fromTx = transactions.filter(t => t.type === 'Gasto').map(t => t.category);
    const fromLimits = Object.keys(categoryLimits || {});
    return Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...fromContext, ...fromTx, ...fromLimits]));
  }, [type, allCategories, transactions, categoryLimits]);

  const [category, setCategory] = useState(transaction?.category || availableCategories[0] || 'Comida');

  // Si cambia el tipo (Gasto / Ingreso) y la categoría actual no está en la nueva lista, reasignar
  const handleTypeChange = (newType) => {
    setType(newType);
    const newAvailable = newType === 'Ingreso'
      ? Array.from(new Set([...DEFAULT_INCOME_CATEGORIES, ...(allCategories?.Ingreso || [])]))
      : Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...(allCategories?.Gasto || []), ...Object.keys(categoryLimits || {})]));
    if (!newAvailable.includes(category)) {
      setCategory(newAvailable[0] || 'Otros');
    }
  };

  const handleReceiptScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scanReceipt) return;

    try {
      setIsScanning(true);
      const result = await scanReceipt(file);
      if (result) {
        if (result.amount) setAmount(String(result.amount));
        if (result.description) setDescription(result.description);
        if (result.date) setDate(result.date);
        if (result.category && availableCategories.includes(result.category)) {
          setCategory(result.category);
        }
      }
    } catch (err) {
      console.error('Error al escanear recibo:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoice({
      name: file.name,
      file,
      url: URL.createObjectURL(file)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || isNaN(parsedAmount)) return;

    const txData = {
      amount: parsedAmount,
      type,
      category,
      description: description.trim(),
      date,
      paymentMethod,
      ...(invoice ? { invoice } : {})
    };

    if (isEditing) {
      updateTransaction(transaction.id, txData);
    } else {
      addTransaction(txData);
    }

    triggerHaptic();
    onClose();
  };

  return (
    <div className="sheet-layer" style={{ zIndex: 90 }} onMouseDown={onClose}>
      <section 
        className="bottom-sheet transaction-sheet" 
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Cerrar">
          <Icon name="close" size={18} />
        </button>

        <div className="record-tabs">
          <button
            type="button"
            className={type === 'Gasto' ? 'active' : ''}
            onClick={() => handleTypeChange('Gasto')}
          >
            Gasto
          </button>
          <button
            type="button"
            className={type === 'Ingreso' ? 'active' : ''}
            onClick={() => handleTypeChange('Ingreso')}
          >
            Ingreso
          </button>
        </div>

        <h2 id="transaction-title">
          {isEditing ? 'Editar movimiento' : type === 'Gasto' ? 'Nuevo gasto' : 'Nuevo ingreso'}
        </h2>
        <p>Introduce los datos para registrar la transacción en tu balance.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Importe (€)
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              autoFocus={!isEditing}
            />
          </label>

          <label style={{ marginTop: '10px' }}>
            Concepto
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra semanal, Cena..."
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <label>
              Categoría
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Método de pago
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {DEFAULT_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ marginTop: '10px' }}>
            Fecha
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          {/* Adjuntos y OCR */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <label 
              className="sheet-submit" 
              style={{ 
                flex: 1, 
                background: '#f1f1ef', 
                color: '#090909', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px', 
                fontSize: '11px', 
                cursor: 'pointer',
                margin: 0
              }}
            >
              <Camera size={14} />
              {isScanning ? 'Escaneando...' : 'Escanear ticket'}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleReceiptScan} 
                style={{ display: 'none' }} 
                disabled={isScanning}
              />
            </label>

            <label 
              className="sheet-submit" 
              style={{ 
                flex: 1, 
                background: '#f1f1ef', 
                color: '#090909', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px', 
                fontSize: '11px', 
                cursor: 'pointer',
                margin: 0
              }}
            >
              <Paperclip size={14} />
              {invoice ? 'Factura lista' : 'Adjuntar factura'}
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {invoice && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f5f5f2', borderRadius: '8px', marginTop: '8px', fontSize: '11px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                📎 {invoice.name}
              </span>
              <button 
                type="button" 
                onClick={() => setInvoice(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <button className="sheet-submit limits-submit" style={{ marginTop: '18px', background: '#090909' }} type="submit">
            {isEditing ? 'Guardar' : 'Añadir'}
            <Icon name="arrow" size={16} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default TransactionForm;
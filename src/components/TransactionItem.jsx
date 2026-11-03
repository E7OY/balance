import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Pencil, Paperclip } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { triggerHaptic } from '../utils/haptics';

function Icon({ name, size = 16 }) {
  const paths = {
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    chevron: <path d="m9 7 5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const TransactionItem = ({ transaction, layout = 'list' }) => {
  const { deleteTransaction, setEditingTransaction, downloadInvoice } = useFinance();
  
  // Estados para deslizar y para el detalle
  const [swipeActions, setSwipeActions] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [phoneNode, setPhoneNode] = useState(null);
  
  const touchStartRef = useRef(null);
  const isExpense = transaction.type === 'Gasto';
  
  // Buscamos el contenedor '.phone' para renderizar el modal encima de él
  useEffect(() => {
    setPhoneNode(document.querySelector('.phone') || document.body);
  }, []);

  // Lógica de deslizar (Swipe)
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (!start || e.changedTouches.length !== 1) return;
    const deltaX = e.changedTouches[0].clientX - start.x;
    const deltaY = e.changedTouches[0].clientY - start.y;
    
    // Si el movimiento es muy vertical, no hacemos swipe
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    
    setSwipeActions(deltaX < 0 ? 'delete' : 'edit');
  };

  const handleItemClick = () => {
    if (swipeActions) {
      setSwipeActions(null); // Si estaba deslizado, el clic lo cierra
    } else {
      setIsDetailOpen(true); // Si no estaba deslizado, abre el detalle
    }
  };

  const swipeOffset = swipeActions === 'delete' ? '-70px' : swipeActions === 'edit' ? '70px' : '0px';
  const displayMoney = (val) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  return (
    <>
      <div className="relative overflow-hidden" data-month-swipe-ignore>
        
        {/* FONDO: Acciones al deslizar */}
        {swipeActions === 'edit' && (
          <div className="absolute inset-y-0 left-0 flex w-[70px] items-center justify-center bg-[#f1f1ef] dark:bg-[#242422]">
            <button onClick={() => setEditingTransaction(transaction)} className="flex h-full w-full flex-col items-center justify-center gap-1 text-[9px] font-bold text-[#090909] dark:text-[#f5f5f2]">
              <Pencil size={15} /> Editar
            </button>
          </div>
        )}
        
        {swipeActions === 'delete' && (
          <div className="absolute inset-y-0 right-0 flex w-[70px] items-center justify-center bg-[#df242b]">
            <button 
              onClick={() => { triggerHaptic(); deleteTransaction(transaction.id); }} 
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-[9px] font-bold text-white"
            >
              <Trash2 size={15} /> Borrar
            </button>
          </div>
        )}

        {/* FRENTE: Elemento de la lista original */}
        <button
          className="movement bg-white dark:bg-transparent"
          onClick={handleItemClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translateX(${swipeOffset})`, transition: 'transform 0.2s ease-out' }}
        >
          <span className="movement-icon">
            <Icon name="receipt" size={16} />
          </span>
          <span className="movement-info">
            <strong>{transaction.description || transaction.category}</strong>
            <small className="flex items-center gap-1">
              {transaction.category} · {transaction.date}
            </small>
          </span>
          <strong className={`movement-amount ${!isExpense ? 'income' : ''}`}>
            {!isExpense ? '+' : '−'}
            {displayMoney(Number(transaction.amount))}
          </strong>
          <Icon name="chevron" size={14} />
        </button>
      </div>

      {/* MODAL DE DETALLE (Renderizado con portal en el .phone) */}
      {isDetailOpen && phoneNode && createPortal(
        <div className="sheet-layer" onMouseDown={() => setIsDetailOpen(false)}>
          <section
            className="bottom-sheet detail-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="detail-merchant-icon">
              <Icon name="receipt" size={19} />
            </div>
            <button
              className="sheet-close"
              onClick={() => setIsDetailOpen(false)}
              aria-label="Cerrar"
            >
              <Icon name="close" size={18} />
            </button>
            
            <p className="detail-kicker">
              {!isExpense ? "INGRESO RECIBIDO" : "PAGO COMPLETADO"}
            </p>
            <h2 id="detail-title">{transaction.description || transaction.category}</h2>
            
            <strong className="detail-amount">
              {!isExpense ? "+" : "−"}
              {displayMoney(Number(transaction.amount))}
            </strong>
            
            <div className="detail-list">
              <div>
                <span>Fecha</span>
                <strong>{transaction.date}</strong>
              </div>
              <div>
                <span>Categoría</span>
                <strong>{transaction.category}</strong>
              </div>
              <div>
                <span>Método</span>
                <strong>{transaction.paymentMethod || "Tarjeta"}</strong>
              </div>
              {transaction.invoice && (
                <div>
                  <span>Factura adjunta</span>
                  <button 
                    onClick={() => downloadInvoice(transaction.id, transaction.invoice.name)}
                    className="flex items-center gap-1 text-[#15924c] font-semibold"
                  >
                    <Paperclip size={12} /> Descargar
                  </button>
                </div>
              )}
              <div>
                <span>Estado</span>
                <strong className="detail-status">Completado</strong>
              </div>
            </div>
            
            {/* Añadimos el botón de editar aquí también por comodidad */}
            <div className="flex gap-2 mt-5">
               <button
                 className="detail-action"
                 onClick={() => {
                   setIsDetailOpen(false);
                   setEditingTransaction(transaction);
                 }}
                 style={{ background: '#f1f1ef', color: '#090909' }}
               >
                 Editar 
                 <Pencil size={14} />
               </button>
               
               <button
                 className="detail-action"
                 onClick={() => setIsDetailOpen(false)}
               >
                 Cerrar detalle
                 <Icon name="arrow" size={16} />
               </button>
            </div>
          </section>
        </div>,
        phoneNode
      )}
    </>
  );
};

export default TransactionItem;
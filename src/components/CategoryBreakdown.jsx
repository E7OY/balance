import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { getCategoryVisuals } from './TransactionItem';
import { formatCurrency } from '../utils/helpers';

const CategoryBreakdown = () => {
  const {
    expenseBreakdown,
    totalExpenses,
    monthlyCategoryCaps,
    categoryLimits,
    isAmountsHidden,
  } = useFinance();

  const limits = categoryLimits || monthlyCategoryCaps || {};

  if (!Array.isArray(expenseBreakdown) || expenseBreakdown.length === 0) return null;

  const displayMoney = (val) => (isAmountsHidden ? '•••• €' : formatCurrency(val));

  return (
    <div
      style={{
        backgroundColor: 'var(--canvas-light)',
        color: 'var(--ink)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>
          Gastos por categoría
        </span>
        <span
          className="privacy-sensitive"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-mute)', fontVariantNumeric: 'tabular-nums' }}
        >
          {displayMoney(totalExpenses)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {expenseBreakdown.map((item) => {
          const limit = Number(limits[item.category]) || 0;
          const exceeded = limit > 0 && item.amount > limit;
          const percentage = limit > 0
            ? Math.min(100, (item.amount / limit) * 100)
            : Math.min(100, item.percentage || 0);
          const visuals = getCategoryVisuals(item.category, 'Gasto', 16);

          return (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  backgroundColor: visuals.bg,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {visuals.icon}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.category}
                  </span>

                  <span
                    className="privacy-sensitive"
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                      color: exceeded ? 'var(--danger-red)' : 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    {displayMoney(item.amount)}
                    {limit > 0 && (
                      <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>
                        {' '}
                        / {displayMoney(limit)}
                      </span>
                    )}
                  </span>
                </div>

                <div
                  style={{
                    height: '5px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--surface-soft)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      borderRadius: '999px',
                      backgroundColor: exceeded ? 'var(--danger-red)' : visuals.bg,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {exceeded && (
                  <span
                    className="privacy-sensitive"
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: 'var(--danger-red)',
                      marginTop: '4px',
                    }}
                  >
                    Tope superado por {displayMoney(item.amount - limit)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
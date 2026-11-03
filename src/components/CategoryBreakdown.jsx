import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';

const CategoryBreakdown = () => {
  const { expenseBreakdown, totalExpenses, categoryLimits } = useFinance();

  // Si no hay límites en el contexto, usamos unos por defecto o 0
  const limits = categoryLimits || {};

  if (expenseBreakdown.length === 0) return null;

  return (
    <div className="category-metrics">
      <div className="category-metrics-title">
        <strong>Gastos por categoría</strong>
        <span className="privacy-sensitive">{formatCurrency(totalExpenses)}</span>
      </div>
      
      {expenseBreakdown.map((category) => {
        const limit = limits[category.category] || 0;
        const exceeded = limit > 0 && category.amount > limit;
        const percentage = limit > 0 ? Math.min(100, (category.amount / limit) * 100) : category.percentage;

        return (
          <div className={`category-metric ${exceeded ? "exceeded" : ""}`} key={category.category}>
            <div>
              <span>{category.category}</span>
              <strong className="privacy-sensitive">{formatCurrency(category.amount)}</strong>
            </div>
            {exceeded && (
              <p className="category-alert">
                Tope superado por {formatCurrency(category.amount - limit)}
              </p>
            )}
            <i>
              <b style={{ width: `${percentage}%` }} />
            </i>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryBreakdown;
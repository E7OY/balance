import React from 'react';

const Card = ({ as: Component = 'div', className = '', ...props }) => (
  <Component
    className={`rounded-3xl border-0 bg-white text-slate-950 shadow-none transition-colors dark:bg-zinc-900 dark:text-white ${className}`}
    //className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 ${className}`}
    {...props}
  />
);

const CardHeader = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className = '', ...props }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const CardDescription = ({ className = '', ...props }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props} />
);

const CardContent = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export { Card, CardContent, CardDescription, CardHeader, CardTitle };

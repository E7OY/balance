import React from 'react';

const Card = ({ as: Component = 'div', className = '', ...props }) => (
  <Component
    className={`rounded-3xl border-0 bg-white text-slate-950 dark:border-0 transition-colors dark:bg-zinc-900 dark:text-white dark:shadow-none shadow-[0_5px_15px_rgba(40,50,45,0.07),0_1px_4px_rgba(40,50,45,0.03)] ${className}`}
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
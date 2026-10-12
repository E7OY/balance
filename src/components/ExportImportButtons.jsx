import React, { useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const ExportImportButtons = () => {
  const { exportData, exportCsv, exportPdf, importData } = useFinance();
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsWorking(true);
    setMessage('');
    try {
      await importData(file);
      setMessage('Copia importada correctamente.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleExport = async (format) => {
    setIsWorking(true);
    setMessage('');
    try {
      const exporters = { json: exportData, csv: exportCsv, pdf: exportPdf };
      await exporters[format]();
      setMessage(format === 'json' ? 'Copia JSON descargada correctamente.' : `Archivo ${format.toUpperCase()} descargado correctamente.`);
    } catch (error) {
      setMessage(`No se pudo exportar el archivo: ${error.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const exportOptions = [
    { format: 'csv', label: 'CSV', description: 'Todos los movimientos · Excel o Sheets', Icon: FileSpreadsheet },
    { format: 'pdf', label: 'PDF', description: 'Resumen de todos los movimientos', Icon: FileText },
    { format: 'json', label: 'JSON', description: 'Copia completa con facturas', Icon: FileJson },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
        aria-label="Importar copia de seguridad"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isWorking}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
      >
        <Upload size={15} />
        Importar copia
      </button>
      <details ref={exportMenuRef} className="relative">
        <summary
          aria-disabled={isWorking}
          className={`inline-flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 ${isWorking ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Download size={15} />
          Exportar datos
          <ChevronDown size={14} />
        </summary>
        <div className="absolute bottom-full right-0 z-20 mb-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {exportOptions.map(({ format, label, description, Icon }) => (
            <button
              key={format}
              type="button"
              disabled={isWorking}
              onClick={() => {
                exportMenuRef.current.open = false;
                handleExport(format);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </details>
      {message && (
        <p role={message.startsWith('No se pudo') ? 'alert' : 'status'} className="basis-full text-right text-xs text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default ExportImportButtons;

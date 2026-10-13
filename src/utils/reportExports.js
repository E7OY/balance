import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, getLocalDateString } from './helpers';

const downloadBlob = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const csvCell = (value, protectFormula = false) => {
  const text = String(value ?? '');
  const safeText = protectFormula && /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

export const exportTransactionsCsv = (transactions) => {
  const rows = [
    ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Método de pago', 'Importe (EUR)', 'Factura'].map(csvCell),
    ...[...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((transaction) => [
        csvCell(transaction.date),
        csvCell(transaction.type, true),
        csvCell(transaction.category, true),
        csvCell(transaction.description || '', true),
        csvCell(transaction.paymentMethod || ''),
        csvCell(Number(transaction.amount).toFixed(2).replace('.', ',')),
        csvCell(transaction.invoice?.name || '', true),
      ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.join(';')).join('\r\n')}`;
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'finanzas_personales.csv');
};

export const exportTransactionsPdf = (transactions) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const dateX = margin + 1;
  const descriptionX = margin + 24;
  const categoryX = margin + 82;
  const paymentMethodX = margin + 112;
  const amountX = pageWidth - margin - 2;
  const amountWidth = 36;
  const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const totalIncome = transactions.reduce(
    (total, transaction) => total + (transaction.type === 'Ingreso' ? Number(transaction.amount) : 0),
    0,
  );
  const totalExpenses = transactions.reduce(
    (total, transaction) => total + (transaction.type === 'Gasto' ? Number(transaction.amount) : 0),
    0,
  );

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 44, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(19);
  pdf.text('Resumen de finanzas personales', margin, 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Exportado el ${formatDate(getLocalDateString())}`, margin, 29);
  pdf.text(`${transactions.length} movimientos`, margin, 36);

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('INGRESOS', margin, 57);
  pdf.text('GASTOS', margin + 61, 57);
  pdf.text('DISPONIBLE', margin + 122, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  pdf.text(formatCurrency(totalIncome), margin, 64);
  pdf.text(formatCurrency(totalExpenses), margin + 61, 64);
  pdf.text(formatCurrency(totalIncome - totalExpenses), margin + 122, 64);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, 71, pageWidth - margin, 71);

  let y = 81;
  const drawColumnHeaders = () => {
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y - 6, contentWidth, 10, 'F');
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('FECHA', dateX, y);
    pdf.text('MOVIMIENTO', descriptionX, y);
    pdf.text('CATEGORÍA', categoryX, y);
    pdf.text('MÉTODO', paymentMethodX, y);
    pdf.text('IMPORTE', amountX, y, { align: 'right' });
    y += 9;
  };

  const drawPageHeader = () => {
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Resumen de finanzas personales · continuación', margin, 15);
    y = 24;
    drawColumnHeaders();
  };

  drawColumnHeaders();

  if (sortedTransactions.length === 0) {
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Todavía no hay movimientos.', margin, y + 3);
  }

  sortedTransactions.forEach((transaction, index) => {
    const description = transaction.description?.trim() || transaction.category;
    const descriptionLines = pdf.splitTextToSize(description, 54);
    const categoryLines = pdf.splitTextToSize(transaction.category || '—', 26);
    const paymentMethodLines = pdf.splitTextToSize(transaction.paymentMethod || '—', 24);
    const invoiceLines = transaction.invoice
      ? pdf.splitTextToSize(`Factura: ${transaction.invoice.name}`, 54)
      : [];
    const lineCount = Math.max(descriptionLines.length, categoryLines.length, paymentMethodLines.length, 1) + invoiceLines.length;
    const rowHeight = Math.max(10, lineCount * 4 + 3);

    if (y + rowHeight > pageHeight - 18) {
      pdf.addPage();
      drawPageHeader();
    }

    if (index % 2 === 1) {
      pdf.setFillColor(250, 251, 252);
      pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
    }

    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const compactDate = transaction.date.split('-').reverse().join('/');
    pdf.text(compactDate, dateX, y);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(descriptionLines, descriptionX, y);
    if (invoiceLines.length) {
      pdf.setTextColor(5, 120, 88);
      pdf.setFontSize(7);
      pdf.text(invoiceLines, descriptionX, y + descriptionLines.length * 4);
    }

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.text(categoryLines, categoryX, y);
    pdf.text(paymentMethodLines, paymentMethodX, y);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(transaction.type === 'Ingreso' ? 4 : 15, transaction.type === 'Ingreso' ? 120 : 23, transaction.type === 'Ingreso' ? 87 : 42);
    const prefix = transaction.type === 'Ingreso' ? '+' : '-';
    const amountText = `${prefix}${formatCurrency(Number(transaction.amount))}`;
    if (pdf.getTextWidth(amountText) > amountWidth) pdf.setFontSize(8);
    pdf.text(amountText, amountX, y, { align: 'right' });

    y += rowHeight;
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  pdf.save('finanzas_personales.pdf');
};

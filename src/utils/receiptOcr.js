const normalizeText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es');

const parseMoney = (value) => {
  let normalized = value.replace(/[\s€]/g, '');
  const commaIndex = normalized.lastIndexOf(',');
  const dotIndex = normalized.lastIndexOf('.');

  if (commaIndex > dotIndex) {
    normalized = normalized.replaceAll('.', '').replace(',', '.');
  } else if (dotIndex > commaIndex) {
    normalized = normalized.replaceAll(',', '');
    if (normalized.length - normalized.lastIndexOf('.') - 1 !== 2) {
      normalized = normalized.replaceAll('.', '');
    }
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const extractAmount = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const candidates = [];
  const numberPattern = String.raw`(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:[.,]\d{1,2})?`;
  const currencyPattern = new RegExp(String.raw`(?:(${numberPattern})\s*€|€\s*(${numberPattern}))`, 'gi');
  const decimalPattern = /\b\d+(?:[.,]\d{2})\b/g;

  lines.forEach((line, lineIndex) => {
    const normalizedLine = normalizeText(line);
    const priority = /total a pagar|importe total|total|a pagar|importe|pago/.test(normalizedLine) ? 10 : 0;
    const penalty = /cambio|descuento|iva|base imponible|tarjeta|efectivo/.test(normalizedLine) ? -5 : 0;
    const score = priority + penalty;
    const currencyMatches = [...line.matchAll(currencyPattern)];

    if (currencyMatches.length > 0) {
      currencyMatches.forEach((match) => {
        const amount = parseMoney(match[1] || match[2]);
        if (amount !== null) candidates.push({ amount, score: score + 20, lineIndex });
      });
      return;
    }

    if (priority > 0) {
      [...line.matchAll(decimalPattern)].forEach((match) => {
        const amount = parseMoney(match[0]);
        if (amount !== null) candidates.push({ amount, score, lineIndex });
      });
    }
  });

  if (candidates.length === 0) {
    lines.forEach((line, lineIndex) => {
      [...line.matchAll(new RegExp(numberPattern, 'g'))].forEach((match) => {
        const amount = parseMoney(match[0]);
        if (amount !== null) candidates.push({ amount, score: 0, lineIndex });
      });
    });
  }

  candidates.sort((first, second) => second.score - first.score || second.amount - first.amount || second.lineIndex - first.lineIndex);
  return candidates[0]?.amount ?? null;
};

const buildIsoDate = (year, month, day) => {
  const normalizedYear = year < 100 ? (year < 70 ? 2000 + year : 1900 + year) : year;
  const date = new Date(Date.UTC(normalizedYear, month - 1, day));
  if (date.getUTCFullYear() !== normalizedYear || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${normalizedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const extractDate = (text) => {
  const isoMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) return buildIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));

  const localMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
  if (localMatch) return buildIsoDate(Number(localMatch[3]), Number(localMatch[2]), Number(localMatch[1]));

  const monthNumbers = {
    ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4,
    may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8,
    sep: 9, septiembre: 9, set: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11,
    dic: 12, diciembre: 12,
  };
  const textDateMatch = normalizeText(text).match(/\b(\d{1,2})\s+([a-z]{3,9})\.?\s+(20\d{2})\b/);
  if (!textDateMatch) return null;
  const month = monthNumbers[textDateMatch[2]];
  return month ? buildIsoDate(Number(textDateMatch[3]), month, Number(textDateMatch[1])) : null;
};

const categoryKeywords = [
  ['Comida', /supermerc|alimentacion|restaurante|cafeteria|panaderia|carniceria|fruteria|comida|mercadona|carrefour|lidl|aldi|dia\b/],
  ['Alquiler/Hipoteca', /alquiler|hipoteca/],
  ['Transporte', /gasolina|gasolinera|combustible|taxi|metro|autobus|bus\b|tren|parking|aparcamiento/],
  ['Ocio', /cine|teatro|concierto|museo|parque|ocio|deporte/],
  ['Suscripciones', /suscripcion|netflix|spotify|disney|prime video|hbo/],
  ['Servicios', /electricidad|factura de luz|factura de agua|agua|internet|telefonia|luz\b|energia/],
  ['Salud', /farmacia|farmaceut|medico|clinica|hospital|salud/],
  ['Educación', /educacion|escuela|universidad|curso|academia|libro/],
  ['Ropa', /ropa|zapateria|calzado|vestido|camisa/],
  ['Hogar', /ferreteria|mueble|decoracion|hogar|menaje/],
  ['Viajes', /hotel|vuelo|aerolinea|avion|viaje|hostal/],
  ['Deudas', /prestamo|deuda|credito/],
];

const paymentMethodKeywords = [
  ['Domiciliación', /domiciliacion|adeudo\s+sepa|recibo\s+domiciliado/],
  ['Bizum', /\bbizum\b/],
  ['Transferencia', /transferencia|transfer\s+bank|sepa/],
  ['Efectivo', /\befectivo\b|\bcash\b|pago\s+en\s+metalico/],
  ['Tarjeta', /\btarjeta\b|\bvisa\b|master\s?card|\bmaestro\b|contactless|credito|debito/],
];

const suggestCategory = (text, categories) => {
  const normalizedText = normalizeText(text);
  const suggestion = categoryKeywords.find(([, keywords]) => keywords.test(normalizedText))?.[0];
  return categories.find((category) => normalizeText(category) === normalizeText(suggestion || '')) || null;
};

const suggestPaymentMethod = (text) => {
  const normalizedText = normalizeText(text);
  return paymentMethodKeywords.find(([, keywords]) => keywords.test(normalizedText))?.[0] || null;
};

export const scanReceipt = async (file, categories, onProgress) => {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('spa', 1, {
    logger: ({ status, progress }) => {
      if (status === 'recognizing text') onProgress?.(Math.round(progress * 100));
    },
  });

  try {
    const { data } = await worker.recognize(file);
    return {
      amount: extractAmount(data.text),
      date: extractDate(data.text),
      category: suggestCategory(data.text, categories),
      paymentMethod: suggestPaymentMethod(data.text),
    };
  } finally {
    await worker.terminate();
  }
};
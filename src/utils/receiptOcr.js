const normalizeText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es');

// El OCR confunde a menudo la letra O con el cero dentro de las cifras (1O,5O -> 10,50).
const fixNumericTokens = (text) => text.replace(/[\dOo.,/-]{2,}/g, (token) => (
  /\d/.test(token) ? token.replace(/[Oo]/g, '0') : token
));

// Solo para detectar palabras clave: "T0TAL" -> "total".
const toKeywordText = (line) => normalizeText(line).replace(/0/g, 'o');

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

const numberPattern = String.raw`(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:[.,]\d{1,2})?`;
const currencyPattern = String.raw`(?:€|eur(?:os?)?\b)`;
const currencyAmountRegex = new RegExp(
  String.raw`(?:(${numberPattern})\s*${currencyPattern}|${currencyPattern}\s*(${numberPattern}))`,
  'gi',
);
const decimalAmountRegex = /\d+(?:[.,]\d{3})*[.,]\d{2}(?!\d)/g;
const dateLikeRegex = /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/;

const subtotalLine = /sub\s?-?total/;
const totalLine = /total a pagar|importe total|total factura|total compra|total venta|importe a pagar|\btotal\b|\ba pagar\b/;
const weakTotalLine = /\b(importe|pagado|pago|cobrado|venta)\b/;
const ignoredLine = /cambio|devuelto|entregado|recibido|descuento|\bdto\b|propina|puntos|ahorro/;
const taxLine = /\biva\b|base imponible|\bbase\b|cuota/;
const cashLine = /efectivo|metalico/;

// Puntuación de cada línea según lo probable que sea la del total del ticket.
const scoreLine = (keywordText) => {
  if (subtotalLine.test(keywordText)) return -10;
  if (ignoredLine.test(keywordText)) return -30;
  const isTotal = totalLine.test(keywordText);
  if (isTotal) return 40;
  if (taxLine.test(keywordText)) return -30;
  if (cashLine.test(keywordText)) return -20;
  if (weakTotalLine.test(keywordText)) return 15;
  return 0;
};

const findAmounts = (line, { allowDecimals }) => {
  const currencyMatches = [...line.matchAll(currencyAmountRegex)];
  if (currencyMatches.length > 0) {
    return currencyMatches
      .map((match) => ({ amount: parseMoney(match[1] || match[2]), hasCurrency: true }))
      .filter(({ amount }) => amount !== null);
  }
  if (!allowDecimals || dateLikeRegex.test(line)) return [];
  return [...line.matchAll(decimalAmountRegex)]
    .map((match) => ({ amount: parseMoney(match[0]), hasCurrency: false }))
    .filter(({ amount }) => amount !== null);
};

const extractAmount = (text) => {
  const lines = fixNumericTokens(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scores = lines.map((line) => scoreLine(toKeywordText(line)));
  const candidates = [];

  lines.forEach((line, lineIndex) => {
    const lineScore = scores[lineIndex];
    const found = findAmounts(line, { allowDecimals: lineScore > 0 });
    found.forEach(({ amount, hasCurrency }) => {
      candidates.push({ amount, score: lineScore + (hasCurrency ? 5 : 0), lineIndex });
    });

    // "TOTAL A PAGAR" en una línea y el importe en la siguiente.
    if (found.length === 0 && lineScore > 0 && lines[lineIndex + 1] && scores[lineIndex + 1] >= 0) {
      findAmounts(lines[lineIndex + 1], { allowDecimals: true }).forEach(({ amount }) => {
        candidates.push({ amount, score: lineScore - 2, lineIndex: lineIndex + 1 });
      });
    }
  });

  const likelyTotals = candidates.filter((candidate) => candidate.score > 0);
  if (likelyTotals.length > 0) {
    likelyTotals.sort((first, second) => (
      second.score - first.score || second.amount - first.amount || second.lineIndex - first.lineIndex
    ));
    return likelyTotals[0].amount;
  }

  // Sin pistas claras: el mayor importe con decimales de las líneas no descartadas.
  const fallbackAmounts = lines.flatMap((line, lineIndex) => (
    scores[lineIndex] >= 0 ? findAmounts(line, { allowDecimals: true }).map(({ amount }) => amount) : []
  ));
  return fallbackAmounts.length > 0 ? Math.max(...fallbackAmounts) : null;
};

const buildIsoDate = (year, month, day) => {
  const normalizedYear = year < 100 ? (year < 70 ? 2000 + year : 1900 + year) : year;
  const date = new Date(Date.UTC(normalizedYear, month - 1, day));
  if (date.getUTCFullYear() !== normalizedYear || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${normalizedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Descarta fechas mal leídas: anteriores al 2000 o más de un par de días en el futuro.
const isPlausibleDate = (isoDate) => {
  if (!isoDate || Number(isoDate.slice(0, 4)) < 2000) return false;
  return new Date(`${isoDate}T00:00:00`).getTime() <= Date.now() + 2 * 24 * 60 * 60 * 1000;
};

const firstPlausibleDate = (matches, build) => {
  for (const match of matches) {
    const isoDate = build(match);
    if (isPlausibleDate(isoDate)) return isoDate;
  }
  return null;
};

const monthNumbers = {
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4,
  may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8,
  sep: 9, septiembre: 9, set: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
};

const extractDate = (text) => {
  const fixedText = fixNumericTokens(text);

  const isoDate = firstPlausibleDate(
    [...fixedText.matchAll(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g)],
    (match) => buildIsoDate(Number(match[1]), Number(match[2]), Number(match[3])),
  );
  if (isoDate) return isoDate;

  const localDate = firstPlausibleDate(
    [...fixedText.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g)],
    (match) => buildIsoDate(Number(match[3]), Number(match[2]), Number(match[1])),
  );
  if (localDate) return localDate;

  return firstPlausibleDate(
    [...normalizeText(fixedText).matchAll(/\b(\d{1,2})\s+([a-z]{3,9})\.?\s+(20\d{2})\b/g)],
    (match) => {
      const month = monthNumbers[match[2]];
      return month ? buildIsoDate(Number(match[3]), month, Number(match[1])) : null;
    },
  );
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

const TARGET_LONG_SIDE = 2200;

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo abrir la imagen.'));
  };
  image.src = url;
});

// Las fotos del móvil son enormes y con poco contraste: se reescalan, se pasan a grises y se estira el contraste.
// Si algo falla se usa la foto original.
const prepareImageForOcr = async (file) => {
  try {
    const image = await loadImage(file);
    const longSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(3, Math.max(0.2, TARGET_LONG_SIDE / longSide));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    const histogram = new Uint32Array(256);
    for (let index = 0; index < data.length; index += 4) {
      const gray = Math.round(0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]);
      data[index] = gray;
      histogram[gray] += 1;
    }

    const pixelCount = canvas.width * canvas.height;
    let low = 0;
    let high = 255;
    let accumulated = 0;
    for (let level = 0; level < 256; level += 1) {
      accumulated += histogram[level];
      if (accumulated >= pixelCount * 0.01) {
        low = level;
        break;
      }
    }
    accumulated = 0;
    for (let level = 255; level >= 0; level -= 1) {
      accumulated += histogram[level];
      if (accumulated >= pixelCount * 0.01) {
        high = level;
        break;
      }
    }
    const range = high - low;
    for (let index = 0; index < data.length; index += 4) {
      const stretched = range >= 30
        ? Math.min(255, Math.max(0, Math.round(((data[index] - low) * 255) / range)))
        : data[index];
      data[index] = stretched;
      data[index + 1] = stretched;
      data[index + 2] = stretched;
      data[index + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob || file;
  } catch (error) {
    console.warn('No se pudo preparar la imagen del recibo; se usa la original.', error);
    return file;
  }
};

export const scanReceipt = async (file, categories, onProgress) => {
  const image = await prepareImageForOcr(file);
  const { createWorker } = await import('tesseract.js');
  let stageStart = 0;
  let stageWeight = 0.7;
  const worker = await createWorker('spa', 1, {
    logger: ({ status, progress }) => {
      if (status === 'recognizing text') {
        onProgress?.(Math.min(99, Math.round(stageStart + progress * 100 * stageWeight)));
      }
    },
  });

  try {
    // 4 = una columna de texto de tamaños variables (lo habitual en un ticket).
    await worker.setParameters({ tessedit_pageseg_mode: '4', preserve_interword_spaces: '1' }).catch(() => {});
    const firstPass = await worker.recognize(image);
    let text = firstPass.data.text;
    let amount = extractAmount(text);

    if (amount === null) {
      // Segunda lectura tratando la foto como un solo bloque de texto.
      stageStart = 70;
      stageWeight = 0.3;
      await worker.setParameters({ tessedit_pageseg_mode: '6' }).catch(() => {});
      const secondPass = await worker.recognize(image);
      amount = extractAmount(secondPass.data.text) ?? extractAmount(`${text}\n${secondPass.data.text}`);
      text = `${text}\n${secondPass.data.text}`;
    }

    onProgress?.(100);
    return {
      amount,
      date: extractDate(text),
      category: suggestCategory(text, categories),
      paymentMethod: suggestPaymentMethod(text),
    };
  } finally {
    await worker.terminate();
  }
};
import { getFinnhubData, sendJson, sendMethodNotAllowed } from '../_marketData.js';

export default async function handler(request, response) {
  if (sendMethodNotAllowed(request, response)) return;

  const symbol = typeof request.query?.symbol === 'string' ? request.query.symbol.trim() : '';
  if (!/^[\w.^=-]{1,30}$/.test(symbol)) {
    sendJson(response, 400, { error: 'El símbolo del activo no es válido.' });
    return;
  }

  try {
    const [quote, profile] = await Promise.all([
      getFinnhubData('quote', { symbol }),
      getFinnhubData('stock/profile2', { symbol }),
    ]);
    const price = Number(quote.c);
    const currency = typeof profile.currency === 'string' ? profile.currency.toUpperCase() : '';
    if (!Number.isFinite(price) || price <= 0 || !currency) {
      throw new Error('No hay una cotización disponible para este activo.');
    }

    let priceEur = price;
    if (currency !== 'EUR') {
      const fxUrl = new URL('https://api.frankfurter.dev/v1/latest');
      fxUrl.searchParams.set('base', currency);
      fxUrl.searchParams.set('symbols', 'EUR');
      const fxResponse = await fetch(fxUrl, { signal: AbortSignal.timeout(8000) });
      if (!fxResponse.ok) {
        throw new Error('No se pudo convertir el precio a euros.');
      }
      const exchangeRate = Number((await fxResponse.json()).rates?.EUR);
      if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
        throw new Error('No se encontró un cambio válido para convertir el precio a euros.');
      }
      priceEur *= exchangeRate;
    }

    sendJson(response, 200, {
      price,
      currency,
      priceEur,
      image: typeof profile.logo === 'string' && profile.logo.startsWith('https://')
        ? profile.logo
        : '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`No se pudo obtener la cotización de ${symbol}.`, error);
    sendJson(response, error.message.startsWith('Configura FINNHUB_API_KEY') ? 503 : 502, {
      error: error.message,
    });
  }
}

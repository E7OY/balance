import { getFinnhubData, sendJson, sendMethodNotAllowed } from '../_marketData.js';

const periods = {
  LIVE: { duration: 24 * 60 * 60, resolution: '15' },
  '1D': { duration: 24 * 60 * 60, resolution: '15' },
  '1S': { duration: 7 * 24 * 60 * 60, resolution: '60' },
  '1M': { duration: 30 * 24 * 60 * 60, resolution: 'D' },
  '1A': { duration: 365 * 24 * 60 * 60, resolution: 'W' },
  TODO: { duration: 5 * 365 * 24 * 60 * 60, resolution: 'W' },
};

export default async function handler(request, response) {
  if (sendMethodNotAllowed(request, response)) return;

  const symbol = typeof request.query?.symbol === 'string' ? request.query.symbol.trim() : '';
  const period = typeof request.query?.period === 'string' ? request.query.period : '';
  const range = periods[period];
  if (!/^[\w.^=-]{1,30}$/.test(symbol) || !range) {
    sendJson(response, 400, { error: 'El símbolo o el periodo solicitado no es válido.' });
    return;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const [candles, profile] = await Promise.all([
      getFinnhubData('stock/candle', {
        symbol,
        resolution: range.resolution,
        from: String(now - range.duration),
        to: String(now),
      }),
      getFinnhubData('stock/profile2', { symbol }),
    ]);

    if (candles.s !== 'ok' || !Array.isArray(candles.t) || !Array.isArray(candles.c)
      || candles.t.length !== candles.c.length) {
      throw new Error('El proveedor no tiene histórico disponible para este activo y periodo.');
    }

    const currency = typeof profile.currency === 'string' ? profile.currency.toUpperCase() : '';
    if (!currency) throw new Error('No se pudo determinar la divisa del activo.');

    let euroRate = 1;
    if (currency !== 'EUR') {
      const fxUrl = new URL('https://api.frankfurter.dev/v1/latest');
      fxUrl.searchParams.set('base', currency);
      fxUrl.searchParams.set('symbols', 'EUR');
      const fxResponse = await fetch(fxUrl, { signal: AbortSignal.timeout(8000) });
      if (!fxResponse.ok) throw new Error('No se pudo convertir el histórico a euros.');
      euroRate = Number((await fxResponse.json()).rates?.EUR);
      if (!Number.isFinite(euroRate) || euroRate <= 0) {
        throw new Error('No se encontró un cambio válido para convertir el histórico a euros.');
      }
    }

    const points = candles.t.flatMap((timestamp, index) => {
      const price = Number(candles.c[index]) * euroRate;
      return Number.isFinite(price) && price > 0
        ? [{ timestamp: new Date(Number(timestamp) * 1000).toISOString(), price }]
        : [];
    });
    sendJson(response, 200, { points });
  } catch (error) {
    console.error(`No se pudo obtener el histórico de ${symbol}.`, error);
    sendJson(response, error.message.startsWith('Configura FINNHUB_API_KEY') ? 503 : 502, {
      error: error.message,
    });
  }
}

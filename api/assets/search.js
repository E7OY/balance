import { getFinnhubData, sendJson, sendMethodNotAllowed } from '../_marketData.js';

export default async function handler(request, response) {
  if (sendMethodNotAllowed(request, response)) return;

  const query = typeof request.query?.query === 'string' ? request.query.query.trim() : '';
  if (query.length < 2 || query.length > 80) {
    sendJson(response, 400, { error: 'La búsqueda debe tener entre 2 y 80 caracteres.' });
    return;
  }

  try {
    const data = await getFinnhubData('search', { q: query });
    const results = (Array.isArray(data.result) ? data.result : [])
      .filter((item) => /stock|equity|etf|mutual fund|fund|etp/i.test(item.type || ''))
      .slice(0, 10)
      .map((item) => ({
        provider: 'finnhub',
        id: item.symbol,
        symbol: item.displaySymbol || item.symbol,
        name: item.description || item.symbol,
        type: item.type || 'Activo',
      }));

    sendJson(response, 200, { results });
  } catch (error) {
    console.error('No se pudo buscar activos en Finnhub.', error);
    sendJson(response, error.message.startsWith('Configura FINNHUB_API_KEY') ? 503 : 502, {
      error: error.message,
    });
  }
}

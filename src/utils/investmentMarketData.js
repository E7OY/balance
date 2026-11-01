const FINNHUB_SEARCH_URL = '/api/assets/search';
const FINNHUB_QUOTE_URL = '/api/assets/quote';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const readJson = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    if (response.status === 429) {
      throw new Error('El proveedor ha limitado temporalmente las consultas. Prueba de nuevo en unos segundos.');
    }
    throw new Error(response.ok ? fallbackMessage : `${fallbackMessage} (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(data.error || (response.status === 429
      ? 'El proveedor ha limitado temporalmente las consultas. Prueba de nuevo en unos segundos.'
      : fallbackMessage));
  }
  return data;
};

const searchCryptoAssets = async (query, signal) => {
  const url = new URL(`${COINGECKO_BASE_URL}/search`);
  url.searchParams.set('query', query);
  const response = await fetch(url, { signal });
  const data = await readJson(response, 'No se pudieron buscar criptomonedas.');
  return (Array.isArray(data.coins) ? data.coins : [])
    .slice(0, 10)
    .map((coin) => ({
      provider: 'coingecko',
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'Criptomoneda',
      image: coin.thumb,
    }));
};

const searchFinancialAssets = async (query, signal) => {
  const url = new URL(FINNHUB_SEARCH_URL, window.location.origin);
  url.searchParams.set('query', query);
  const response = await fetch(url, { signal });
  const data = await readJson(
    response,
    'La búsqueda de fondos y acciones requiere las funciones de Vercel y FINNHUB_API_KEY.',
  );
  return Array.isArray(data.results) ? data.results : [];
};

export const searchInvestmentAssets = async (query, signal) => {
  const results = await Promise.allSettled([
    searchCryptoAssets(query, signal),
    searchFinancialAssets(query, signal),
  ]);
  if (signal?.aborted) throw signal.reason;

  const successfulResults = results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  if (successfulResults.length === 0) {
    const messages = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.message)
      .filter(Boolean);
    throw new Error(messages.join(' '));
  }

  const warnings = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message)
    .filter(Boolean);

  return {
    assets: successfulResults,
    warning: warnings.join(' '),
  };
};

export const getInvestmentQuote = async (asset, signal) => {
  if (asset.provider === 'coingecko') {
    const url = new URL(`${COINGECKO_BASE_URL}/simple/price`);
    url.searchParams.set('ids', asset.id);
    url.searchParams.set('vs_currencies', 'eur');
    const response = await fetch(url, { signal });
    const data = await readJson(response, 'No se pudo consultar el precio de la criptomoneda.');
    const priceEur = Number(data[asset.id]?.eur);
    if (!Number.isFinite(priceEur) || priceEur <= 0) {
      throw new Error('No hay una cotización disponible para esta criptomoneda.');
    }
    return {
      price: priceEur,
      currency: 'EUR',
      priceEur,
      updatedAt: new Date().toISOString(),
    };
  }

  if (asset.provider === 'finnhub') {
    const url = new URL(FINNHUB_QUOTE_URL, window.location.origin);
    url.searchParams.set('symbol', asset.id);
    const response = await fetch(url, { signal });
    return readJson(
      response,
      'La cotización de fondos y acciones requiere las funciones de Vercel y FINNHUB_API_KEY.',
    );
  }

  throw new Error('No se reconoce el proveedor de este activo.');
};

export const getInvestmentQuotes = async (assets) => {
  const quotes = new Map();
  const failures = [];
  const cryptoAssets = assets.filter((asset) => asset.provider === 'coingecko');
  const financialAssets = [...new Map(
    assets
      .filter((asset) => asset.provider === 'finnhub')
      .map((asset) => [asset.id, asset]),
  ).values()];
  const requests = [];
  assets
    .filter((asset) => !['coingecko', 'finnhub'].includes(asset.provider))
    .forEach((asset) => failures.push(new Error(`No se reconoce el proveedor de ${asset.name}.`)));

  if (cryptoAssets.length > 0) {
    requests.push((async () => {
      const url = new URL(`${COINGECKO_BASE_URL}/simple/price`);
      url.searchParams.set('ids', [...new Set(cryptoAssets.map((asset) => asset.id))].join(','));
      url.searchParams.set('vs_currencies', 'eur');
      const response = await fetch(url);
      const data = await readJson(response, 'No se pudieron consultar los precios de criptomonedas.');
      cryptoAssets.forEach((asset) => {
        const priceEur = Number(data[asset.id]?.eur);
        if (!Number.isFinite(priceEur) || priceEur <= 0) {
          failures.push(new Error(`No hay una cotización disponible para ${asset.name}.`));
          return;
        }
        quotes.set(`${asset.provider}:${asset.id}`, {
          price: priceEur,
          currency: 'EUR',
          priceEur,
          updatedAt: new Date().toISOString(),
        });
      });
    })());
  }

  financialAssets.forEach((asset) => {
    requests.push((async () => {
      quotes.set(`${asset.provider}:${asset.id}`, await getInvestmentQuote(asset));
    })());
  });

  const results = await Promise.allSettled(requests);
  results.forEach((result) => {
    if (result.status === 'rejected') failures.push(result.reason);
  });

  return { quotes, failures };
};

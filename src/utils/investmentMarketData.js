const FINNHUB_SEARCH_URL = '/api/assets/search';
const FINNHUB_QUOTE_URL = '/api/assets/quote';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Caché en localStorage para persistir entre recargas completas
const memoryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

const getStorageKey = (key) => `cg_cache_v2_${key}`;

const getCachedData = (key) => {
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.data;
  }
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {}
  return null;
};

const setCachedData = (key, data) => {
  const entry = { timestamp: Date.now(), data };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {}
};

const getAnySavedData = (key) => {
  if (memoryCache.has(key)) return memoryCache.get(key).data;
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    if (raw) return JSON.parse(raw).data;
  } catch {}
  return null;
};

// Control de flujo para no superar las 5-10 peticiones/min de CoinGecko
let lastRequestTime = 0;
const rateLimitedFetch = async (url, options = {}) => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLast));
  }
  lastRequestTime = Date.now();
  try {
    return await fetch(url, options);
  } catch (netError) {
    // Si el navegador bloquea por CORS o conexión caída, capturamos aquí
    return { ok: false, status: 429, error: netError };
  }
};

const readJson = async (response, fallbackMessage) => {
  if (!response || !response.json) {
    throw new Error(fallbackMessage);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.status === 429
      ? 'Límite de consultas de CoinGecko alcanzado temporalmente.'
      : fallbackMessage);
  }
  if (!response.ok) {
    throw new Error(data?.error || (response.status === 429 ? 'Límite de consultas alcanzado.' : fallbackMessage));
  }
  return data;
};

const fetchCachedJson = async (url, signal, fallbackMessage) => {
  const urlKey = url.toString();
  const cached = getCachedData(urlKey);
  if (cached) return cached;

  const response = await rateLimitedFetch(url, { signal });
  
  // Si falló (429 o bloqueo CORS) pero tenemos datos guardados antiguos, los usamos
  if (!response.ok || response.status === 429) {
    const saved = getAnySavedData(urlKey);
    if (saved) return saved;
  }

  // Si no había nada guardado e intentamos parsear
  try {
    const data = await readJson(response, fallbackMessage);
    setCachedData(urlKey, data);
    return data;
  } catch (err) {
    const saved = getAnySavedData(urlKey);
    if (saved) return saved;
    // Si no hay nada de nada, devolvemos un objeto vacío seguro para que la UI no reviente
    if (urlKey.includes('market_chart')) return { prices: [] };
    if (urlKey.includes('simple/price')) return {};
    throw err;
  }
};

const searchCryptoAssets = async (query, signal) => {
  const url = new URL(`${COINGECKO_BASE_URL}/search`);
  url.searchParams.set('query', query);
  try {
    const data = await fetchCachedJson(url, signal, 'No se pudieron buscar criptomonedas.');
    return (Array.isArray(data?.coins) ? data.coins : [])
      .slice(0, 10)
      .map((coin) => ({
        provider: 'coingecko',
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'Criptomoneda',
        image: coin.thumb,
      }));
  } catch {
    return [];
  }
};

const searchFinancialAssets = async (query, signal) => {
  try {
    const url = new URL(FINNHUB_SEARCH_URL, window.location.origin);
    url.searchParams.set('query', query);
    const response = await fetch(url, { signal });
    const data = await readJson(
      response,
      'La búsqueda de fondos y acciones requiere las funciones de Vercel y FINNHUB_API_KEY.',
    );
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return [];
  }
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

  return {
    assets: successfulResults,
    warning: '',
  };
};

export const getInvestmentQuote = async (asset, signal) => {
  if (asset.provider === 'coingecko') {
    const url = new URL(`${COINGECKO_BASE_URL}/simple/price`);
    url.searchParams.set('ids', asset.id);
    url.searchParams.set('vs_currencies', 'eur');
    const data = await fetchCachedJson(url, signal, 'No se pudo consultar el precio de la criptomoneda.');
    const priceEur = Number(data?.[asset.id]?.eur);
    if (Number.isFinite(priceEur) && priceEur > 0) {
      return {
        price: priceEur,
        currency: 'EUR',
        priceEur,
        updatedAt: new Date().toISOString(),
      };
    }
    // Si CoinGecko no responde o está limitado, devolvemos precio nulo controlado
    return {
      price: 0,
      currency: 'EUR',
      priceEur: 0,
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

export const getInvestmentHistory = async (asset, period, signal) => {
  if (asset.provider === 'coingecko') {
    const daysByPeriod = {
      LIVE: '1',
      '1D': '1',
      '1S': '7',
      '1M': '30',
      '3M': '90',
      '1A': '365',
      TODO: 'max',
    };
    const days = daysByPeriod[period] || '30';
    const url = new URL(`${COINGECKO_BASE_URL}/coins/${encodeURIComponent(asset.id)}/market_chart`);
    url.searchParams.set('vs_currency', 'eur');
    url.searchParams.set('days', days);
    
    const data = await fetchCachedJson(url, signal, 'No se pudo consultar el histórico de la criptomoneda.');
    return (Array.isArray(data?.prices) ? data.prices : []).flatMap(([timestamp, value]) => {
      const price = Number(value);
      return Number.isFinite(Number(timestamp)) && Number.isFinite(price) && price > 0
        ? [{ timestamp: new Date(Number(timestamp)).toISOString(), price }]
        : [];
    });
  }

  if (asset.provider === 'finnhub') {
    const url = new URL('/api/assets/history', window.location.origin);
    url.searchParams.set('symbol', asset.id);
    url.searchParams.set('period', period);
    const response = await fetch(url, { signal });
    const data = await readJson(response, 'No se pudo consultar el histórico del activo.');
    if (!Array.isArray(data?.points)) {
      return [];
    }
    return data.points;
  }

  return [];
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

  if (cryptoAssets.length > 0) {
    requests.push((async () => {
      const url = new URL(`${COINGECKO_BASE_URL}/simple/price`);
      url.searchParams.set('ids', [...new Set(cryptoAssets.map((asset) => asset.id))].join(','));
      url.searchParams.set('vs_currencies', 'eur');
      const data = await fetchCachedJson(url, undefined, 'No se pudieron consultar los precios de criptomonedas.');
      cryptoAssets.forEach((asset) => {
        const priceEur = Number(data?.[asset.id]?.eur);
        if (Number.isFinite(priceEur) && priceEur > 0) {
          quotes.set(`${asset.provider}:${asset.id}`, {
            price: priceEur,
            currency: 'EUR',
            priceEur,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    })());
  }

  financialAssets.forEach((asset) => {
    requests.push((async () => {
      try {
        quotes.set(`${asset.provider}:${asset.id}`, await getInvestmentQuote(asset));
      } catch (e) {
        failures.push(e);
      }
    })());
  });

  await Promise.allSettled(requests);
  return { quotes, failures };
};

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export const getFinnhubData = async (endpoint, params = {}) => {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    throw new Error('Configura FINNHUB_API_KEY en las variables de entorno de Vercel.');
  }

  const url = new URL(`${FINNHUB_BASE_URL}/${endpoint}`);
  Object.entries({ ...params, token }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`El proveedor de mercado respondió con el código ${response.status}.`);
  }

  return response.json();
};

export const sendJson = (response, status, data) => {
  response.setHeader('Cache-Control', 'no-store');
  response.status(status).json(data);
};

export const sendMethodNotAllowed = (request, response) => {
  if (request.method === 'GET') return false;
  response.setHeader('Allow', 'GET');
  sendJson(response, 405, { error: 'Método no permitido.' });
  return true;
};

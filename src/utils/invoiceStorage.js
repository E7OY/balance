const DATABASE_NAME = 'balance-tracker-files';
const DATABASE_VERSION = 1;
const STORE_NAME = 'invoices';

const getInvoiceKey = (transactionId, profileId) =>
  profileId === 'default' ? transactionId : `${profileId}:${transactionId}`;

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('Este navegador no permite guardar archivos de facturas.'));
    return;
  }

  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento de facturas.'));
});

const runTransaction = async (mode, action) => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;

    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('No se pudo guardar el archivo de factura.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error('Se canceló el almacenamiento del archivo de factura.'));
    };

    try {
      result = action(store);
      if (result && typeof result === 'object' && 'onsuccess' in result) {
        result.onsuccess = () => {
          result = result.result;
        };
      }
    } catch (error) {
      transaction.abort();
      database.close();
      reject(error);
    }
  });
};

export const saveInvoice = (transactionId, file, profileId = 'default') =>
  runTransaction('readwrite', (store) => store.put({
    blob: file,
    name: file.name,
    type: file.type,
    size: file.size,
  }, getInvoiceKey(transactionId, profileId)));

export const getInvoice = (transactionId, profileId = 'default') =>
  runTransaction('readonly', (store) => store.get(getInvoiceKey(transactionId, profileId)));

export const deleteInvoice = (transactionId, profileId = 'default') =>
  runTransaction('readwrite', (store) => store.delete(getInvoiceKey(transactionId, profileId)));

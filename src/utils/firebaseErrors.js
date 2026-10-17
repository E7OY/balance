const firebaseErrorMessages = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'auth/user-not-found': 'No existe una cuenta con ese correo. Comprueba el correo o crea una cuenta.',
  'auth/wrong-password': 'La contraseña no es correcta. Revísala e inténtalo de nuevo.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos. Comprueba los datos o crea una cuenta.',
  'auth/too-many-requests': 'Se han hecho demasiados intentos. Espera un momento antes de volver a intentarlo.',
  'auth/network-request-failed': 'No se pudo conectar con Firebase. Comprueba tu conexión a Internet.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está activado en Firebase Authentication.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo que usa otro método de acceso.',
  'auth/email-not-verified': 'Debes verificar tu correo antes de continuar.',
  'permission-denied': 'Firebase ha denegado el acceso. Comprueba que las reglas de Firestore estén publicadas.',
  'unavailable': 'Firebase no está disponible ahora. Comprueba tu conexión e inténtalo de nuevo.',
  'failed-precondition': 'Firestore no está configurado correctamente. Comprueba la base de datos y sus reglas.',
};

export const getFirebaseErrorMessage = (error, fallback = 'No se pudo completar la operación con Firebase.') => {
  if (!error) return fallback;
  return firebaseErrorMessages[error.code] || error.message || fallback;
};

const biometricStorageKey = (profileId) => `finance:${profileId}:biometricCredential`;

const encodeBase64Url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeBase64Url = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(paddedBase64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const createChallenge = () => crypto.getRandomValues(new Uint8Array(32));

const requireBiometricSupport = () => {
  if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials) {
    throw new Error('La autenticación biométrica requiere un navegador compatible y una conexión segura (HTTPS).');
  }
};

export const getBiometricCredentialId = (profileId) => {
  try {
    return localStorage.getItem(biometricStorageKey(profileId));
  } catch (error) {
    console.error('No se pudo leer la configuración biométrica.', error);
    return null;
  }
};

export const registerBiometricCredential = async (profile) => {
  requireBiometricSupport();
  const challenge = createChallenge();
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Balance' },
      user: {
        id: new TextEncoder().encode(profile.id),
        name: profile.id,
        displayName: profile.name,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'discouraged',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    },
  });
  if (!credential) throw new Error('No se completó el registro biométrico.');

  try {
    localStorage.setItem(biometricStorageKey(profile.id), encodeBase64Url(credential.rawId));
  } catch (error) {
    console.error('No se pudo guardar la configuración biométrica.', error);
    throw new Error('No se pudo guardar la configuración biométrica en este dispositivo.');
  }
  window.dispatchEvent(new CustomEvent('balance:biometric-configuration-changed'));
};

export const authenticateBiometric = async (profileId) => {
  const credentialId = getBiometricCredentialId(profileId);
  if (!credentialId) throw new Error('No hay una credencial biométrica configurada para este perfil.');
  requireBiometricSupport();

  const challenge = createChallenge();
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: 'public-key', id: decodeBase64Url(credentialId) }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  if (!credential || encodeBase64Url(credential.rawId) !== credentialId) {
    throw new Error('No se pudo verificar la credencial biométrica de este perfil.');
  }

  const clientData = JSON.parse(new TextDecoder().decode(credential.response.clientDataJSON));
  if (
    clientData.type !== 'webauthn.get'
    || clientData.challenge !== encodeBase64Url(challenge)
    || clientData.origin !== window.location.origin
  ) {
    throw new Error('La respuesta biométrica no corresponde a esta solicitud.');
  }

  const authenticatorData = new Uint8Array(credential.response.authenticatorData);
  if (authenticatorData.length < 33 || (authenticatorData[32] & 0x04) === 0) {
    throw new Error('El dispositivo no confirmó la verificación biométrica.');
  }
};

export const removeBiometricCredential = (profileId) => {
  try {
    localStorage.removeItem(biometricStorageKey(profileId));
  } catch (error) {
    console.error('No se pudo desactivar la configuración biométrica.', error);
    throw new Error('No se pudo desactivar el bloqueo biométrico en este dispositivo.');
  }
  window.dispatchEvent(new CustomEvent('balance:biometric-configuration-changed'));
};

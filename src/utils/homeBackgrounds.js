export const HOME_BG_STORAGE_KEY = 'nexo-home-background';
export const HOME_BG_EVENT = 'nexo-bg-changed';

export const HOME_BACKGROUNDS = [
  {
    id: 'indigo-wave',
    name: 'Índigo',
    shortName: 'Índigo',
    category: 'Glass',
    css: "url('/hero_bg.jpg') center top / cover no-repeat, radial-gradient(85% 70% at 82% 28%, #7C6BFF 0%, #3D17EE 48%, #1A1060 100%)",
    thumbCss: "url('/hero_bg.jpg') center / cover no-repeat, linear-gradient(155deg, #5B46FF 0%, #3D17EE 55%, #1A1060 100%)",
  },
  {
    id: 'alex-cobalt',
    name: 'Alex K. Cobalto',
    shortName: 'Alex K.',
    category: 'Glass',
    css: 'linear-gradient(90deg, rgba(10,16,32,0.92) 0%, rgba(28,58,138,0.55) 26%, rgba(88,130,255,0.42) 31%, rgba(12,20,42,0.94) 35%, rgba(37,78,196,0.75) 68%, rgba(110,152,255,0.6) 100%), radial-gradient(90% 80% at 75% 30%, #3B6EF6 0%, #0B1224 100%)',
    thumbCss: 'linear-gradient(90deg, #0B1224 0%, #3B6EF6 30%, #0E1730 36%, #2952C8 72%, #7AA2FF 100%)',
  },
  {
    id: 'lines-minimal',
    name: 'Líneas Obsidian',
    shortName: 'Lines',
    category: 'Minimal',
    css: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 28px), radial-gradient(75% 65% at 50% 20%, #1E2436 0%, #07090E 65%, #000000 100%)',
    thumbCss: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12px), radial-gradient(circle at 50% 25%, #232A3E 0%, #05070B 100%)',
  },
  {
    id: 'acid-glass',
    name: 'Cristal Lima',
    shortName: 'Glass',
    category: 'Glass',
    css: 'radial-gradient(70% 85% at 62% 45%, rgba(190, 242, 45, 0.72) 0%, rgba(101, 138, 18, 0.45) 42%, rgba(14, 18, 10, 0.96) 85%), linear-gradient(125deg, #161C0E 0%, #4E6B12 52%, #B8E62E 100%)',
    thumbCss: 'linear-gradient(135deg, #1A2210 0%, #5B7C16 50%, #C6F438 100%)',
  },
  {
    id: 'amber-bronze',
    name: 'Ámbar Cobre',
    shortName: 'Ámbar',
    category: 'Glass',
    css: 'radial-gradient(80% 75% at 72% 35%, rgba(235, 134, 68, 0.68) 0%, rgba(124, 58, 24, 0.5) 48%, rgba(18, 12, 10, 0.96) 90%), linear-gradient(150deg, #1C120E 0%, #7C3D1E 55%, #E08A54 100%)',
    thumbCss: 'linear-gradient(145deg, #221611 0%, #8C4724 55%, #E89662 100%)',
  },
  {
    id: 'crimson-velvet',
    name: 'Carmesí',
    shortName: 'Carmesí',
    category: 'Colores',
    css: 'radial-gradient(75% 80% at 35% 65%, rgba(225, 29, 72, 0.78) 0%, rgba(115, 14, 38, 0.65) 50%, rgba(20, 8, 14, 0.96) 92%), linear-gradient(145deg, #240B14 0%, #881337 55%, #E11D48 100%)',
    thumbCss: 'linear-gradient(145deg, #2A0D17 0%, #9F1239 55%, #F43F5E 100%)',
  },
  {
    id: 'magenta-noir',
    name: 'Magenta Noir',
    shortName: 'Magenta',
    category: 'Colores',
    css: 'linear-gradient(95deg, #16151A 0%, #2B2430 46%, #E855B5 52%, #F472D0 78%, #9D177D 100%)',
    thumbCss: 'linear-gradient(95deg, #18171C 0%, #2C2531 46%, #EC58B9 52%, #F472D0 100%)',
  },
  {
    id: 'solar-coral',
    name: 'Coral Solar',
    shortName: 'Coral',
    category: 'Colores',
    css: 'radial-gradient(80% 80% at 65% 35%, rgba(255, 118, 72, 0.85) 0%, rgba(217, 65, 38, 0.72) 55%, rgba(68, 18, 12, 0.95) 100%), linear-gradient(145deg, #6B1D12 0%, #E04F33 50%, #FF8A65 100%)',
    thumbCss: 'linear-gradient(145deg, #7C2215 0%, #E85538 55%, #FF9675 100%)',
  },
  {
    id: 'emerald-deep',
    name: 'Esmeralda',
    shortName: 'Esmeralda',
    category: 'Colores',
    css: 'linear-gradient(100deg, #121D1A 0%, #2B5244 45%, #00A87E 53%, #065F46 85%, #062820 100%)',
    thumbCss: 'linear-gradient(100deg, #15221E 0%, #315D4D 45%, #00B386 53%, #064E3B 100%)',
  },
  {
    id: 'titanium-smoke',
    name: 'Titanio',
    shortName: 'Titanio',
    category: 'Minimal',
    css: 'radial-gradient(75% 75% at 65% 40%, rgba(120, 126, 138, 0.42) 0%, rgba(44, 47, 54, 0.78) 55%, #0B0C0E 100%), linear-gradient(140deg, #121316 0%, #2D3038 55%, #4B505C 100%)',
    thumbCss: 'linear-gradient(140deg, #141519 0%, #32363F 55%, #585E6B 100%)',
  },
  {
    id: 'obsidian-pure',
    name: 'Negro puro',
    shortName: 'Negro',
    category: 'Minimal',
    css: '#000000',
    thumbCss: '#000000',
  },
];

export const getSavedHomeBackground = () => {
  try {
    const raw = localStorage.getItem(HOME_BG_STORAGE_KEY);
    if (!raw) {
      const legacyColorful = localStorage.getItem('nexo-colorful-hero');
      return { id: legacyColorful === 'false' ? 'obsidian-pure' : 'indigo-wave', customImage: null };
    }
    const parsed = JSON.parse(raw);
    if (parsed?.customImage) return { id: 'custom', customImage: parsed.customImage };
    if (parsed?.id && HOME_BACKGROUNDS.some((b) => b.id === parsed.id)) {
      return { id: parsed.id, customImage: null };
    }
  } catch {}
  return { id: 'indigo-wave', customImage: null };
};

export const saveHomeBackground = (config) => {
  try {
    localStorage.setItem(HOME_BG_STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem('nexo-colorful-hero', String(config.id !== 'obsidian-pure'));
    window.dispatchEvent(new CustomEvent(HOME_BG_EVENT, { detail: config }));
  } catch (err) {
    throw new Error('No se pudo guardar la imagen porque ocupa demasiado espacio.');
  }
};

export const resolveBackgroundCss = (config) => {
  if (config?.customImage) {
    return `url('\${config.customImage}') center top / cover no-repeat`;
  }
  const preset = HOME_BACKGROUNDS.find((b) => b.id === config?.id) || HOME_BACKGROUNDS[0];
  return preset.css;
};

export const compressImageToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file || !file.type.startsWith('image/')) {
    reject(new Error('Selecciona un archivo de imagen válido.'));
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
    img.onload = () => {
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
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
    id: 'revolut-chromatic-prism',
    name: 'Prisma Cromático',
    shortName: 'Chromatic',
    category: 'Glass',
    css: [
      'linear-gradient(112deg, transparent 0%, transparent 36%, rgba(255, 255, 255, 0.22) 41%, rgba(56, 189, 248, 0.45) 44%, rgba(236, 72, 153, 0.52) 50%, transparent 58%)',
      'radial-gradient(110% 75% at 92% 8%, rgba(34, 211, 238, 0.82) 0%, rgba(59, 130, 246, 0.48) 38%, transparent 68%)',
      'radial-gradient(95% 80% at 10% 22%, rgba(168, 85, 247, 0.88) 0%, rgba(99, 102, 241, 0.45) 44%, transparent 72%)',
      'radial-gradient(85% 65% at 58% 68%, rgba(244, 63, 94, 0.65) 0%, rgba(251, 146, 60, 0.32) 45%, transparent 72%)',
      'linear-gradient(165deg, #0B0820 0%, #16103A 48%, #070812 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(118deg, #311068 0%, #7C3AED 28%, #EC4899 50%, #38BDF8 76%, #0B132B 100%)',
  },
  {
    id: 'revolut-northern-silk',
    name: 'Aurora Boreal',
    shortName: 'Aurora',
    category: 'Glass',
    css: [
      'radial-gradient(130% 52% at 50% -8%, rgba(45, 212, 191, 0.78) 0%, rgba(16, 185, 129, 0.35) 42%, transparent 70%)',
      'linear-gradient(125deg, rgba(139, 92, 246, 0.55) 0%, transparent 42%, rgba(14, 165, 233, 0.52) 68%, rgba(192, 132, 252, 0.4) 100%)',
      'radial-gradient(85% 70% at 88% 36%, rgba(168, 85, 247, 0.72) 0%, transparent 62%)',
      'radial-gradient(80% 65% at 12% 48%, rgba(6, 182, 212, 0.65) 0%, transparent 64%)',
      'linear-gradient(180deg, #071929 0%, #111336 56%, #070913 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(135deg, #2DD4BF 0%, #0EA5E9 38%, #8B5CF6 74%, #0F1029 100%)',
  },
  {
    id: 'revolut-sapphire-fold',
    name: 'Pliegue Zafiro',
    shortName: 'Zafiro',
    category: 'Glass',
    css: [
      'linear-gradient(104deg, rgba(5, 10, 28, 0.94) 0%, rgba(18, 42, 118, 0.72) 28%, rgba(96, 165, 250, 0.62) 33%, rgba(8, 16, 44, 0.95) 37%, rgba(37, 99, 235, 0.78) 69%, rgba(125, 211, 252, 0.7) 75%, rgba(9, 15, 38, 0.96) 81%)',
      'radial-gradient(95% 75% at 74% 24%, #2563EB 0%, #1E1B4B 62%, #050816 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(104deg, #070D24 0%, #2563EB 31%, #091230 37%, #38BDF8 73%, #080E24 100%)',
  },
  {
    id: 'revolut-arctic-crystal',
    name: 'Cristal Ártico',
    shortName: 'Ártico',
    category: 'Glass',
    css: [
      'linear-gradient(132deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.02) 32%, rgba(186, 230, 253, 0.34) 48%, rgba(255, 255, 255, 0) 64%)',
      'radial-gradient(95% 70% at 18% 12%, rgba(125, 211, 252, 0.86) 0%, rgba(56, 189, 248, 0.38) 45%, transparent 72%)',
      'radial-gradient(90% 75% at 86% 24%, rgba(129, 140, 248, 0.84) 0%, rgba(99, 102, 241, 0.38) 48%, transparent 74%)',
      'linear-gradient(180deg, #0F2547 0%, #162347 54%, #090E1C 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 34%, #6366F1 72%, #0F172A 100%)',
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
    id: 'revolut-cyber-mint',
    name: 'Menta Cibernética',
    shortName: 'Menta',
    category: 'Glass',
    css: [
      'linear-gradient(108deg, transparent 24%, rgba(163, 230, 53, 0.28) 38%, rgba(34, 211, 238, 0.44) 45%, transparent 56%)',
      'radial-gradient(90% 65% at 84% 14%, rgba(52, 211, 153, 0.82) 0%, rgba(16, 185, 129, 0.34) 46%, transparent 72%)',
      'radial-gradient(85% 70% at 14% 32%, rgba(14, 165, 233, 0.76) 0%, transparent 66%)',
      'linear-gradient(175deg, #062121 0%, #0A2536 54%, #050B11 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(135deg, #A3E635 0%, #10B981 42%, #0284C7 80%, #05131D 100%)',
  },
  {
    id: 'revolut-infrared-sunset',
    name: 'Horizonte Infrarrojo',
    shortName: 'Infrarrojo',
    category: 'Colores',
    css: [
      'radial-gradient(105% 62% at 50% 0%, rgba(251, 146, 60, 0.88) 0%, rgba(244, 63, 94, 0.62) 42%, transparent 74%)',
      'radial-gradient(90% 70% at 88% 38%, rgba(217, 70, 239, 0.76) 0%, rgba(124, 58, 237, 0.44) 48%, transparent 74%)',
      'radial-gradient(85% 65% at 12% 46%, rgba(225, 29, 72, 0.72) 0%, transparent 68%)',
      'linear-gradient(180deg, #330C1E 0%, #1E0B2B 58%, #09070F 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(140deg, #FB923C 0%, #F43F5E 42%, #A855F7 78%, #160924 100%)',
  },
  {
    id: 'revolut-lavender-haze',
    name: 'Seda Lavanda',
    shortName: 'Lavanda',
    category: 'Colores',
    css: [
      'linear-gradient(118deg, rgba(255, 255, 255, 0.18) 0%, transparent 28%, rgba(216, 180, 254, 0.34) 47%, rgba(244, 114, 182, 0.32) 56%, transparent 72%)',
      'radial-gradient(95% 70% at 22% 14%, rgba(192, 132, 252, 0.86) 0%, rgba(139, 92, 246, 0.46) 46%, transparent 74%)',
      'radial-gradient(90% 68% at 84% 28%, rgba(244, 114, 182, 0.74) 0%, rgba(99, 102, 241, 0.42) 52%, transparent 76%)',
      'linear-gradient(175deg, #271347 0%, #1F143B 54%, #0B0916 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(135deg, #E9D5FF 0%, #C084FC 35%, #EC4899 70%, #1E1238 100%)',
  },
  {
    id: 'revolut-emerald-vault',
    name: 'Bóveda Esmeralda',
    shortName: 'Bóveda',
    category: 'Colores',
    css: [
      'linear-gradient(106deg, rgba(4, 18, 15, 0.92) 0%, rgba(6, 78, 59, 0.72) 34%, rgba(52, 211, 153, 0.62) 41%, rgba(5, 24, 21, 0.94) 47%, rgba(16, 185, 129, 0.68) 76%, rgba(4, 15, 14, 0.96) 100%)',
      'radial-gradient(90% 75% at 72% 24%, #10B981 0%, #064E3B 55%, #03110E 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(106deg, #051814 0%, #059669 36%, #34D399 44%, #062820 52%, #10B981 84%)',
  },
  {
    id: 'revolut-velvet-rose',
    name: 'Terciopelo Rose Gold',
    shortName: 'Rose Gold',
    category: 'Colores',
    css: [
      'radial-gradient(100% 65% at 78% 12%, rgba(253, 186, 116, 0.62) 0%, rgba(244, 114, 182, 0.48) 38%, transparent 70%)',
      'radial-gradient(90% 70% at 18% 26%, rgba(251, 113, 133, 0.78) 0%, rgba(159, 18, 57, 0.48) 50%, transparent 76%)',
      'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 40%, rgba(253, 164, 175, 0.22) 58%, transparent 80%)',
      'linear-gradient(170deg, #3A1522 0%, #26101B 56%, #0D080C 100%)',
    ].join(', '),
    thumbCss: 'linear-gradient(135deg, #FDBA74 0%, #FB7185 42%, #9F1239 78%, #1C0B13 100%)',
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
    id: 'revolut-ultra-platinum',
    name: 'Ultra Platinum',
    shortName: 'Ultra',
    category: 'Minimal',
    css: [
      'repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.025) 0px, rgba(255, 255, 255, 0.025) 1px, transparent 1px, transparent 9px)',
      'conic-gradient(from 205deg at 68% 28%, #181B22 0deg, #646E82 52deg, #CBD5E1 84deg, #333A48 138deg, #0F1218 225deg, #525B6E 308deg, #181B22 360deg)',
    ].join(', '),
    thumbCss: 'conic-gradient(from 205deg at 65% 35%, #181B22 0deg, #646E82 55deg, #E2E8F0 88deg, #2D3442 145deg, #0F1218 240deg, #525B6E 315deg, #181B22 360deg)',
  },
  {
    id: 'revolut-metal-gold',
    name: 'Metal Gold 24K',
    shortName: 'Gold',
    category: 'Minimal',
    css: [
      'repeating-linear-gradient(110deg, rgba(255, 238, 190, 0.025) 0px, rgba(255, 238, 190, 0.025) 1px, transparent 1px, transparent 10px)',
      'conic-gradient(from 215deg at 70% 26%, #1C150B 0deg, #85622A 54deg, #E7C677 86deg, #5C4119 142deg, #120E08 232deg, #9B7432 312deg, #1C150B 360deg)',
    ].join(', '),
    thumbCss: 'conic-gradient(from 215deg at 65% 35%, #1C150B 0deg, #85622A 55deg, #F3D78D 88deg, #5C4119 145deg, #120E08 235deg, #9B7432 315deg, #1C150B 360deg)',
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
    return `url('${config.customImage}') center top / cover no-repeat`;
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
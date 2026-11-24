export const DICEBEAR_SEEDS = [
  'Felix', 'Luna', 'Aneka', 'Oliver',
  'Maya', 'Leo', 'Sofia', 'Mateo',
  'Nora', 'Hugo', 'Valeria', 'Daniel',
];

export const getDiceBearAvatar = (seed = 'Felix') =>
  `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export const getRandomSeeds = (count = 12) =>
  Array.from({ length: count }, () => Math.random().toString(36).slice(2, 9));

// Opcional: por si también quieres permitir subir foto desde galería
export const processAvatarFile = (file, size = 256) => new Promise((resolve, reject) => {
  if (!file || !file.type.startsWith('image/')) {
    reject(new Error('Selecciona una imagen válida.'));
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('Formato de imagen no compatible.'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});